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
  
  // SİPARİŞ HAFIZASI
  const [orderList, setOrderList] = useState([]);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'tutu2026') setIsAuthenticated(true);
    else alert('Hatalı Şifre!');
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      if (data.success) setProductList(data.data);
    } catch (error) {
      console.error("Ürünler çekilemedi:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs');
      const data = await response.json();
      if (data.success) setLogList(data.data);
    } catch (error) {
      console.error("Loglar çekilemedi:", error);
    }
  };

  // SİPARİŞ MOTORU
  const fetchOrders = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/orders/all');
      const data = await response.json();
      if (data.success) setOrderList(data.data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
    }
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
    } catch (error) {
      console.error("Durum güncellenemedi:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
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
          <h1 className="text-3xl font-extrabold mb-2">TUTU<span className="text-pink-600">.</span></h1>
          <p className="text-neutral-500 mb-8 font-medium">Yönetici Girişi</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Şifre" className="w-full px-4 py-3 rounded-lg border focus:border-pink-500 mb-4 text-center tracking-widest" required />
            <button type="submit" className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-neutral-900 transition">GİRİŞ YAP</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 md:min-h-screen bg-neutral-900 text-white flex flex-col">
        <div className="p-6 border-b border-neutral-800"><h1 className="text-2xl font-extrabold tracking-tighter">TUTU<span className="text-pink-500">.</span></h1></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('add')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'add' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white'}`}>📦 Yeni Ürün Ekle</button>
          <button onClick={() => setActiveTab('list')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'list' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white'}`}>📋 Ürün Listesi</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'orders' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white'}`}>💳 Sipariş Yönetimi</button>
          <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'logs' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white'}`}>🕒 Sistem Logları</button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* YENİ ÜRÜN */}
        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-5 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h2>
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
            <table className="w-full text-left"><tbody className="text-sm">
              {productList.map(p => (
                <tr key={p.id} className="border-b"><td className="py-3 px-4">{p.name}</td><td className="py-3 px-4 text-pink-600 font-bold">{p.price} TL</td><td className="py-3 px-4"><button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold">Sil</button></td></tr>
              ))}
            </tbody></table>
          </div>
        )}

        {/* LOGLAR */}
        {activeTab === 'logs' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <table className="w-full text-left text-sm"><tbody>
              {logList.map(log => (<tr key={log.id} className="border-b"><td className="py-3">{log.action}</td><td className="py-3">{log.details}</td></tr>))}
            </tbody></table>
          </div>
        )}

        {/* SİPARİŞLER (YENİ EKLENEN PROFESYONEL BÖLÜM) */}
        {activeTab === 'orders' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sipariş & Kargo Yönetimi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-sm">
                    <th className="py-4 px-4 font-semibold">Sipariş</th>
                    <th className="py-4 px-4 font-semibold">Müşteri</th>
                    <th className="py-4 px-4 font-semibold">Ürünler</th>
                    <th className="py-4 px-4 font-semibold text-right">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map(order => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4">
                        <span className="block text-xs font-bold text-neutral-400 mb-1">#{order.id}</span>
                        <span className="text-sm font-black text-neutral-900">{order.total_amount},00 TL</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-neutral-800 text-sm">{order.customer_name}</p>
                        <p className="text-xs text-neutral-500">{order.contact_phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          {order.cart_items && typeof order.cart_items === 'string' ? JSON.parse(order.cart_items).map((item, idx) => (
                            <div key={idx} className="text-xs text-neutral-600 bg-neutral-100 p-1 rounded truncate">{item.name}</div>
                          )) : null}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <select 
                          value={order.status || 'Hazırlanıyor'}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`border text-xs font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500 ${order.status === 'Teslim Edildi' ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}
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