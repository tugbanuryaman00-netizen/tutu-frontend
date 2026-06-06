"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // Supabase kablosunu çağırıyoruz

export default function Hesabim() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('siparisler'); // Hangi menünün açık olduğu
  const [isLoading, setIsLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    // Sayfa açıldığında kimin geldiğine bak
const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/'; 
      } else {
        setUser(session.user);
        // Kullanıcının siparişlerini Backend'den çek
        fetch(`https://tutu-backend-api.onrender.com/api/orders/user/${session.user.id}`)
          .then(res => res.json())
          .then(data => {
            if(data.success) setMyOrders(data.data);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    };
    
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Veriler yüklenirken şık bir bekleme ekranı göster
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
      
      {/* ÜST BAŞLIK (HEADER) */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="/" className="text-3xl font-extrabold tracking-tighter text-neutral-900 flex items-center gap-1 hover:opacity-80 transition">
            TUTU<span className="text-pink-600">✮⋆˙</span>
          </a>
          <a href="/" className="text-sm font-semibold text-neutral-500 hover:text-pink-600 transition">
            ← Alışverişe Dön
          </a>
        </div>
      </header>

      {/* ANA İÇERİK BÖLÜMÜ */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SOL MENÜ (SİDEBAR) */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              
              {/* Profil Özeti */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profil" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="font-bold text-neutral-900 truncate">{user.user_metadata?.full_name || 'TUTU Müşterisi'}</h3>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Menü Linkleri */}
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('siparisler')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'siparisler' ? 'bg-pink-50 text-pink-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  Siparişlerim
                </button>

                
                <button 
                  onClick={() => setActiveTab('profil')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profil' ? 'bg-pink-50 text-pink-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Profil Bilgilerim
                </button>

                <button 
                  onClick={() => setActiveTab('adresler')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'adresler' ? 'bg-pink-50 text-pink-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Adres Defterim
                </button>
              </nav>

              {/* Çıkış Yap Butonu */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>

          {/* SAĞ İÇERİK ALANI (Tıklanan Menüye Göre Değişir) */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
              
             {/* SİPARİŞLERİM SEKMESİ */}
              {activeTab === 'siparisler' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 tracking-tight">Siparişlerim</h2>
                  
                  {myOrders.length === 0 ? (
                    <div className="bg-neutral-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
                      <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      <h3 className="text-lg font-bold text-neutral-700 mb-2">Henüz Bir Siparişiniz Yok</h3>
                      <a href="/" className="inline-block bg-neutral-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-pink-600 transition shadow-lg mt-4">Alışverişe Başla</a>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {myOrders.map(order => {
                        // Kargo Adımları
                        const steps = ['Hazırlanıyor', 'Kargoya Verildi', 'Kargo Şubesinde', 'Dağıtıma Çıktı', 'Teslim Edildi'];
                        const currentStepIndex = steps.indexOf(order.status || 'Hazırlanıyor');

                        return (
                          <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                              <div>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">Sipariş No: #{order.id}</p>
                                <p className="text-sm text-neutral-600">Tarih: {new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-pink-600">{order.total_amount},00 TL</p>
                              </div>
                            </div>

                            {/* İLERLEME ÇUBUĞU (PROGRESS BAR) */}
                            <div className="relative pt-2 mb-8">
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-100">
                                <div style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500 transition-all duration-1000"></div>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-neutral-400">
                                {steps.map((step, index) => (
                                  <div key={index} className={`text-center w-1/5 ${index <= currentStepIndex ? 'text-pink-600' : ''}`}>
                                    <div className={`mx-auto w-4 h-4 rounded-full mb-1 border-2 ${index <= currentStepIndex ? 'bg-pink-600 border-pink-600' : 'bg-white border-neutral-300'}`}></div>
                                    <span className="hidden md:block">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* SİPARİŞ EDİLEN ÜRÜNLER (MİNİ LİSTE) */}
                            <div className="flex gap-4 overflow-x-auto pb-2">
                              {order.cart_items && typeof order.cart_items === 'string' ? JSON.parse(order.cart_items).map((item, idx) => (
                                <div key={idx} className="flex-shrink-0 flex items-center gap-3 bg-neutral-50 pr-4 rounded-lg border border-gray-100 overflow-hidden">
                                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-12 h-16 object-cover" />}
                                  <div>
                                    <p className="text-xs font-bold text-neutral-800 line-clamp-1 max-w-[120px]">{item.name}</p>
                                    <p className="text-[10px] text-neutral-500">{item.selectedColor} | {item.selectedSize}</p>
                                  </div>
                                </div>
                              )) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PROFİL BİLGİLERİM SEKMESİ */}
              {activeTab === 'profil' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 tracking-tight">Profil Bilgilerim</h2>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ad Soyad</label>
                      <input type="text" disabled value={user.user_metadata?.full_name || 'İsim Belirtilmemiş'} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-neutral-50 text-neutral-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">E-Posta Adresi</label>
                      <input type="email" disabled value={user.email} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-neutral-50 text-neutral-700 cursor-not-allowed" />
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-700 text-sm mt-4">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <p>Güvenliğiniz için profil bilgileriniz doğrudan Google hesabınızdan otomatik olarak çekilmektedir. Bilgilerinizi güncellemek için Google hesap ayarlarınızı kullanabilirsiniz.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADRESLERİM SEKMESİ */}
              {activeTab === 'adresler' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 tracking-tight">Adres Defterim</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Yeni Adres Ekle Kartı */}
                    <button className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50 transition gap-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      <span className="font-bold">Yeni Adres Ekle</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}