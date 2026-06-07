"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function Hesabim() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('siparisler');
  const [isLoading, setIsLoading] = useState(true);
  
  // Veri Hafızaları
  const [myOrders, setMyOrders] = useState([]);
  const [myAddresses, setMyAddresses] = useState([]);
  
  // Adres Formu Hafızası
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ title: '', city: '', district: '', neighborhood: '', full_address: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/'; 
      } else {
        setUser(session.user);
        
        // 1. SİPARİŞLERİ ÇEK
        fetch(`https://tutu-backend-api.onrender.com/api/orders/user/${session.user.id}`)
          .then(res => res.json())
          .then(data => { if (data.success && Array.isArray(data.data)) setMyOrders(data.data); })
          .catch(err => console.error(err));

        // 2. ADRESLERİ ÇEK
        fetch(`https://tutu-backend-api.onrender.com/api/addresses/user/${session.user.id}`)
          .then(res => res.json())
          .then(data => { if (data.success && Array.isArray(data.data)) setMyAddresses(data.data); })
          .catch(err => console.error(err))
          .finally(() => setIsLoading(false)); // İkisi de bitince yüklemeyi durdur
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Yeni Adres Kaydetme Motoru
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addressForm, user_id: user.id })
      });
      const data = await response.json();
      if (data.success) {
        setMyAddresses([data.data, ...myAddresses]); // Listeye anında ekle
        setIsAddingAddress(false); // Formu kapat
        setAddressForm({ title: '', city: '', district: '', neighborhood: '', full_address: '' }); // Formu sıfırla
      } else {
        alert("Adres kaydedilemedi.");
      }
    } catch (error) {
      alert("Bağlantı hatası!");
    }
  };

  // Adres Silme Motoru
  const handleDeleteAddress = async (id) => {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`https://tutu-backend-api.onrender.com/api/addresses/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMyAddresses(myAddresses.filter(addr => addr.id !== id)); // Listeden anında sil
      }
    } catch (error) {
      alert("Silme işlemi başarısız.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-500 font-medium tracking-widest uppercase text-sm">Bilgileriniz Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="/" className="text-3xl font-extrabold tracking-tighter text-neutral-900">TUTU<span className="text-pink-600">✮⋆˙</span></a>
          <a href="/" className="text-sm font-semibold text-neutral-500 hover:text-pink-600 transition">← Alışverişe Dön</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SOL MENÜ */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('siparisler')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'siparisler' ? 'bg-pink-600 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>📦 Siparişlerim</button>
                <button onClick={() => setActiveTab('profil')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'profil' ? 'bg-pink-600 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>👤 Profil Bilgilerim</button>
                <button onClick={() => {setActiveTab('adresler'); setIsAddingAddress(false);}} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'adresler' ? 'bg-pink-600 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>📍 Adres Defterim</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition mt-4">🚪 Çıkış Yap</button>
              </nav>
            </div>
          </div>

          {/* SAĞ İÇERİK */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
              
              {/* SİPARİŞLERİM SEKMESİ */}
              {activeTab === 'siparisler' && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-6">Siparişlerim</h2>
                  {myOrders.length === 0 ? (
                    <p className="text-neutral-500 bg-neutral-50 p-6 rounded-xl border border-dashed">Henüz bir siparişiniz bulunmuyor.</p>
                  ) : (
                    <div className="space-y-4">
                      {myOrders.map(order => (
                        <div key={order.id} className="p-5 border border-gray-100 rounded-xl flex justify-between items-center hover:shadow-md transition">
                          <div>
                            <p className="font-bold text-neutral-800">Sipariş No: <span className="text-neutral-500 font-medium">#{order.order_number || order.id}</span></p>
                            <p className="text-sm text-neutral-500 mt-1">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xl text-pink-600">{order.total_amount},00 TL</p>
                            <p className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-md mt-2 inline-block">{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROFİL SEKMESİ */}
              {activeTab === 'profil' && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-6">Profil Bilgilerim</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">Ad Soyad</label>
                      <input type="text" disabled value={user.user_metadata?.full_name || 'İsim Belirtilmemiş'} className="w-full px-4 py-3 rounded-lg border bg-neutral-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">E-Posta Adresi</label>
                      <input type="email" disabled value={user.email} className="w-full px-4 py-3 rounded-lg border bg-neutral-50" />
                    </div>
                  </div>
                </div>
              )}

              {/* ADRESLERİM SEKMESİ */}
              {activeTab === 'adresler' && (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Adres Defterim</h2>
                    {!isAddingAddress && (
                      <button onClick={() => setIsAddingAddress(true)} className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 transition">
                        + Yeni Adres
                      </button>
                    )}
                  </div>

                  {/* ADRES EKLEME FORMU */}
                  {isAddingAddress ? (
                    <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Adres Başlığı *</label>
                          <input type="text" required value={addressForm.title} onChange={e => setAddressForm({...addressForm, title: e.target.value})} placeholder="Örn: Evim, İş Yerim" className="w-full px-4 py-2 border rounded-lg focus:border-pink-500 focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">İl *</label>
                            <input type="text" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="Örn: Kocaeli" className="w-full px-4 py-2 border rounded-lg focus:border-pink-500 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">İlçe *</label>
                            <input type="text" required value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} placeholder="Örn: Gebze" className="w-full px-4 py-2 border rounded-lg focus:border-pink-500 focus:outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Mahalle *</label>
                          <input type="text" required value={addressForm.neighborhood} onChange={e => setAddressForm({...addressForm, neighborhood: e.target.value})} placeholder="Örn: Osman Yılmaz Mah." className="w-full px-4 py-2 border rounded-lg focus:border-pink-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Açık Adres (Sokak, Bina No) *</label>
                          <textarea required value={addressForm.full_address} onChange={e => setAddressForm({...addressForm, full_address: e.target.value})} placeholder="Açık adresinizi yazınız..." className="w-full px-4 py-2 border rounded-lg h-24 resize-none focus:border-pink-500 focus:outline-none"></textarea>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button type="submit" className="bg-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-neutral-900 transition flex-1">Kaydet</button>
                          <button type="button" onClick={() => setIsAddingAddress(false)} className="bg-white border border-neutral-300 text-neutral-700 font-bold py-3 px-6 rounded-lg hover:bg-neutral-100 transition flex-1">İptal</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* KAYITLI ADRESLER LİSTESİ */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myAddresses.length === 0 ? (
                        <div className="col-span-full bg-neutral-50 p-8 rounded-xl border border-dashed text-center">
                          <p className="text-neutral-500">Henüz kayıtlı bir adresiniz bulunmuyor.</p>
                        </div>
                      ) : (
                        myAddresses.map(addr => (
                          <div key={addr.id} className="border border-neutral-200 rounded-xl p-5 hover:border-pink-300 transition relative group bg-white shadow-sm hover:shadow-md">
                            <h3 className="font-bold text-lg text-neutral-900 mb-2 flex items-center gap-2">
                              <span className="text-pink-600">📍</span> {addr.title}
                            </h3>
                            <p className="text-sm text-neutral-600 font-medium">{addr.neighborhood} Mah.</p>
                            <p className="text-sm text-neutral-600">{addr.city} / {addr.district}</p>
                            <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">{addr.full_address}</p>
                            
                            <button onClick={() => handleDeleteAddress(addr.id)} className="absolute top-4 right-4 text-xs font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 px-2 py-1 rounded">
                              SİL
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}