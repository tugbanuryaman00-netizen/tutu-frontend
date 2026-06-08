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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

  // Kategoriye ve Arama Kelimesine Göre Filtreleme Motoru
  const filteredProducts = products.filter(p => {
    // 1. Kategori filtresi
    const matchesCategory = activeCategory === 'TÜMÜ' || p.category === activeCategory;
    // 2. Arama filtresi (İsim, açıklama veya etikette arar)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchLower) || 
      p.description?.toLowerCase().includes(searchLower) ||
      p.tag?.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower);
      
    return matchesCategory && matchesSearch;
  });

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
      {/* ÜST KAMPANYA BANDI */}
      <div className="bg-neutral-900 text-white text-[11px] font-bold tracking-widest uppercase py-2 text-center">
        İlk Siparişe Özel %15 İndirim | 500 TL Üzeri Kargo Bedava
      </div>

      {/* MODERN HEADER */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="text-3xl font-black tracking-tighter text-neutral-900 shrink-0">
            TUTU<span className="text-[#db2777]">✮⋆</span>
          </Link>

          {/* KATEGORİLER (Sadece PC'de görünür) */}
          <nav className="hidden md:flex space-x-8 font-medium text-sm text-neutral-500">
            {['TÜMÜ', 'GİYİM', 'ÇANTA', 'AKSESUAR'].map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); }} className={`transition duration-300 ${activeCategory === cat ? 'text-[#db2777] font-bold border-b-2 border-[#db2777]' : 'hover:text-[#db2777]'}`}>
                {cat}
              </button>
            ))}
          </nav>

          {/* MODERN SEARCHBAR (Sadece PC'de Açık Halde Görünür) */}
          <div className="hidden lg:flex items-center relative w-72 ml-4">
            <input 
              type="text" 
              placeholder="Ürün, kategori veya etiket ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 text-sm px-4 py-2.5 rounded-full pl-10 border border-transparent focus:bg-white focus:border-[#db2777] focus:outline-none transition-all shadow-inner placeholder-neutral-400 font-medium relative z-50"
            />
            <svg className="w-4 h-4 text-neutral-400 absolute left-4 z-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 text-neutral-400 hover:text-[#db2777] z-50 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}

            {/* PC CANLI SONUÇ PENCERESİ */}
            {searchQuery.length > 0 && (
              <div className="absolute top-full mt-3 right-0 w-[350px] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden z-[100] max-h-[450px] overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-3 bg-neutral-50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 flex justify-between">
                      <span>Arama Sonuçları</span><span className="text-[#db2777]">{filteredProducts.length} Ürün</span>
                    </div>
                    {filteredProducts.slice(0, 5).map((product) => (
                      <Link href={`/urun/${product.id}`} key={product.id} onClick={() => setSearchQuery('')} className="flex items-center gap-4 p-3 hover:bg-neutral-50 transition border-b border-neutral-50 last:border-0 group">
                        <div className="w-12 h-16 shrink-0 bg-neutral-100 rounded-md overflow-hidden border border-neutral-200">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-800 truncate group-hover:text-[#db2777] transition">{product.name}</h4>
                          <p className="text-[#db2777] font-black text-sm mt-0.5">{product.price},00 TL</p>
                        </div>
                        <div className="text-neutral-300 group-hover:text-[#db2777] pr-2 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-neutral-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <p className="text-sm text-neutral-500 font-bold">Bulunamadı.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* İKONLAR (Mobilde Arama İkonu Ekli) */}
          <div className="flex items-center gap-5 md:gap-6 shrink-0">
            
            {/* MOBİL ARAMA İKONU (Sadece Mobilde Görünür) */}
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="flex lg:hidden flex-col items-center text-neutral-600 hover:text-[#db2777] transition group">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 group-hover:-translate-y-0.5 transition-transform">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="text-[10px] font-bold">Ara</span>
            </button>

            {/* Hesabım İkonu */}
            <button onClick={() => user ? window.location.href='/hesabim' : setIsAuthModalOpen(true)} className="flex flex-col items-center text-neutral-600 hover:text-[#db2777] transition group">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 group-hover:-translate-y-0.5 transition-transform">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-[10px] font-bold">{user ? 'Hesabım' : 'Giriş Yap'}</span>
            </button>

            {/* Sepet İkonu */}
            <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center text-neutral-600 hover:text-[#db2777] transition group relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 group-hover:-translate-y-0.5 transition-transform">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span className="text-[10px] font-bold">Sepetim</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#db2777] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>
              )}
            </button>

          </div>
        </div>

        {/* MOBİL İÇİN AŞAĞI AÇILAN CANLI ARAMA PANELİ */}
        {isMobileSearchOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-xl z-[100] p-4 animate-in fade-in slide-in-from-top-2">
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Örn: Siyah elbise, çanta..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-neutral-100 text-sm px-4 py-3.5 rounded-xl pl-12 border border-transparent focus:bg-white focus:border-[#db2777] focus:outline-none transition-all shadow-sm font-medium"
              />
              <svg className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-neutral-400 hover:text-[#db2777]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>

            {searchQuery.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex justify-between border-b border-neutral-100 pb-2 mb-2">
                      <span>Sonuçlar</span><span className="text-[#db2777]">{filteredProducts.length} Ürün</span>
                    </div>
                    {filteredProducts.slice(0, 5).map((product) => (
                      <Link 
                        href={`/urun/${product.id}`} 
                        key={product.id} 
                        onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }}
                        className="flex items-center gap-4 bg-white p-2 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition border border-transparent"
                      >
                        <div className="w-12 h-16 shrink-0 bg-neutral-100 rounded border border-neutral-200 overflow-hidden">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-800 truncate">{product.name}</h4>
                          <p className="text-[#db2777] font-black text-sm mt-0.5">{product.price},00 TL</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-neutral-500 font-bold">"{searchQuery}" için sonuç bulunamadı.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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

{/* 2.5 KATEGORİ VİTRİNLERİ (Aşağı Kaydırdıkça Çıkan Bölümler) */}
      {searchQuery === '' && activeCategory === 'TÜMÜ' && (
        <div className="space-y-16 py-10 bg-neutral-50/50">
          
          {/* 1. ÜST GİYİM BÖLÜMÜ */}
          <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-6 border-b border-neutral-200 pb-2">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">ÜST GİYİM</h2>
                <p className="text-xs text-neutral-500 font-medium mt-1">Gömlek, Bluz, Kazak ve Daha Fazlası</p>
              </div>
              <button onClick={() => setActiveCategory('GİYİM')} className="text-xs font-bold text-[#db2777] hover:underline uppercase tracking-wider">Tümünü Gör</button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {products.filter(p => p.category === 'GİYİM' || p.category === 'ÜST GİYİM').slice(0, 8).map(product => (
                <Link href={`/urun/${product.id}`} key={product.id} className="min-w-[200px] max-w-[200px] snap-start group cursor-pointer">
                  <div className="bg-neutral-100 aspect-[3/4] mb-3 overflow-hidden relative rounded-lg">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    {product.tag && <div className="absolute top-2 left-2 bg-[#db2777] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">{product.tag}</div>}
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{product.name}</h3>
                  <p className="text-[#db2777] font-black text-sm mt-0.5">{product.price},00 TL</p>
                </Link>
              ))}
              {products.filter(p => p.category === 'GİYİM' || p.category === 'ÜST GİYİM').length === 0 && (
                [1,2,3,4].map(i => <div key={i} className="min-w-[200px] aspect-[3/4] bg-neutral-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-neutral-400 font-bold">Yakında</div>)
              )}
            </div>
          </section>

          {/* 2. ALT GİYİM BÖLÜMÜ */}
          <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-6 border-b border-neutral-200 pb-2">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">ALT GİYİM</h2>
                <p className="text-xs text-neutral-500 font-medium mt-1">Pantolon, Etek, Şort ve Klasik Kesimler</p>
              </div>
              <button onClick={() => setActiveCategory('ALT GİYİM')} className="text-xs font-bold text-[#db2777] hover:underline uppercase tracking-wider">Tümünü Gör</button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {products.filter(p => p.category === 'ALT GİYİM').slice(0, 8).map(product => (
                <Link href={`/urun/${product.id}`} key={product.id} className="min-w-[200px] max-w-[200px] snap-start group cursor-pointer">
                  <div className="bg-neutral-100 aspect-[3/4] mb-3 overflow-hidden relative rounded-lg">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    {product.tag && <div className="absolute top-2 left-2 bg-[#db2777] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">{product.tag}</div>}
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{product.name}</h3>
                  <p className="text-[#db2777] font-black text-sm mt-0.5">{product.price},00 TL</p>
                </Link>
              ))}
              {products.filter(p => p.category === 'ALT GİYİM').length === 0 && (
                [1,2,3,4].map(i => <div key={i} className="min-w-[200px] aspect-[3/4] bg-neutral-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-neutral-400 font-bold">Yakında</div>)
              )}
            </div>
          </section>

          {/* 3. KOMBİN BÖLÜMÜ */}
          <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-6 border-b border-neutral-200 pb-2">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">KOMBİN ÖNERİLERİ</h2>
                <p className="text-xs text-neutral-500 font-medium mt-1">Sizin için hazırladığımız özel takımlar</p>
              </div>
              <button onClick={() => setActiveCategory('KOMBİN')} className="text-xs font-bold text-[#db2777] hover:underline uppercase tracking-wider">Tümünü Gör</button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {products.filter(p => p.category === 'KOMBİN').slice(0, 8).map(product => (
                <Link href={`/urun/${product.id}`} key={product.id} className="min-w-[200px] max-w-[200px] snap-start group cursor-pointer">
                  <div className="bg-neutral-100 aspect-[3/4] mb-3 overflow-hidden relative rounded-lg">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    {/* Kombinlere özel siyah etiket */}
                    <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">TAM TAKIM</div>
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{product.name}</h3>
                  <p className="text-neutral-900 font-black text-sm mt-0.5">{product.price},00 TL</p>
                </Link>
              ))}
              {products.filter(p => p.category === 'KOMBİN').length === 0 && (
                [1,2,3,4].map(i => <div key={i} className="min-w-[200px] aspect-[3/4] bg-neutral-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-neutral-400 font-bold">Yakında</div>)
              )}
            </div>
          </section>

          {/* 4. ÇANTA BÖLÜMÜ */}
          <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-6 border-b border-neutral-200 pb-2">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">ÇANTA KOLEKSİYONU</h2>
                <p className="text-xs text-neutral-500 font-medium mt-1">Tarzını tamamlayan ikonik tasarımlar</p>
              </div>
              <button onClick={() => setActiveCategory('ÇANTA')} className="text-xs font-bold text-[#db2777] hover:underline uppercase tracking-wider">Tümünü Gör</button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {products.filter(p => p.category === 'ÇANTA').slice(0, 8).map(product => (
                <Link href={`/urun/${product.id}`} key={product.id} className="min-w-[200px] max-w-[200px] snap-start group cursor-pointer">
                  <div className="bg-neutral-100 aspect-[3/4] mb-3 overflow-hidden relative rounded-lg">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{product.name}</h3>
                  <p className="text-[#db2777] font-black text-sm mt-0.5">{product.price},00 TL</p>
                </Link>
              ))}
               {products.filter(p => p.category === 'ÇANTA').length === 0 && (
                [1,2,3,4].map(i => <div key={i} className="min-w-[200px] aspect-[3/4] bg-neutral-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-neutral-400 font-bold">Yakında</div>)
              )}
            </div>
          </section>

        </div>
      )}

{/* 4. KURUMSAL E-TİCARET FOOTER (YAMAN MEDYA HAKLARIYLA) */}
      <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Marka & Hakkında */}
          <div>
            <h3 className="text-white text-2xl font-black mb-4 tracking-tighter">TUTU<span className="text-[#db2777]">✮⋆</span></h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Tarzınızı yansıtan, modern ve yenilikçi moda anlayışıyla her anınızda yanınızdayız. Kaliteyi hisset, tarzını yaşa.
            </p>
          </div>

          {/* Müşteri Hizmetleri */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Müşteri Hizmetleri</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-[#db2777] transition">Sipariş Takibi</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">Teslimat ve Kargo</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">İade ve Değişim Şartları</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">Beden Tablosu</Link></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Kurumsal Bilgiler</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-[#db2777] transition">Hakkımızda</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">Gizlilik ve Çerez Politikası</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition">İletişim</Link></li>
            </ul>
          </div>

          {/* Güvenlik & İletişim */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Güvenli Alışveriş</h4>
            <p className="text-xs text-neutral-400 mb-4">256-bit SSL sertifikası ile %100 güvenli alışveriş altyapısı.</p>
            <div className="flex gap-2 opacity-50 grayscale">
              <div className="w-10 h-6 bg-white rounded border border-neutral-700 flex items-center justify-center text-[8px] font-bold text-neutral-900">VISA</div>
              <div className="w-10 h-6 bg-white rounded border border-neutral-700 flex items-center justify-center text-[8px] font-bold text-neutral-900">MC</div>
              <div className="w-10 h-6 bg-white rounded border border-neutral-700 flex items-center justify-center text-[8px] font-bold text-neutral-900">TROY</div>
            </div>
          </div>

        </div>

        {/* YASAL UYARI VE YAMAN MEDYA HAKLARI */}
        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500 font-medium">
            © 2026 TUTU Giyim. Tüm Hakları <span className="font-bold text-white">Yaman Medya</span>'ya Aittir.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-neutral-500 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </Link>
            <Link href="#" className="text-neutral-500 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

