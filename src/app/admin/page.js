"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  // 1. Güvenlik ve Sekme Durumları
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'orders'

  // 2. Ürün Formu ve Veri Durumları
  const [formData, setFormData] = useState({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false, image_url: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [productList, setProductList] = useState([]);

  // Şifre Kontrolü (Geliştirme aşaması için basit kilit)
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'tutu2026') { // Şifremiz: tutu2026
      setIsAuthenticated(true);
    } else {
      alert('Hatalı Şifre!');
    }
  };

  // Ürünleri Backend'den Çekme (Ürün Listesi sekmesi için)
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
      const data = await response.json();
      if (data.success) setProductList(data.data);
    } catch (error) {
      console.error("Ürünler çekilemedi:", error);
    }
  };
  
  const handleDelete = async (id) => {
  if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
  
  try {
    const response = await fetch(`https://tutu-backend-api.onrender.com/api/products/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      // Ürün başarıyla silindiğinde listeyi otomatik yeniler
      fetchProducts();
    } else {
      alert("Hata: " + data.message);
    }
  } catch (error) {
    console.error("Silme işlemi sırasında hata oluştu:", error);
  }
};

  // Sekme değiştiğinde ürünleri yenile
  useEffect(() => {
    if (activeTab === 'list' && isAuthenticated) {
      fetchProducts();
    }
  }, [activeTab, isAuthenticated]);

  // Yeni Ürün Ekleme İşlemi
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
        setFormData({ name: '', price: '', category: 'GİYİM', tag: '', is_new: false });
      } else {
        setStatus({ type: 'error', message: 'Hata: ' + data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Sunucu bağlantı hatası!' });
    }
  };

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
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sol Menü */}
      <div className="w-64 bg-neutral-900 text-white flex flex-col">
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
            💰 Siparişler
          </button>
        </nav>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 p-10 overflow-y-auto">
        
        {/* SEKME 1: YENİ ÜRÜN EKLE */}
        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-neutral-100">
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
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-600 mb-2">Fiyat (TL) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-pink-500" placeholder="Örn: 850" />
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
              <div className="grid grid-cols-2 gap-6">
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
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-100">
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
<button 
  onClick={() => handleDelete(product.id)} 
  className="text-red-500 hover:text-red-700 text-sm font-semibold"
>
  Sil
</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productList.length === 0 && <p className="text-center text-neutral-500 mt-6">Henüz ürün bulunmuyor.</p>}
            </div>
          </div>
        )}

        {/* SEKME 3: SİPARİŞLER */}
        {activeTab === 'orders' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Sipariş Modülü Hazırlanıyor</h2>
            <p className="text-neutral-500 max-w-md">
              Kredi kartı entegrasyonu (Iyzico/PayTR) tamamlandığında müşterilerinizin siparişleri, ödeme bilgileri ve kargo durumları burada listelenecektir.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}