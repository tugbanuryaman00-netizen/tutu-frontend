"use client";
import { supabase } from '../supabase';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 1. ÖZEL TASARIM / ÖN SİPARİŞ VİTRİNİ
export function PreOrderHero({ onAddToCart }) {
  const specialProducts = [
    {
      id: "pre-1",
      name: "TUTU Prive - Gece Koleksiyonu Saten Elbise",
      price: 2450,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
      tag: "ÖZEL TASARIM",
    },
    {
      id: "pre-2",
      name: "TUTU Signature - Oversize Kaşe Kaban",
      price: 4800,
      image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80",
      tag: "ÖN SİPARİŞ",
    }
  ];

  return (
    <section className="w-full bg-neutral-900 py-16 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">TUTU<span className="text-pink-500">.</span> EXCLUSIVE</h2>
          <p className="text-neutral-400 font-medium">Sadece size özel üretilen, sınırlı sayıdaki ikonik parçaları hemen ayırtın.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {specialProducts.map((product) => (
            <div key={product.id} className="relative group overflow-hidden rounded-2xl bg-neutral-800 shadow-2xl">
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg tracking-wider">
                  {product.tag}
                </span>
              </div>
              
              <div className="h-[400px] md:h-[500px] w-full relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90 group-hover:opacity-100" />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 pt-20">
                  <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-pink-400 font-extrabold text-xl">{product.price},00 TL</span>
                    <button 
                      onClick={() => onAddToCart(product, 'Özel Beden', 'Özel Üretim')}
                      className="bg-white text-neutral-900 px-6 py-3 rounded-lg font-bold hover:bg-pink-500 hover:text-white transition duration-300 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)]">
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 2. ANA SAYFAMIZIN BEYNİ
export default function Home() {
  const [products, setProducts] = useState([]); 
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ 
    name: '', phone: '', city: '', district: '', neighborhood: '', address: '', saveAddress: false 
  });
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [activeCategory, setActiveCategory] = useState('TÜMÜ');
  
  // Sepeti boş başlatma, sayfa yüklenince tarayıcı hafızasına bak!
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutu_cart');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Sepette her değişiklik olduğunda hafızayı güncelle
  useEffect(() => {
    localStorage.setItem('tutu_cart', JSON.stringify(cart));
  }, [cart]);

  // URL'de "cart=open" varsa Sepet Çekmecesini otomatik aç
  useEffect(() => {
    if (window.location.search.includes('cart=open')) {
      setIsCartOpen(true);
      window.history.replaceState({}, '', '/'); 
    }
  }, []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- GOOGLE GİRİŞ VE OTURUM MOTORU ---
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) alert("Giriş yapılırken bir hata oluştu!");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsAuthModalOpen(false); 
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data); 
        }
      } catch (error) {
        console.error("Motor ile bağlantı kurulamadı:", error);
      } finally {
        setIsLoading(false); 
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product, size, color) => {
    const cartItem = {
      ...product,
      selectedSize: size,
      selectedColor: color,
      uniqueId: product.id + '-' + size + '-' + color + '-' + Math.random()
    };
    setCart(prevCart => [...prevCart, cartItem]);
    setIsCartOpen(true);
  };

  // İŞTE BÜTÜN HATALARI ÇÖZEN YENİ VE GÜVENLİ SİPARİŞ MOTORU
  const submitOrder = async (e) => {
    e.preventDefault();
    
    // Güvenlik: Adres eksikse durdur
    if (!checkoutForm.city || !checkoutForm.address) {
      alert("Lütfen adres bilgilerinizi eksiksiz doldurun.");
      return;
    }

    const fullShippingAddress = `${checkoutForm.city} / ${checkoutForm.district} / ${checkoutForm.neighborhood} Mah. - Açık Adres: ${checkoutForm.address}`;

    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
// ... submitOrder fonksiyonu içinde ...
        body: JSON.stringify({ 
          customer_name: checkoutForm.name, 
          phone: checkoutForm.phone,       // Yeni ekledik
          address: fullShippingAddress,    // Yeni ekledik!
          total_amount: Number(cartTotal), 
          items: cart,
          user_id: user ? user.id : null
        })
        
// ...
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Siparişiniz başarıyla alındı! Siparişlerim panelinden kargo sürecini takip edebilirsiniz.");
        localStorage.removeItem('tutu_cart'); // Sipariş verilince hafızayı sıfırla
        setCart([]); 
        setIsCartOpen(false);
        setIsCheckoutMode(false);
        setCheckoutForm({ name: '', phone: '', city: '', district: '', neighborhood: '', address: '', saveAddress: false });
      } else {
        alert("Sipariş oluşturulamadı: " + data.message);
      }
    } catch (error) {
      alert("Bağlantı hatası yaşandı, lütfen internetinizi kontrol edip tekrar deneyin.");
    }
  };

  const removeFromCart = (uniqueId) => {
    setCart(cart.filter((item) => item.uniqueId !== uniqueId));
  };

  // İŞTE İKİNCİ ÇÖZÜM: Fiyat metne dönüşmüşse bile onu zorla Sayıya (Number) çeviriyor
  const cartTotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);

  const filteredProducts = activeCategory === 'TÜMÜ' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 relative">

      {/* --- GOOGLE GİRİŞ PENCERESİ (MODAL) --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-pink-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="p-10 text-center mt-2">
              <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tighter mb-3">TUTU<span className="text-pink-600">.</span></h2>
              <p className="text-neutral-500 font-medium mb-8">Siparişlerini takip etmek ve hızlı alışveriş yapmak için hemen giriş yap.</p>

              <button 
               onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 text-neutral-700 font-bold py-4 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition shadow-sm mb-4"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Google ile Devam Et
              </button>

              <p className="text-xs text-neutral-400 mt-6 leading-relaxed">Giriş yaparak, TUTU Giyim Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.</p>
            </div>
          </div>
        </div>
      )}

      {/* SEPET VE KASA YAN PANELİ */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">
                {isCheckoutMode ? 'Teslimat Bilgileri' : `Sepetim (${cart.length})`}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutMode(false); }} className="text-neutral-400 hover:text-pink-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {!isCheckoutMode ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center text-neutral-500 mt-10">Sepetiniz şu an boş.</div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.uniqueId} className="flex justify-between items-start border-b border-gray-100 pb-4">
                        <div className="flex gap-3">
                          {item.image_url && <img src={item.image_url} alt={item.name} className="w-12 h-16 object-cover bg-neutral-100" />}
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800">{item.name}</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">Renk: {item.selectedColor} | Beden: {item.selectedSize}</p>
                            <p className="text-pink-600 font-bold text-sm mt-1">{item.price},00 TL</p>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.uniqueId)} className="text-xs text-red-500 hover:underline">Kaldır</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-neutral-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-lg">Toplam Tutar:</span>
                    <span className="font-bold text-2xl text-pink-600">{cartTotal},00 TL</span>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutMode(true)}
                    className={`w-full py-4 rounded-sm font-bold text-white transition ${cart.length === 0 ? 'bg-neutral-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-neutral-900'}`}
                    disabled={cart.length === 0}
                  >
                    GÜVENLİ ÖDEMEYE GEÇ
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={submitOrder} className="flex-1 overflow-y-auto p-6 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Adınız Soyadınız *</label>
                      <input type="text" required value={checkoutForm.name} onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})} 
                        className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50" placeholder="Örn: Ayşe Yılmaz" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Telefon Numaranız *</label>
                      <input type="tel" required value={checkoutForm.phone} onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})} 
                        className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50" placeholder="Örn: 0555 123 45 67" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">İl *</label>
                        <input type="text" required value={checkoutForm.city} onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})} 
                          className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50" placeholder="Örn: Kocaeli" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">İlçe *</label>
                        <input type="text" required value={checkoutForm.district} onChange={(e) => setCheckoutForm({...checkoutForm, district: e.target.value})} 
                          className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50" placeholder="Örn: Gebze" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Mahalle *</label>
                      <input type="text" required value={checkoutForm.neighborhood} onChange={(e) => setCheckoutForm({...checkoutForm, neighborhood: e.target.value})} 
                        className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50" placeholder="Örn: Osman Yılmaz" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Sokak, Bina, Kapı No *</label>
                      <textarea required value={checkoutForm.address} onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})} 
                        className="w-full px-4 py-2.5 rounded border border-neutral-200 focus:outline-none focus:border-pink-500 bg-neutral-50 h-20 resize-none" 
                        placeholder="Örn: 600. Sokak, Şahin Apt. No:12 Daire:4"></textarea>
                    </div>

                    <div className="flex items-center pt-2">
                      <input type="checkbox" id="saveAddress" checked={checkoutForm.saveAddress} onChange={(e) => setCheckoutForm({...checkoutForm, saveAddress: e.target.checked})} 
                        className="w-5 h-5 accent-pink-600 rounded border-gray-300 cursor-pointer" />
                      <label htmlFor="saveAddress" className="ml-3 text-sm font-semibold text-neutral-700 cursor-pointer">
                        Sonraki alışverişlerim için bu adresi kaydet
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-semibold text-neutral-500">Ödenecek Tutar:</span>
                      <span className="font-black text-2xl text-neutral-900">{cartTotal},00 TL</span>
                    </div>
                    <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-4 rounded-lg hover:bg-pink-600 transition shadow-xl tracking-widest">
                      SİPARİŞİ TAMAMLA
                    </button>
                    <button type="button" onClick={() => setIsCheckoutMode(false)} className="w-full mt-3 text-sm font-semibold text-neutral-500 hover:text-neutral-900 py-2">
                      ← Sepete Geri Dön
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ÜST NAVBAR */}
      <header className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-extrabold tracking-tighter text-neutral-900 flex items-center gap-1 cursor-pointer">
            TUTU<span className="text-pink-600">✮⋆˙</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8 font-medium text-sm text-neutral-500">
            {['TÜMÜ', 'GİYİM', 'ÇANTA', 'AKSESUAR'].map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); }} className={`transition duration-300 ${activeCategory === cat ? 'text-pink-600 font-bold border-b-2 border-pink-600' : 'hover:text-pink-600'}`}>
                {cat}
              </button>
            ))}
          </nav>

          <div className="flex space-x-5 text-neutral-800 items-center">
            <button onClick={() => user ? window.location.href='/hesabim' : setIsAuthModalOpen(true)} className="flex items-center gap-2 hover:text-pink-600 transition font-semibold text-sm mr-2">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
              <span className="hidden md:inline">{user ? 'Hesabım' : 'Giriş Yap'}</span>
            </button>

            <button onClick={() => setIsCartOpen(true)} className="hover:text-pink-600 transition relative transform hover:scale-110">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"></path></svg>
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* 1. EN ÜSTTE HERO BANNER */}
      <section className="relative bg-gradient-to-b from-pink-50/30 to-white py-24 border-b border-gray-100">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <span className="text-pink-600 font-bold tracking-widest text-sm mb-4 uppercase">Yeni Sezon Koleksiyonu</span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 mb-6 tracking-tight">
            Şehrin <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700">Ritmini</span> Yakala
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 mb-10 max-w-2xl font-light">Modern kadının gücünden ilham alan yepyeni tasarımları keşfet. Premium dokular, zamansız çizgiler.</p>
        </div>
      </section>

      {/* 2. ONUN ALTINDA ÖN SİPARİŞ VİTRİNİ */}
      <PreOrderHero onAddToCart={addToCart} />

      {/* 3. EN ALTTA ÜRÜN LİSTELEME GRİDİ */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex justify-between items-end mb-10 border-b border-gray-100 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
            {activeCategory === 'TÜMÜ' ? 'Sezonun Öne Çıkanları' : `${activeCategory} Koleksiyonu`}
          </h2>
          <span className="text-sm font-medium text-neutral-500">{filteredProducts.length} Ürün Listeleniyor</span>
        </div>
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center w-full">
            <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-400 font-bold tracking-widest text-xs uppercase">Koleksiyon Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
              <Link href={`/urun/${product.id}`} key={product.id} className="group flex flex-col cursor-pointer">
                <div className="bg-neutral-100 aspect-[3/4] mb-4 overflow-hidden relative border border-gray-50 flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out" />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-200 group-hover:scale-105 transition duration-700 ease-in-out"></div>
                  )}
                  
                  {product.tag && <div className="absolute top-3 left-3 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-sm">{product.tag}</div>}
                  {(product.is_new || product.isNew) && !product.tag && <div className="absolute top-3 left-3 bg-neutral-900 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-sm">YENİ</div>}

                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                    <span className="block text-center w-full bg-white/90 backdrop-blur-sm text-neutral-900 font-bold py-3 text-sm hover:bg-pink-600 hover:text-white transition shadow-lg">İNCELE VE SEÇ</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-700 group-hover:text-pink-600 transition line-clamp-1">{product.name}</h3>
                  <div className="flex space-x-2 mt-1 items-center">
                    <p className="text-pink-600 font-bold text-lg">{product.price},00 TL</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

