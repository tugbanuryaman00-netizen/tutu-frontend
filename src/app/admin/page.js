"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('add');

  const [formData, setFormData] = useState({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [productList, setProductList] = useState([]);
  const [logList, setLogList] = useState([]);
  
  // HATA VE YÜKLENİYOR DURUMLARI
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productFetchError, setProductFetchError] = useState('');
  
  // SİPARİŞ HAFIZASI
  const [orderList, setOrderList] = useState([]);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'tutu2026') setIsAuthenticated(true);
    else alert('Hatalı Şifre!');
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    setProductFetchError('');
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProductList(data.data || []);
      } else {
        setProductFetchError(data.message || 'Ürünler alınamadı.');
      }
    } catch (error) {
      setProductFetchError('Sunucuya bağlanılamadı. Backend çalışmıyor olabilir.');
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs');
      const data = await response.json();
      if (data.success) setLogList(data.data);
    } catch (error) {}
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/orders/all');
      const data = await response.json();
      if (data.success) setOrderList(data.data);
    } catch (error) {}
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrderList(orderList.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
        alert('Sipariş durumu güncellendi!');
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchProducts();
    } catch (error) {}
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Ekleniyor...' });
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Eklendi!' });
        setFormData({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
        fetchProducts(); // Arka planda listeyi güncelle
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Hata!' });
    }
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
          <p className="text-neutral-500 mb-8 font-medium">Yönetici Girişi</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Şifre" className="w-full px-4 py-3 rounded-lg border focus:border-pink-500 mb-4 text-center tracking-widest" required />
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

        {/* ÜRÜN LİSTESİ (KUSURSUZ MANTIKLA YENİDEN YAZILDI) */}
        {activeTab === 'list' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Mevcut Ürünler</h2>
            
            {/* DURUM 1: YÜKLENİYOR */}
            {isProductsLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-pink-100 border-t-[#db2777] rounded-full animate-spin"></div>
                <p className="mt-4 text-neutral-500 font-medium">Veritabanına bağlanılıyor...</p>
              </div>
            ) : 
            
            /* DURUM 2: HATA VAR */
            productFetchError ? (
              <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold">
                ❌ Bir sorun oluştu: {productFetchError}
              </div>
            ) : 
            
            /* DURUM 3: LİSTE BOŞ */
            productList.length === 0 ? (
              <div className="p-10 bg-neutral-50 text-neutral-500 text-center rounded-xl border border-dashed border-neutral-200">
                <span className="text-4xl block mb-3">📦</span>
                Sistemde hiç ürün bulunmuyor. Yeni ürün ekledikçe burada listelenecektir.
              </div>
            ) : 
            
            /* DURUM 4: ÜRÜNLER GELDİ (TABLO) */
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
                        <td className="py-4 px-4 font-bold text-neutral-800">{p.name}</td>
                        <td className="py-4 px-4 text-[#db2777] font-black">{p.price} TL</td>
                        <td className="py-4 px-4">
                          <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition">Sil</button>
                        </td>
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
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sipariş & Kargo Yönetimi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-sm">
                    <th className="py-4 px-4 font-semibold">Sipariş</th>
                    <th className="py-4 px-4 font-semibold w-1/3">Müşteri Bilgileri</th>
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
                        <p className="text-xs font-bold text-[#db2777] mb-2">📞 {order.phone || 'Telefon Belirtilmemiş'}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed max-w-[250px] bg-neutral-100 p-2 rounded-md">
                          📍 {order.address || 'Adres bilgisi bulunmuyor.'}
                        </p>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          {order.cart_items && typeof order.cart_items === 'string' ? JSON.parse(order.cart_items).map((item, idx) => (
                            <div key={idx} className="text-xs text-neutral-600 bg-neutral-100 p-1 rounded truncate">{item.name}</div>
                          )) : null}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right align-top">
                        <select 
                          value={order.status || 'Hazırlanıyor'}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`border text-xs font-bold rounded-lg px-2 py-2 cursor-pointer focus:outline-none ${order.status === 'Teslim Edildi' ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}
                        >
                          {statusSteps.map(step => (
                            <option key={step} value={step} className="bg-white text-neutral-900">{step}</option>
                          ))}
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