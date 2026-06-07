"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminToken, setAdminToken] = useState('');
  
  const [activeTab, setActiveTab] = useState('add');
  const [formData, setFormData] = useState({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [productList, setProductList] = useState([]);
  const [logList, setLogList] = useState([]);
  const [orderList, setOrderList] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: '' });
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  // Sayfa açıldığında hafızada yetki var mı kontrol et
  useEffect(() => {
    const token = sessionStorage.getItem('tutu_admin_token');
    if (token) { setAdminToken(token); setIsAuthenticated(true); }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs', { headers: { 'Authorization': passwordInput } });
      if (response.status === 403) { alert('Hatalı Şifre!'); } 
      else {
        sessionStorage.setItem('tutu_admin_token', passwordInput);
        setAdminToken(passwordInput); setIsAuthenticated(true);
      }
    } catch (error) { alert("Sunucuya bağlanılamadı."); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tutu_admin_token');
    setIsAuthenticated(false); setAdminToken(''); window.location.reload();
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      if (data.success) setProductList(data.data || []);
    } catch (error) {} 
    finally { setIsProductsLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('https://tutu-backend-api.onrender.com/api/logs', { headers: { 'Authorization': adminToken } });
      const data = await res.json();
      if (data.success) setLogList(data.data);
    } catch (error) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('https://tutu-backend-api.onrender.com/api/orders/all', { headers: { 'Authorization': adminToken } });
      const data = await res.json();
      if (data.success) setOrderList(data.data);
    } catch (error) {}
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`https://tutu-backend-api.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) setOrderList(orderList.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {}
  };

  const handleUpdateProduct = async (id) => {
    try {
      const res = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); fetchProducts(); }
    } catch (error) {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': adminToken } });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (error) {}
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // ==========================================
  // CLOUDINARY RESİM YÜKLEME MOTORU
  // ==========================================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Resim Cloudinary sunucusuna yükleniyor ve optimize ediliyor...' });

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'tutu_uploads'); // Cloudinary'de oluşturduğumuz Unsigned Preset Adı

    // DİKKAT: SENIN_CLOUD_NAME_BURAYA yazan yeri kendi Cloud Name'in ile değiştir!
const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/denlwno3i/image/upload';

    try {
      const res = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();

      if (data.secure_url) {
        // Yükleme başarılı, kalıcı linki form datasına ekle
        setFormData({ ...formData, image_url: data.secure_url });
        setStatus({ type: 'success', message: 'Resim başarıyla yüklendi! Artık ürünü ekleyebilirsiniz.' });
      } else {
        setStatus({ type: 'error', message: 'Resim yükleme hatası. Cloudinary ayarlarınızı kontrol edin.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Sunucu bağlantı hatası.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      setStatus({ type: 'error', message: 'Lütfen önce bir ürün resmi yükleyin!' });
      return;
    }

    setStatus({ type: 'loading', message: 'Ürün veritabanına ekleniyor...' });
    try {
      const res = await fetch('https://tutu-backend-api.onrender.com/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Ürün Başarıyla Eklendi!' });
        setFormData({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
        // Dosya seçici input'u temizle
        document.getElementById('imageUploadInput').value = '';
        fetchProducts();
      }
    } catch (error) { setStatus({ type: 'error', message: 'Yetkiniz reddedildi veya bağlantı koptu.' }); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'list') fetchProducts();
      if (activeTab === 'logs') fetchLogs();
      if (activeTab === 'orders') fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-extrabold mb-2">TUTU<span className="text-[#db2777]">.</span></h1>
          <p className="text-neutral-500 mb-8 font-medium">Güvenli Yönetici Girişi</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Şifrenizi Girin" className="w-full px-4 py-3 rounded-lg border focus:border-pink-500 mb-4 text-center tracking-widest" required />
            <button type="submit" className="w-full bg-[#db2777] text-white font-bold py-3 rounded-lg hover:bg-neutral-900 transition">GİRİŞ YAP</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 md:min-h-screen bg-neutral-900 text-white flex flex-col">
        <div className="p-6 border-b border-neutral-800"><h1 className="text-2xl font-extrabold tracking-tighter">TUTU<span className="text-[#db2777]">.</span></h1></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('add')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'add' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>📦 Yeni Ürün Ekle</button>
          <button onClick={() => setActiveTab('list')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'list' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>📋 Ürün Listesi</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'orders' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>💳 Sipariş Yönetimi</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-md font-semibold text-red-500 mt-8 hover:bg-neutral-800">🚪 Güvenli Çıkış</button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* YENİ ÜRÜN EKLEME */}
        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-5 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h2>
            
            {status.message && (
              <div className={`p-4 mb-6 rounded-lg font-bold text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Ürün Adı (Örn: Siyah Triko Elbise)" />
              
              {/* CLOUDINARY DOSYA YÜKLEME ALANI */}
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center bg-neutral-50 hover:bg-neutral-100 transition">
                <label className="block text-sm font-bold text-neutral-700 mb-2">Ürün Fotoğrafı Yükle</label>
                <input 
                  type="file" 
                  id="imageUploadInput"
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                />
                {formData.image_url && (
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-xs text-green-600 font-bold mb-2">✓ Resim Hazır</span>
                    <img src={formData.image_url} alt="Önizleme" className="h-32 object-contain rounded border shadow-sm" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Fiyat (TL)" />
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Stok Adedi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg font-medium text-neutral-700">
                  <option value="GİYİM">GİYİM</option>
                  <option value="ÇANTA">ÇANTA</option>
                  <option value="AKSESUAR">AKSESUAR</option>
                </select>
                <input type="text" name="tag" value={formData.tag} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" placeholder="Etiket (Örn: ÇOK SATAN)" />
              </div>

              <button type="submit" disabled={status.type === 'loading'} className="w-full bg-neutral-900 text-white font-bold py-4 rounded-lg hover:bg-[#db2777] transition shadow-lg disabled:bg-neutral-400">
                ÜRÜNÜ YAYINLA
              </button>
            </form>
          </div>
        )}

        {/* ÜRÜN LİSTESİ */}
        {activeTab === 'list' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Mevcut Ürünler</h2>
            {isProductsLoading ? <p className="text-neutral-500 font-bold">Yükleniyor...</p> : productList.length === 0 ? <p className="text-neutral-500">Sistemde ürün yok.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-neutral-500"><th className="py-3 px-4">Görsel</th><th className="py-3 px-4">Adı</th><th className="py-3 px-4">Fiyat</th><th className="py-3 px-4">İşlem</th></tr>
                  </thead>
                  <tbody>
                    {productList.map(p => (
                      <tr key={p.id} className="border-b hover:bg-neutral-50">
                        <td className="py-2 px-4"><img src={p.image_url} className="w-10 h-10 object-cover rounded border" /></td>
                        {editingId === p.id ? (
                          <>
                            <td className="py-3 px-4"><input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="border px-2 py-1 w-full" /></td>
                            <td className="py-3 px-4"><input type="number" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} className="border px-2 py-1 w-24" /></td>
                            <td className="py-3 px-4 flex gap-2"><button onClick={() => handleUpdateProduct(p.id)} className="bg-green-600 text-white px-3 py-1 text-xs rounded">Kaydet</button><button onClick={() => setEditingId(null)} className="bg-neutral-400 text-white px-3 py-1 text-xs rounded">İptal</button></td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 font-bold text-sm">{p.name}</td>
                            <td className="py-4 px-4 text-[#db2777] font-black text-sm">{p.price} TL</td>
                            <td className="py-4 px-4 flex gap-2">
                              <button onClick={() => {setEditingId(p.id); setEditFormData({name: p.name, price: p.price});}} className="text-blue-600 bg-blue-50 px-3 py-1 rounded text-xs font-bold">Düzenle</button>
                              <button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded text-xs font-bold">Sil</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SİPARİŞLER (Basitleştirilmiş Görünüm) */}
        {activeTab === 'orders' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Sipariş Yönetimi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-neutral-50 border-b"><th className="p-4">Müşteri</th><th className="p-4">Tutar</th><th className="p-4">Durum</th></tr></thead>
                <tbody>
                  {orderList.map(order => (
                    <tr key={order.id} className="border-b">
                      <td className="p-4"><p className="font-bold">{order.customer_name}</p><p className="text-xs text-neutral-500">{order.phone}</p></td>
                      <td className="p-4 font-black">{order.total_amount} TL</td>
                      <td className="p-4">
                        <select value={order.status || 'Hazırlanıyor'} onChange={(e) => handleOrderStatusChange(order.id, e.target.value)} className="border p-1 text-xs rounded">
                          {statusSteps.map(step => <option key={step} value={step}>{step}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}