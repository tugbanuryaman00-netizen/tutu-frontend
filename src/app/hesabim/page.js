"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function Hesabim() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('siparisler');
  const [isLoading, setIsLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/'; 
      } else {
        setUser(session.user);
        
        // SİPARİŞLERİ ÇEKME MOTORU
        fetch(`https://tutu-backend-api.onrender.com/api/orders/user/${session.user.id}`)
          .then(res => res.json())
          .then(data => {
            console.log("Backend'den gelen ham veri:", data); // F12 -> Konsol'da buraya bak!
            if (data.success && Array.isArray(data.data)) {
              setMyOrders(data.data);
            } else {
              setMyOrders([]);
            }
            setIsLoading(false);
          })
          .catch(err => {
            console.error("Fetch Hatası:", err);
            setIsLoading(false);
          });
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
                <button onClick={() => setActiveTab('siparisler')} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${activeTab === 'siparisler' ? 'bg-pink-600 text-white' : 'text-neutral-600'}`}>Siparişlerim</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 font-bold">Çıkış Yap</button>
              </nav>
            </div>
          </div>

          {/* SAĞ İÇERİK */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
              
              {activeTab === 'siparisler' && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-6">Siparişlerim</h2>
                  {myOrders.length === 0 ? (
                    <p className="text-neutral-500">Henüz bir siparişiniz bulunmuyor.</p>
                  ) : (
                    <div className="space-y-4">
                      {myOrders.map(order => (
                        <div key={order.id} className="p-4 border rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold">Sipariş No: {order.order_number || order.id}</p>
                            <p className="text-sm text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-pink-600">{order.total_amount},00 TL</p>
                            <p className="text-xs font-bold bg-neutral-100 px-2 py-1 rounded">{order.status}</p>
                          </div>
                        </div>
                      ))}
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