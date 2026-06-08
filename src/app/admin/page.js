"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminToken, setAdminToken] = useState('');
  
  const [activeTab, setActiveTab] = useState('add');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: 'ÜST GİYİM', 
    tag: '', 
    is_new: false, 
    image_url: '', 
    gallery_images: [], 
    stock: '', 
    description: '',
    colors: 'Siyah, Beyaz', 
    sizes: 'S, M, L'
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [productList, setProductList] = useState([]);
  const [logList, setLogList] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: '', description: '', colors: '', sizes: '' });

  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productFetchError, setProductFetchError] = useState('');
  const [orderList, setOrderList] = useState([]);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  useEffect(() => {
    const token = sessionStorage.getItem('tutu_admin_token');
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs', {
        headers: { 'Authorization': passwordInput }
      });
      if (response.status === 403) {
        alert('Hatalı Şifre!');
      } else {
        sessionStorage.setItem('tutu_admin_token', passwordInput);
        setAdminToken(passwordInput);
        setIsAuthenticated(true);
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tutu_admin_token');
    setIsAuthenticated(false);
    setAdminToken('');
    window.location.reload();
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    setProductFetchError('');
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      if (data.success) setProductList(data.data || []);
      else setProductFetchError(data.message || 'Ürünler alınamadı.');
    } catch (error) {
      setProductFetchError('Sunucuya bağlanılamadı.');
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs', {
        headers: { 'Authorization': adminToken }
      });
      const data = await response.json();
      if (data.success) setLogList(data.data);
    } catch (error) {}
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/orders/all', {
        headers: { 'Authorization': adminToken }
      });
      const data = await response.json();
      if (data.success) setOrderList(data.data);
    } catch (error) {}
  };

  const handleUpdateProduct = async (id) => {
    // FİYAT DÜZELTME İŞLEMİ
    let formattedPrice = editFormData.price;
    if (typeof formattedPrice === 'string') {
      formattedPrice = formattedPrice.replace(/\./g, '').replace(/,/g, '.');
    }

    const dataToSubmit = {
      ...editFormData,
      price: parseFloat(formattedPrice) // Temizlenmiş fiyat
    };

    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify(dataToSubmit) // editFormData yerine dataToSubmit gönderiyoruz
      });
      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        fetchProducts();
        alert('Ürün başarıyla güncellendi!');
      } else alert('Hata: ' + data.message);
    } catch (error) { alert('Bağlantı hatası.'); }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrderList(orderList.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      } else alert("Hata: " + data.message);
    } catch (error) {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': adminToken }
      });
      const data = await response.json();
      if (data.success) fetchProducts();
      else alert("Yetkiniz reddedildi!");
    } catch (error) {}
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Resim Cloudinary sunucusuna yükleniyor...' });
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'tutu_uploads');
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/denlwno3i/image/upload';

    try {
      const res = await fetch(cloudinaryUrl, { method: 'POST', body: uploadData });
      const data = await res.json();

      if (data.secure_url) {
        if (type === 'main') {
          setFormData({ ...formData, image_url: data.secure_url, gallery_images: [data.secure_url, ...formData.gallery_images.slice(1)] });
        } else {
          const newGallery = [...formData.gallery_images];
          newGallery.push(data.secure_url);
          setFormData({ ...formData, gallery_images: newGallery });
        }
        setStatus({ type: 'success', message: 'Resim başarıyla yüklendi! Daha fazla ekleyebilir veya kaydedebilirsiniz.' });
      } else {
        setStatus({ type: 'error', message: 'Resim yükleme hatası. Cloudinary ayarlarınızı kontrol edin.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Sunucu bağlantı hatası.' });
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    const newGallery = formData.gallery_images.filter((_, index) => index !== indexToRemove);
    if (indexToRemove === 0) setFormData({ ...formData, image_url: newGallery[0] || '', gallery_images: newGallery });
    else setFormData({ ...formData, gallery_images: newGallery });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      setStatus({ type: 'error', message: 'Lütfen önce Ana Ürün Fotoğrafını yükleyin!' });
      return;
    }

    setStatus({ type: 'loading', message: 'Ekleniyor...' });
    
    // FİYAT DÜZELTME İŞLEMİ: Noktaları sil (binlik), virgülü noktaya çevir (ondalık)
    let formattedPrice = formData.price;
    if (typeof formattedPrice === 'string') {
      formattedPrice = formattedPrice.replace(/\./g, '').replace(/,/g, '.');
    }

    const dataToSubmit = {
      ...formData,
      price: parseFloat(formattedPrice), // Temizlenmiş fiyatı sayıya çevirerek gönder
      gallery_images: JSON.stringify(formData.gallery_images) 
    };

    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        body: JSON.stringify(dataToSubmit)
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Ürün Başarıyla Eklendi!' });
        
        setFormData({ 
          name: '', price: '', category: 'ÜST GİYİM', tag: '', is_new: false, 
          image_url: '', gallery_images: [], stock: '', description: '', colors: 'Siyah, Beyaz', sizes: 'S, M, L' 
        });
        
        if(document.getElementById('mainImageUpload')) document.getElementById('mainImageUpload').value = '';
        if(document.getElementById('extraImageUpload1')) document.getElementById('extraImageUpload1').value = '';
        if(document.getElementById('extraImageUpload2')) document.getElementById('extraImageUpload2').value = '';
        if(document.getElementById('extraImageUpload3')) document.getElementById('extraImageUpload3').value = '';

        fetchProducts();
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Yetkiniz reddedildi veya bağlantı koptu.' });
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditFormData({ 
      name: product.name, 
      price: product.price, 
      description: product.description || '',
      colors: product.colors || '', 
      sizes: product.sizes || ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
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
          <h1 className="text-3xl font-extrabold mb-2">TUTU<span className="text-[#db2777]">✮⋆</span></h1>
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
      <div className="w-full md:w-64 md:min-h-screen bg-neutral-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-800"><h1 className="text-2xl font-extrabold tracking-tighter">TUTU<span className="text-[#db2777]">✮⋆</span></h1></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('add')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'add' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>📦 Yeni Ürün Ekle</button>
          <button onClick={() => setActiveTab('list')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'list' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>📋 Ürün Listesi</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'orders' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>💳 Sipariş Yönetimi</button>
          <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'logs' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>🕒 Sistem Logları</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-md font-semibold text-red-500 mt-8 hover:bg-neutral-800">🚪 Güvenli Çıkış</button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {activeTab === 'add' && (
          <div className="max-w-3xl bg-white p-6 md:p-10 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6 text-neutral-800 border-b pb-4">Detaylı Yeni Ürün Ekle</h2>
            {status.message && <p className={`mb-6 p-4 rounded-lg text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{status.message}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ürün Adı *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#db2777] bg-neutral-50" placeholder="Örn: Siyah Oversize Tişört" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Fiyat (TL) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-neutral-400 font-black">₺</span>
                    <input type="text" name="price" value={formData.price} onChange={handleChange} required className="w-full pl-9 pr-4 py-3 border rounded-lg focus:outline-none focus:border-[#db2777] bg-neutral-50 font-black text-[#db2777]" placeholder="Örn: 3.999" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ürün Açıklaması (SEO) *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg h-24 resize-none focus:outline-none focus:border-[#db2777] bg-neutral-50" placeholder="Google'da öne çıkması için kumaş, renk, kesim ve kullanım detaylarını yazın..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mevcut Renkler (Virgülle Ayırın)</label>
                  <input type="text" name="colors" value={formData.colors} onChange={handleChange} className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[#db2777]" placeholder="Örn: Siyah, Beyaz, Ekru" />
                  <p className="text-[10px] text-neutral-400 mt-1">Ürün detay sayfasında yan yana kutu olarak çıkar.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mevcut Bedenler (Virgülle Ayırın)</label>
                  <input type="text" name="sizes" value={formData.sizes} onChange={handleChange} className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[#db2777]" placeholder="Örn: S, M, L, XL veya Standart" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Vitrin (Kategori) *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#db2777] font-bold text-neutral-700 bg-neutral-50">
                    <option value="ÜST GİYİM">ÜST GİYİM</option>
                    <option value="SEZON">SEZONUN ÖNE ÇIKANLARI</option>
                    <option value="ALT GİYİM">ALT GİYİM</option>
                    <option value="KOMBİN">KOMBİN</option>
                    <option value="ÇANTA">ÇANTA</option>
                    <option value="AKSESUAR">AKSESUAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Rozet / Etiket</label>
                  <input type="text" name="tag" value={formData.tag} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#db2777] bg-neutral-50" placeholder="Örn: ÇOK SATAN" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Stok Adedi *</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#db2777] bg-neutral-50" placeholder="0" />
                </div>
              </div>

              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 bg-white">
                <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#db2777]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Ürün Görselleri (Sırayla Yükleyin)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">1. Ana Görsel *</label>
                    <input type="file" id="mainImageUpload" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-pink-100 file:text-pink-700 cursor-pointer" />
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">2. Detay / Yan</label>
                    <input type="file" id="extraImageUpload1" accept="image/*" disabled={!formData.image_url} onChange={(e) => handleImageUpload(e, 'extra')} className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-neutral-200 file:text-neutral-700 cursor-pointer disabled:opacity-50" />
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">3. Arka / Uzak</label>
                    <input type="file" id="extraImageUpload2" accept="image/*" disabled={!formData.image_url} onChange={(e) => handleImageUpload(e, 'extra')} className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-neutral-200 file:text-neutral-700 cursor-pointer disabled:opacity-50" />
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">4. Yakın Çekim</label>
                    <input type="file" id="extraImageUpload3" accept="image/*" disabled={!formData.image_url} onChange={(e) => handleImageUpload(e, 'extra')} className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-neutral-200 file:text-neutral-700 cursor-pointer disabled:opacity-50" />
                  </div>
                </div>

                {formData.gallery_images.length > 0 && (
                  <div className="mt-6 border-t border-neutral-100 pt-4">
                    <p className="text-xs font-bold text-neutral-400 mb-3">Yüklenen Galeri ({formData.gallery_images.length} Resim)</p>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {formData.gallery_images.map((imgUrl, index) => (
                        <div key={index} className="relative group w-24 h-32 shrink-0 rounded-md overflow-hidden border-2 border-neutral-200">
                          {index === 0 && <span className="absolute top-0 left-0 bg-[#db2777] text-white text-[8px] font-black px-1.5 py-0.5 z-10 w-full text-center">ANA RESİM</span>}
                          <img src={imgUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeGalleryImage(index)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={status.type === 'loading'} className="w-full bg-neutral-900 text-white font-bold py-5 rounded-xl disabled:bg-neutral-400 hover:bg-[#db2777] transition shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_rgba(219,39,119,0.3)] tracking-widest text-lg">
                YENİ ÜRÜNÜ YAYINLA
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4">Mevcut Ürünleriniz</h2>
            
            {isProductsLoading ? <p className="text-neutral-500 font-bold">Ürünler çekiliyor...</p> : 
             productFetchError ? <div className="p-5 bg-red-50 text-red-600 rounded-xl font-bold">❌ Hata: {productFetchError}</div> : 
             productList.length === 0 ? <div className="p-10 bg-neutral-50 text-neutral-500 text-center rounded-xl border border-dashed">Sistemde henüz ürün yok.</div> : 
            (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-neutral-200 text-xs font-black text-neutral-400 uppercase tracking-widest bg-neutral-50">
                      <th className="py-4 px-4 rounded-tl-lg">Vitrin</th>
                      <th className="py-4 px-4">Ürün Bilgileri</th>
                      <th className="py-4 px-4">Fiyat</th>
                      <th className="py-4 px-4 rounded-tr-lg">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {productList.map((p, idx) => (
                      <tr key={p.id || idx} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                        {editingId === p.id ? (
                          <>
                            <td className="py-4 px-4 align-top"><img src={p.image_url} className="w-16 h-20 object-cover rounded-md border shadow-sm" /></td>
                            <td className="py-4 px-4 flex flex-col gap-3">
                              <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border border-blue-200 rounded font-bold focus:outline-none focus:border-blue-500" placeholder="Ürün Adı" />
                              <textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full px-3 py-2 border border-blue-200 rounded text-xs h-16 resize-none focus:outline-none focus:border-blue-500" placeholder="SEO Açıklaması" />
                              <div className="flex gap-2">
                                <input type="text" value={editFormData.colors} onChange={e => setEditFormData({...editFormData, colors: e.target.value})} className="flex-1 px-3 py-1 border border-blue-200 rounded text-xs" placeholder="Renkler (Örn: Siyah, Beyaz)" />
                                <input type="text" value={editFormData.sizes} onChange={e => setEditFormData({...editFormData, sizes: e.target.value})} className="flex-1 px-3 py-1 border border-blue-200 rounded text-xs" placeholder="Bedenler (Örn: S, M, L)" />
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="relative w-28">
                                <span className="absolute left-3 top-2 text-neutral-400 font-bold text-xs">₺</span>
                                <input type="text" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} className="w-full pl-7 pr-3 py-2 border border-blue-200 rounded font-black text-[#db2777] focus:outline-none focus:border-blue-500" placeholder="3.999" />
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="flex flex-col gap-2">
                                <button onClick={() => handleUpdateProduct(p.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded text-xs font-bold transition shadow-sm">KAYDET</button>
                                <button onClick={() => setEditingId(null)} className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-2.5 rounded text-xs font-bold transition">İptal</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4">
                              <div className="relative w-16 h-20">
                                <img src={p.image_url} className="w-full h-full object-cover rounded border border-neutral-200 shadow-sm" />
                                <span className="absolute -bottom-2 -right-2 bg-neutral-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{p.category}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-neutral-900 text-base">{p.name}</div>
                              <div className="text-xs font-bold text-neutral-400 mt-1 flex items-center gap-2">
                                <span>Renk: {p.colors || 'Siyah, Beyaz'}</span> <span className="w-1 h-1 bg-neutral-300 rounded-full"></span> <span>Beden: {p.sizes || 'S, M, L'}</span>
                              </div>
                              {p.description && <div className="text-[11px] text-neutral-500 mt-2 line-clamp-1 max-w-[300px] italic">"{p.description}"</div>}
                            </td>
                            <td className="py-4 px-4 text-[#db2777] font-black text-lg">{p.price} TL</td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(p)} className="text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded text-xs transition border border-blue-100">Düzenle</button>
                                <button onClick={() => handleDelete(p.id)} className="text-red-600 font-bold bg-red-50 hover:bg-red-100 px-3 py-2 rounded text-xs transition border border-red-100">Sil</button>
                              </div>
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

        {activeTab === 'logs' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Sistem Logları</h2>
            <table className="w-full text-left text-sm"><tbody>
              {logList.map(log => (<tr key={log.id} className="border-b"><td className="py-3 font-bold text-neutral-700">{log.action}</td><td className="py-3 text-neutral-500">{log.details}</td></tr>))}
            </tbody></table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sipariş Yönetimi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-sm">
                    <th className="py-4 px-4 font-semibold">Sipariş</th>
                    <th className="py-4 px-4 font-semibold w-1/3">Müşteri</th>
                    <th className="py-4 px-4 font-semibold">Ürünler</th>
                    <th className="py-4 px-4 font-semibold text-right">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map(order => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4 align-top">
                        <span className="block text-xs font-bold text-neutral-400 mb-1">#{order.order_number || order.id}</span>
                        <span className="text-sm font-black text-neutral-900">{order.total_amount},00 TL</span>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <p className="font-bold text-neutral-800 text-sm mb-1">{order.customer_name}</p>
                        <p className="text-xs font-bold text-[#db2777] mb-2">📞 {order.phone || 'Belirtilmemiş'}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed max-w-[250px] bg-neutral-100 p-2 rounded-md">📍 {order.address || 'Yok'}</p>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5 max-w-[180px]">
                          {(() => {
                            let itemsArray = [];
                            if (order.items) {
                              if (typeof order.items === 'string') {
                                try { itemsArray = JSON.parse(order.items); } catch (e) {}
                              } else if (Array.isArray(order.items)) itemsArray = order.items;
                            }
                            return itemsArray.length > 0 ? itemsArray.map((item, idx) => (
                              <div key={idx} className="text-xs text-neutral-700 bg-neutral-50 border p-1.5 rounded-md leading-tight">
                                <span className="font-bold text-neutral-900 block truncate">{item.name}</span>
                                <span className="text-[10px] text-neutral-500 block mt-0.5">{item.selectedColor || '-'} / {item.selectedSize || '-'} | {item.quantity || 1} Adet</span>
                              </div>
                            )) : <span className="text-xs text-neutral-400 italic">Detay yok</span>;
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right align-top">
                        <select value={order.status || 'Hazırlanıyor'} onChange={(e) => handleOrderStatusChange(order.id, e.target.value)} className={`border text-xs font-bold rounded-lg px-2 py-2 cursor-pointer focus:outline-none ${order.status === 'Teslim Edildi' ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
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

