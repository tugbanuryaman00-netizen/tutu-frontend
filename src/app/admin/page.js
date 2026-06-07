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
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: '' });

  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productFetchError, setProductFetchError] = useState('');
  const [orderList, setOrderList] = useState([]);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  // Sayfa açıldığında hafızada yetki var mı kontrol et
  useEffect(() => {
    const token = sessionStorage.getItem('tutu_admin_token');
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Giriş Yapma (Artık doğrulama backend üzerinden yapılacak, frontend'de şifre yazmıyor)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Şifrenin doğru olup olmadığını test etmek için logları çekmeyi deniyoruz
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

  // Ürünler herkese açık, o yüzden token gerekmiyor
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

  // GÜVENLİ İŞLEMLER (Artık headers içinde token gönderiliyor)
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
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        fetchProducts();
        alert('Ürün güncellendi!');
      } else alert('Hata: ' + data.message);
    } catch (error) { alert('Bağlantı hatası.'); }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Ekleniyor...' });
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Eklendi!' });
        setFormData({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
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
    setEditFormData({ name: product.name, price: product.price });
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
          <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'logs' ? 'bg-[#db2777]' : 'text-neutral-400 hover:text-white'}`}>🕒 Sistem Logları</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-md font-semibold text-red-500 mt-8 hover:bg-neutral-800">🚪 Güvenli Çıkış</button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* YENİ ÜRÜN */}
        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-5 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h2>
            {status.message && <p className={`mb-4 text-sm font-bold ${status.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{status.message}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Ürün Adı" />
              <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Resim URL" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Fiyat" />
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" placeholder="Stok" />
              </div>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                <option value="GİYİM">GİYİM</option><option value="ÇANTA">ÇANTA</option><option value="AKSESUAR">AKSESUAR</option>
              </select>
              <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-4 rounded-lg">EKLE</button>
            </form>
          </div>
        )}

        {/* ÜRÜN LİSTESİ */}
        {activeTab === 'list' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Mevcut Ürünler</h2>
            
            {isProductsLoading ? <p className="text-neutral-500">Ürünler yükleniyor...</p> : 
             productFetchError ? <div className="p-5 bg-red-50 text-red-600 rounded-xl font-bold">❌ Hata: {productFetchError}</div> : 
             productList.length === 0 ? <div className="p-10 bg-neutral-50 text-neutral-500 text-center rounded-xl border border-dashed">Sistemde ürün bulunmuyor.</div> : 
            (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm font-semibold text-neutral-500">
                      <th className="py-3 px-4">Ürün Adı</th>
                      <th className="py-3 px-4">Fiyat</th>
                      <th className="py-3 px-4">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {productList.map((p, idx) => (
                      <tr key={p.id || idx} className="border-b hover:bg-neutral-50 transition">
                        {editingId === p.id ? (
                          <>
                            <td className="py-3 px-4"><input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg font-bold" /></td>
                            <td className="py-3 px-4"><input type="number" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} className="w-28 px-3 py-2 border rounded-lg font-bold" /></td>
                            <td className="py-3 px-4 flex gap-2">
                              <button onClick={() => handleUpdateProduct(p.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Kaydet</button>
                              <button onClick={() => setEditingId(null)} className="bg-neutral-400 text-white px-4 py-2 rounded-lg text-xs font-bold">İptal</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 font-bold text-neutral-800">{p.name}</td>
                            <td className="py-4 px-4 text-[#db2777] font-black">{p.price} TL</td>
                            <td className="py-4 px-4 flex gap-2">
                              <button onClick={() => startEdit(p)} className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-xs">Düzenle</button>
                              <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg text-xs">Sil</button>
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

        {/* LOGLAR */}
        {activeTab === 'logs' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Sistem Logları</h2>
            <table className="w-full text-left text-sm"><tbody>
              {logList.map(log => (<tr key={log.id} className="border-b"><td className="py-3">{log.action}</td><td className="py-3">{log.details}</td></tr>))}
            </tbody></table>
          </div>
        )}

        {/* SİPARİŞLER */}
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
