"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  // 1. Güvenlik ve Sekme Durumları
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'orders', 'logs'

  // 2. Ürün Formu ve Veri Durumları
  const [formData, setFormData] = useState({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [productList, setProductList] = useState([]);
  const [logList, setLogList] = useState([]);

  // 3. SİPARİŞ VE KARGO DURUMLARI (YENİ EKLENEN KISIM)
  const [orderList, setOrderList] = useState([]);
  const statusSteps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi', 'İptal Edildi'];

  // --- FONKSİYONLAR ---

  // Şifre Kontrolü
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'tutu2026') { 
      setIsAuthenticated(true);
    } else {
      alert('Hatalı Şifre!');
    }
  };

  // Ürünleri Çekme
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      if (data.success) setProductList(data.data);
    } catch (error) {
      console.error("Ürünler çekilemedi:", error);
    }
  };

  // Logları Çekme
  const fetchLogs = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/logs');
      const data = await response.json();
      if (data.success) setLogList(data.data);
    } catch (error) {
      console.error("Loglar çekilemedi:", error);
    }
  };

  // Siparişleri Çekme (YENİ EKLENDİ)
  const fetchOrders = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/orders/all');
      const data = await response.json();
      if (data.success) setOrderList(data.data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
    }
  };

  // Sipariş Durumu Güncelleme (YENİ EKLENDİ)
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
        alert('Sipariş durumu başarıyla güncellendi!');
      } else {
        alert("Güncelleme başarısız: " + data.message);
      }
    } catch (error) {
      console.error("Durum güncellenemedi:", error);
    }
  };

  // Ürün Silme
  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {
      console.error("Silme işlemi sırasında hata oluştu:", error);
    }
  };

  // Yeni Ürün Form İşlemleri
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Ürün ekleniyor...' });
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Ürün vitrine eklendi!' });
        setFormData({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '', stock: '' });
      } else {
        setStatus({ type: 'error', message: 'Hata: ' + data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Sunucu bağlantı hatası!' });
    }
  };

  // Sekme Değiştiğinde Verileri Yenileme (GÜNCELLENDİ)
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'list') fetchProducts();
      if (activeTab === 'logs') fetchLogs();
      if (activeTab === 'orders') fetchOrders();
    }
  }, [activeTab, isAuthenticated]);


  // KİLİT EKRANI (Giriş Yapılmadıysa)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-extrabold mb-2">TUTU<span className="text-pink-600">.</span></h1>
          <p className="text-neutral-500 mb-8 font-medium">Yönetici Girişi</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Yönetici Şifreniz" 
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 mb-4 text-center tracking-widest"
              required
            />
            <button type="submit" className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-neutral-900 transition">
              GİRİŞ YAP
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ANA YÖNETİM PANELİ (Giriş Yapıldıysa)
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      
      {/* SOL MENÜ */}
      <div className="w-full md:w-64 md:min-h-screen bg-neutral-900 text-white flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-2xl font-extrabold tracking-tighter">TUTU<span className="text-pink-500">.</span> YÖNETİM</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('add')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'add' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
            📦 Yeni Ürün Ekle
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'list' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
            📋 Ürün Listesi
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'orders' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
            💳 Siparişler & Kargo
          </button>
          <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-4 py-3 rounded-md font-semibold transition ${activeTab === 'logs' ? 'bg-pink-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
            🕒 Sistem Logları
          </button>
        </nav>
      </div>

      {/* SAĞ İÇERİK ALANI */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* SEKME 1: YENİ ÜRÜN EKLE */}
        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-5 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Yeni Ürün Ekle</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-2">Ürün Adı *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" placeholder="Örn: Yeni Sezon Triko Kazak" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-2">Ürün Resim Linki (URL) *</label>
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" 
                  placeholder="Örn: https://resim-sitesi.com/elbise.jpg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-600 mb-2">Fiyat (TL) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" placeholder="Örn: 850" />
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-neutral-600 mb-2">Stok Adedi *</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} required 
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" 
                      placeholder="Örn: 50" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-600 mb-2">Kategori *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500">
                    <option value="GİYİM">GİYİM</option>
                    <option value="ÇANTA">ÇANTA</option>
                    <option value="AKSESUAR">AKSESUAR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-600 mb-2">Etiket (İsteğe Bağlı)</label>
                  <input type="text" name="tag" value={formData.tag} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" placeholder="Örn: %20 İNDİRİM" />
                </div>
                <div className="flex items-center mt-8">
                  <input type="checkbox" name="is_new" checked={formData.is_new} onChange={handleChange} className="w-5 h-5 text-pink-600 border-neutral-300 rounded focus:ring-pink-500" />
                  <label className="ml-3 text-sm font-semibold text-neutral-600">"YENİ" Etiketi Ekle</label>
                </div>
              </div>
              <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-4 rounded-lg hover:bg-pink-600 transition">VİTRİNE EKLE</button>
              {status.message && (
                <div className={`p-4 rounded-lg font-semibold text-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.message}</div>
              )}
            </form>
          </div>
        )}

        {/* SEKME 2: ÜRÜN LİSTESİ */}
        {activeTab === 'list' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Mevcut Ürünleriniz</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Ürün Adı</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold">Fiyat</th>
                    <th className="py-3 px-4 font-semibold">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map(product => (
                    <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 text-neutral-500">#{product.id}</td>
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-sm"><span className="bg-neutral-200 px-2 py-1 rounded text-neutral-700">{product.category}</span></td>
                      <td className="py-3 px-4 font-bold text-pink-600">{product.price} TL</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productList.length === 0 && <p className="text-center text-neutral-500 mt-6">Henüz ürün bulunmuyor.</p>}
            </div>
          </div>
        )}

        {/* SEKME 3: SİPARİŞLER (YENİ EKLENDİ) */}
        {activeTab === 'orders' && (
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sipariş & Kargo Yönetimi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-sm">
                    <th className="py-4 px-4 font-semibold">Tarih / No</th>
                    <th className="py-4 px-4 font-semibold">Müşteri Bilgileri</th>
                    <th className="py-4 px-4 font-semibold">Tutar</th>
                    <th className="py-4 px-4 font-semibold">Ürünler</th>
                    <th className="py-4 px-4 font-semibold text-right">Kargo Durumu</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map(order => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      
                      <td className="py-4 px-4 align-top">
                        <span className="block text-xs font-bold text-neutral-400 mb-1">#{order.id}</span>
                        <span className="text-sm text-neutral-700">{new Date(order.created_at).toLocaleDateString('tr-TR')}</span>
                      </td>
                      
                      <td className="py-4 px-4 align-top">
                        <p className="font-bold text-neutral-800 text-sm">{order.customer_name}</p>
                        <p className="text-xs font-semibold text-pink-600 my-1">{order.contact_phone}</p>
                        <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">{order.shipping_address}</p>
                      </td>
                      
                      <td className="py-4 px-4 align-top font-black text-neutral-900">
                        {order.total_amount},00 TL
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-2 max-w-[200px]">
                          {order.cart_items && typeof order.cart_items === 'string' ? JSON.parse(order.cart_items).map((item, idx) => (
                            <div key={idx} className="text-xs bg-neutral-100 p-2 rounded">
                              <span className="font-bold block truncate">{item.name}</span>
                              <span className="text-neutral-500">{item.selectedColor} | {item.selectedSize}</span>
                            </div>
                          )) : null}
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <select 
                          value={order.status || 'Hazırlanıyor'}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`border text-xs font-bold rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm transition-colors ${
                            order.status === 'Teslim Edildi' ? 'bg-green-50 border-green-200 text-green-700' : 
                            order.status === 'Hazırlanıyor' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                            'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
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
              {orderList.length === 0 && <p className="text-center text-neutral-500 mt-10">Sistemde henüz kayıtlı sipariş bulunmuyor.</p>}
            </div>
          </div>
        )}

        {/* SEKME 4: SİSTEM LOGLARI */}
        {activeTab === 'logs' && (
          <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sistem Hareket Dökümü</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                    <th className="py-3 px-4 font-semibold">Tarih</th>
                    <th className="py-3 px-4 font-semibold">Kullanıcı</th>
                    <th className="py-3 px-4 font-semibold">İşlem</th>
                    <th className="py-3 px-4 font-semibold">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {logList.map(log => (
                    <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 text-sm text-neutral-500">
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-700">@{log.username}</td>
                      <td className="py-3 px-4">
                        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs font-bold">{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logList.length === 0 && <p className="text-center text-neutral-500 mt-6">Henüz bir sistem hareketi kaydedilmedi.</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}