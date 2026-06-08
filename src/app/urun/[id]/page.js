"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../supabase';

export default function UrunDetay() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [mainSize, setMainSize] = useState('S');
  const [mainColor, setMainColor] = useState('Siyah');
  const [activeImage, setActiveImage] = useState('');
  const [openAccordion, setOpenAccordion] = useState(null);

  // HEADER VE SEPET İÇİN GEREKLİ STATE'LER
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', city: '', district: '', neighborhood: '', address: '', saveAddress: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sayfa yüklendiğinde sepeti ve kullanıcıyı kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutu_cart');
      if (saved) setCart(JSON.parse(saved));
    }
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  // Sepet her değiştiğinde hafızaya yaz
  useEffect(() => {
    localStorage.setItem('tutu_cart', JSON.stringify(cart));
  }, [cart]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Giriş yapılırken bir hata oluştu!");
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          setAllProducts(data.data);
          const foundProduct = data.data.find(p => p.id.toString() === id.toString());
          setProduct(foundProduct);
          if(foundProduct) {
            setActiveImage(foundProduct.image_url);
            if(foundProduct.category.includes('GİYİM') || foundProduct.category === 'KOMBİN') setMainSize('S');
            else setMainSize('Standart Beden');
          }
        }
      } catch (error) { console.error("Ürün bulunamadı:", error); } 
      finally { setIsLoading(false); }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Ürün Bulunamadı</h1>
        <a href="/" className="text-[#db2777] font-bold hover:underline">← Ana Sayfaya Dön</a>
      </div>
    );
  }

  // YENİ SEPETE EKLEME MANTIĞI (SAYFA DEĞİŞTİRMEZ, YANDAN AÇAR)
  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      selectedSize: mainSize,
      selectedColor: mainColor,
      cartImage: activeImage,
      uniqueId: product.id + '-' + mainSize + '-' + mainColor + '-' + Math.random()
    };
    setCart(prevCart => [...prevCart, cartItem]);
    setIsCartOpen(true); // Çekmeceyi aç
  };

  const removeFromCart = (uniqueId) => {
    setCart(cart.filter((item) => item.uniqueId !== uniqueId));
  };

  const cartTotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.city || !checkoutForm.address) { alert("Lütfen adres bilgilerinizi eksiksiz doldurun."); return; }
    const fullShippingAddress = `${checkoutForm.city} / ${checkoutForm.district} / ${checkoutForm.neighborhood} Mah. - Açık Adres: ${checkoutForm.address}`;
    try {
      const response = await fetch('https://tutu-backend-api.onrender.com/api/payment/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: checkoutForm.name, phone: checkoutForm.phone, address: fullShippingAddress, total_amount: Number(cartTotal), items: cart, user_id: user ? user.id : null })
      });
      const data = await response.json();
      if (data.success) {
        alert("Siparişiniz başarıyla alındı!");
        localStorage.removeItem('tutu_cart');
        setCart([]); setIsCartOpen(false); setIsCheckoutMode(false);
        setCheckoutForm({ name: '', phone: '', city: '', district: '', neighborhood: '', address: '', saveAddress: false });
      } else alert("Sipariş oluşturulamadı: " + data.message);
    } catch (error) { alert("Bağlantı hatası yaşandı."); }
  };

  // İleride admin panelden eklenecek galeri resimleri için akıllı array
  const galleryImages = product.gallery_images ? JSON.parse(product.gallery_images) : [product.image_url, product.image_url, product.image_url];

  const randomProducts = allProducts.filter(p => p.id.toString() !== id.toString()).sort(() => 0.5 - Math.random()).slice(0, 6);
  
  // Arama Filtresi (Header için)
  const searchLower = searchQuery.toLowerCase();
  const filteredProducts = allProducts.filter(p => 
    p.name?.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower) || p.tag?.toLowerCase().includes(searchLower) || p.category?.toLowerCase().includes(searchLower)
  );

  const cartProductIds = cart.map(c => c.id);
  const crossSellProducts = allProducts.filter(p => !cartProductIds.includes(p.id) && p.id.toString() !== id.toString()).sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 relative">
      
      {/* SABİT WHATSAPP BUTONU */}
      <a href={`https://wa.me/905331400419?text=${encodeURIComponent(`Merhaba, ${product.name} ürünü hakkında bilgi almak istiyorum.`)}`} 
         target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-all">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
      </a>

      {/* --- GOOGLE GİRİŞ PENCERESİ (MODAL) --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-[#db2777] transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="p-10 text-center mt-2">
              <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tighter mb-3">TUTU<span className="text-[#db2777]">✮⋆</span></h2>
              <p className="text-neutral-500 font-medium mb-8">Siparişlerini takip etmek için giriş yap.</p>
              <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 text-neutral-700 font-bold py-4 rounded-xl hover:bg-neutral-50 transition shadow-sm mb-4">
                Google ile Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEPET VE KASA YAN PANELİ */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{isCheckoutMode ? 'Teslimat Bilgileri' : `Sepetim (${cart.length})`}</h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutMode(false); }} className="text-neutral-400 hover:text-[#db2777] transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {!isCheckoutMode ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? <div className="text-center text-neutral-500 mt-10">Sepetiniz boş.</div> : (
                    cart.map((item) => (
                      <div key={item.uniqueId} className="flex justify-between items-start border-b border-gray-100 pb-4">
                        <div className="flex gap-3">
                          <img src={item.cartImage || item.image_url} alt={item.name} className="w-12 h-16 object-cover bg-neutral-100 rounded" />
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800">{item.name}</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">Renk: {item.selectedColor} | Beden: {item.selectedSize}</p>
                            <p className="text-[#db2777] font-bold text-sm mt-1">{item.price},00 TL</p>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.uniqueId)} className="text-xs text-red-500 hover:underline">Kaldır</button>
                      </div>
                    ))
                  )}

                  {/* CROSS-SELLING */}
                  {crossSellProducts.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-neutral-100">
                      <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Bunları Da Sevebilirsiniz</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {crossSellProducts.map(rp => (
                          <Link href={`/urun/${rp.id}`} key={rp.id} onClick={() => setIsCartOpen(false)} className="group border border-neutral-100 rounded p-2 hover:border-pink-200 transition bg-white block">
                            <div className="aspect-[3/4] bg-neutral-50 overflow-hidden mb-2 rounded-sm relative">
                              <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <h4 className="text-[10px] font-bold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{rp.name}</h4>
                            <p className="text-[#db2777] font-black text-xs mt-0.5">{rp.price},00 TL</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-neutral-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-lg">Toplam:</span>
                    <span className="font-bold text-2xl text-[#db2777]">{cartTotal},00 TL</span>
                  </div>
                  <button onClick={() => setIsCheckoutMode(true)} disabled={cart.length === 0} className={`w-full py-4 rounded-sm font-bold text-white transition ${cart.length === 0 ? 'bg-neutral-300 cursor-not-allowed' : 'bg-[#db2777] hover:bg-neutral-900'}`}>
                    GÜVENLİ ÖDEMEYE GEÇ
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={submitOrder} className="flex-1 overflow-y-auto p-6 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Ad Soyad *</label>
                    <input type="text" required value={checkoutForm.name} onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Telefon *</label>
                    <input type="tel" required value={checkoutForm.phone} onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">İl *</label><input type="text" required value={checkoutForm.city} onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50" /></div>
                    <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">İlçe *</label><input type="text" required value={checkoutForm.district} onChange={(e) => setCheckoutForm({...checkoutForm, district: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50" /></div>
                  </div>
                  <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Mahalle *</label><input type="text" required value={checkoutForm.neighborhood} onChange={(e) => setCheckoutForm({...checkoutForm, neighborhood: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50" /></div>
                  <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Açık Adres *</label><textarea required value={checkoutForm.address} onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full px-4 py-2.5 rounded border focus:border-[#db2777] bg-neutral-50 h-20 resize-none"></textarea></div>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center mb-6"><span className="font-semibold text-neutral-500">Toplam:</span><span className="font-black text-2xl text-neutral-900">{cartTotal},00 TL</span></div>
                  <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-4 rounded-lg hover:bg-[#db2777] transition tracking-widest">SİPARİŞİ TAMAMLA</button>
                  <button type="button" onClick={() => setIsCheckoutMode(false)} className="w-full mt-3 text-sm font-semibold text-neutral-500 hover:text-neutral-900 py-2">← Sepete Dön</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* HEADER (ARAMA VE İKONLAR) */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tighter text-neutral-900 shrink-0">TUTU<span className="text-[#db2777]">✮⋆</span></Link>

          <div className="hidden lg:flex items-center relative w-72 ml-4">
            <input type="text" placeholder="Ürün ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-100 text-sm px-4 py-2.5 rounded-full pl-10 border-transparent focus:bg-white focus:border-[#db2777] focus:outline-none transition-all shadow-inner font-medium relative z-50" />
            <svg className="w-4 h-4 text-neutral-400 absolute left-4 z-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 text-neutral-400 hover:text-[#db2777] z-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>}
            
            {searchQuery.length > 0 && (
              <div className="absolute top-full mt-3 right-0 w-[350px] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden z-[100] max-h-[450px] overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="py-2">
                    {filteredProducts.slice(0, 5).map((p) => (
                      <Link href={`/urun/${p.id}`} key={p.id} onClick={() => setSearchQuery('')} className="flex items-center gap-4 p-3 hover:bg-neutral-50 transition border-b border-neutral-50 group">
                        <img src={p.image_url} className="w-10 h-12 object-cover rounded" />
                        <div><h4 className="text-xs font-bold">{p.name}</h4><p className="text-[#db2777] text-xs font-black">{p.price} TL</p></div>
                      </Link>
                    ))}
                  </div>
                ) : <div className="p-8 text-center text-sm font-bold text-neutral-400">Bulunamadı.</div>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 md:gap-6 shrink-0">
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="flex lg:hidden flex-col items-center text-neutral-600 hover:text-[#db2777]"><svg className="w-[22px] h-[22px] mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span className="text-[10px] font-bold">Ara</span></button>
            <button onClick={() => user ? window.location.href='/hesabim' : setIsAuthModalOpen(true)} className="flex flex-col items-center text-neutral-600 hover:text-[#db2777]"><svg className="w-[22px] h-[22px] mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span className="text-[10px] font-bold">Hesabım</span></button>
            <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center text-neutral-600 hover:text-[#db2777] relative"><svg className="w-[22px] h-[22px] mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg><span className="text-[10px] font-bold">Sepetim</span>{cart.length > 0 && <span className="absolute -top-1 -right-2 bg-[#db2777] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}</button>
          </div>
        </div>
        
        {/* MOBİL ARAMA */}
        {isMobileSearchOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl z-[100] p-4">
            <input type="text" placeholder="Ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="w-full bg-neutral-100 px-4 py-3 rounded-xl focus:outline-none" />
            {searchQuery.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto">
                {filteredProducts.slice(0, 5).map(p => <Link href={`/urun/${p.id}`} key={p.id} onClick={() => {setSearchQuery(''); setIsMobileSearchOpen(false)}} className="block p-2 text-sm font-bold border-b">{p.name}</Link>)}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ÜRÜN İÇERİĞİ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-16">
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0 hide-scrollbar">
              {galleryImages.map((img, idx) => (
                <button key={idx} onMouseEnter={() => setActiveImage(img)} onClick={() => setActiveImage(img)} className={`w-20 md:w-24 aspect-[3/4] border-2 rounded-md overflow-hidden transition-all ${activeImage === img ? 'border-pink-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="bg-neutral-50 flex-1 aspect-[3/4] overflow-hidden rounded-xl border border-neutral-100 shadow-sm relative group">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#db2777] bg-pink-50 px-2.5 py-1 rounded w-max mb-3">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight leading-tight">{product.name}</h1>
            <p className="text-3xl font-black text-[#db2777] mt-4">{product.price},00 TL</p>
            <p className="text-sm text-neutral-500 mt-6 font-medium leading-relaxed pb-6 border-b border-neutral-100">{product.description || "TUTU Giyim kalitesiyle özel olarak üretilen bu parça, gardırobunuzun vazgeçilmezi olmaya aday."}</p>

            <div className="mt-6 space-y-8">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Renk: <span className="text-neutral-400">{mainColor}</span></h4>
                <div className="flex gap-2.5 flex-wrap">
                  {['Siyah', 'Beyaz', 'Ekru', 'Pudra Pink'].map(c => (
                    <button key={c} onClick={() => setMainColor(c)} className={`px-5 py-2.5 text-xs font-bold border rounded-md transition-all ${mainColor === c ? 'border-[#db2777] text-[#db2777] bg-pink-50 shadow-sm' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Beden Seçimi</h4>
                {product.category.includes('GİYİM') || product.category === 'KOMBİN' ? (
                  <div className="flex gap-3">
                    {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                      <button key={s} onClick={() => setMainSize(s)} className={`w-12 h-12 text-xs font-black border transition-all rounded-full flex items-center justify-center ${mainSize === s ? 'border-neutral-900 bg-neutral-900 text-white shadow-md transform scale-110' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>{s}</button>
                    ))}
                  </div>
                ) : <span className="inline-block px-5 py-2.5 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-md border w-full text-center">Standart Beden</span>}
              </div>
              
              <button onClick={handleAddToCart} className="w-full bg-neutral-900 text-white px-12 py-5 font-bold tracking-widest text-sm rounded-lg hover:bg-[#db2777] shadow-xl transition-all transform hover:-translate-y-1">SEPETE EKLE</button>
            </div>

            <div className="mt-10 border-t border-neutral-200 divide-y divide-neutral-200">
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'detay' ? null : 'detay')} className="w-full flex justify-between font-bold text-sm text-neutral-800 uppercase focus:outline-none">Kumaş ve Ürün Detayları <span className="text-xl font-light text-neutral-400">{openAccordion === 'detay' ? '−' : '+'}</span></button>
                <div className={`overflow-hidden transition-all duration-500 ${openAccordion === 'detay' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}><p className="text-sm text-neutral-500">Kumaş Tipi: %100 Pamuk / Cotton. Terletmeyen doku.<br/>Yıkama: 30 derecede hassas yıkama önerilir.</p></div>
              </div>
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'kargo' ? null : 'kargo')} className="w-full flex justify-between font-bold text-sm text-neutral-800 uppercase focus:outline-none">Kargo & Teslimat <span className="text-xl font-light text-neutral-400">{openAccordion === 'kargo' ? '−' : '+'}</span></button>
                <div className={`overflow-hidden transition-all duration-500 ${openAccordion === 'kargo' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}><p className="text-sm text-neutral-500">24 saat içinde kargoda.<br/><strong className="text-neutral-800">500 TL ve üzeri ücretsiz kargo.</strong></p></div>
              </div>
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'iade' ? null : 'iade')} className="w-full flex justify-between font-bold text-sm text-neutral-800 uppercase focus:outline-none">İade & Değişim Koşulları <span className="text-xl font-light text-neutral-400">{openAccordion === 'iade' ? '−' : '+'}</span></button>
                <div className={`overflow-hidden transition-all duration-500 ${openAccordion === 'iade' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}><p className="text-sm text-neutral-500">14 gün içinde koşulsuz iade ve değişim yapabilirsiniz.</p></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {randomProducts.length > 0 && (
        <section className="bg-neutral-50 py-16 border-t border-neutral-100 mt-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10"><h2 className="text-2xl font-black text-neutral-900 uppercase tracking-widest">BUNLARI DA BEĞENEBİLİRSİNİZ</h2><div className="w-16 h-1 bg-[#db2777] mx-auto mt-4"></div></div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {randomProducts.map(rp => (
                <Link href={`/urun/${rp.id}`} key={rp.id} className="group bg-white rounded-lg p-2 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-pink-100">
                  <div className="aspect-[3/4] bg-neutral-100 overflow-hidden rounded mb-3"><img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /></div>
                  <h3 className="text-[11px] font-bold text-neutral-700 line-clamp-1 group-hover:text-[#db2777]">{rp.name}</h3>
                  <p className="text-[#db2777] font-black text-xs mt-1">{rp.price},00 TL</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* YENİ GELİŞMİŞ KURUMSAL FOOTER */}
      <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div><h3 className="text-white text-3xl font-black mb-4 tracking-tighter">TUTU<span className="text-[#db2777]">✮⋆</span></h3><p className="text-sm text-neutral-400 mb-6">Tarzınızı yansıtan, modern ve yenilikçi moda anlayışıyla yanınızdayız.</p></div>
          <div><h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Kurumsal</h4><ul className="space-y-3 text-sm font-medium"><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">Hakkımızda</Link></li><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">İletişim</Link></li><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">KVKK Politikası</Link></li></ul></div>
          <div><h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Alışveriş</h4><ul className="space-y-3 text-sm font-medium"><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">Mesafeli Satış Sözleşmesi</Link></li><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">Güvenli Alışveriş</Link></li><li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2">İade & Değişim</Link></li></ul></div>
          <div><h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Güvenli Ödeme</h4><p className="text-xs text-neutral-400 mb-6">256-bit SSL şifreleme ile kart bilgileriniz güvendedir.</p></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-neutral-800 text-center"><p className="text-xs text-neutral-500 font-medium tracking-wide">© 2026 TUTU Giyim. Tüm Hakları <span className="font-bold text-white uppercase">Yaman Medya</span> Tarafından Saklıdır.</p></div>
      </footer>
    </div>
  );
}