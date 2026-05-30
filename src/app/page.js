"use client";import React, { useState, useEffect } from 'react';export default function Home() {
  // --- Sistem Durumları (State) ---
  const [products, setProducts] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [activeCategory, setActiveCategory] = useState('TÜMÜ');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- Ürün Detay ve Varyant Durumları ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mainSize, setMainSize] = useState('S');
  const [mainColor, setMainColor] = useState('Siyah');
  
  // Kombin ürünlerinin seçimlerini tutan nesne (Örn: { urunId: { size: 'M', color: 'Beyaz', checked: true } })
  const [kombinSelections, setKombinSelections] = useState({});

  // Veritabanından Ürünleri Çek
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

  // Ana ürün değiştiğinde kombin seçimlerini sıfırla ve otomatik ata
  useEffect(() => {
    if (selectedProduct) {
      setMainSize(selectedProduct.category === 'GİYİM' ? 'S' : 'Standart Beden');
      setMainColor('Siyah');
      
      // İncelenen ürün dışındaki kategorilerden kombin önerileri belirle
      const matches = products.filter(p => p.id !== selectedProduct.id && p.category !== selectedProduct.category).slice(0, 2);
      const initialKombin = {};
      matches.forEach(p => {
        initialKombin[p.id] = {
          size: p.category === 'GİYİM' ? 'S' : 'Standart Beden',
          color: 'Siyah',
          checked: true,
          product: p
        };
      });
      setKombinSelections(initialKombin);
    }
  }, [selectedProduct, products]);

  // --- Sepet Fonksiyonları ---
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

  // Toplu Kombin Siparişi Ekleme
  const handleKombinSubmit = () => {
    if (!selectedProduct) return;
    
    // 1. Önce Ana Ürünü Ekle
    addToCart(selectedProduct, mainSize, mainColor);

    // 2. Seçili (Onaylı) Kombin Ürünlerini Sırayla Ekle
    Object.keys(kombinSelections).forEach(id => {
      const selection = kombinSelections[id];
      if (selection.checked) {
        addToCart(selection.product, selection.size, selection.color);
      }
    });
  };

  const removeFromCart = (uniqueId) => {
    setCart(cart.filter((item) => item.uniqueId !== uniqueId));
  };

  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  // Kategori Filtreleme (Katalog için)
  const filteredProducts = activeCategory === 'TÜMÜ' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // Yükleniyor Animasyonu
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-500 font-medium tracking-widest uppercase text-sm">TUTU Altyapısı Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 relative">
      
      {/* --- SEPET YAN PANELİ --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Sepetim ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 hover:text-pink-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
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
  onClick={() => {
    const name = prompt("Adınız Soyadınız:");
    const phone = prompt("Telefon Numaranız:");
    const address = prompt("Teslimat Adresiniz:");
    if(name && phone && address) {
      fetch('https://tutu-backend-api.onrender.com/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, phone, address, total_amount: cartTotal, items: cart })
      }).then(() => alert("Siparişiniz başarıyla alındı!"));
      setCart([]); setIsCartOpen(false);
    }
  }}
  className={`w-full py-4 rounded-sm font-bold text-white transition ${cart.length === 0 ? 'bg-neutral-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-neutral-900'}`}
  disabled={cart.length === 0}
>
  GÜVENLİ ÖDEMEYE GEÇ
</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ÜST NAVBAR --- */}
      <header className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div onClick={() => setSelectedProduct(null)} className="text-3xl font-extrabold tracking-tighter text-neutral-900 flex items-center gap-1 cursor-pointer">
            TUTU<span className="text-pink-600">✮⋆˙</span>
          </div>
          
          <nav className="hidden md:flex space-x-8 font-medium text-sm text-neutral-500">
            {['TÜMÜ', 'GİYİM', 'ÇANTA', 'AKSESUAR'].map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setSelectedProduct(null); }} className={`transition duration-300 ${activeCategory === cat && !selectedProduct ? 'text-pink-600 font-bold border-b-2 border-pink-600' : 'hover:text-pink-600'}`}>
                {cat}
              </button>
            ))}
          </nav>

          <div className="flex space-x-5 text-neutral-800">
            <button onClick={() => setIsCartOpen(true)} className="hover:text-pink-600 transition relative transform hover:scale-110">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"></path></svg>
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- GÖRÜNÜM KONTROLÜ (DETAY VEYA KATALOG) --- */}
      {selectedProduct ? (
        /* ================= ÜRÜN DETAY SAYFASI GÖRÜNÜMÜ ================= */
        <div className="container mx-auto px-4 py-10 max-w-5xl animate-fade-in">
          <button onClick={() => setSelectedProduct(null)} className="mb-8 flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-pink-600 transition">
            ← Alışverişe Devam Et
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 pb-16">
            {/* Ürün Görseli */}
            <div className="bg-neutral-50 aspect-[3/4] border border-gray-100 overflow-hidden rounded-sm">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400">Görsel Yok</div>
              )}
            </div>

            {/* Ürün Detayları Bilgisi */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-1 rounded">{selectedProduct.category}</span>
                <h1 className="text-3xl font-extrabold text-neutral-900 mt-4 tracking-tight">{selectedProduct.name}</h1>
                <p className="text-2xl font-black text-pink-600 mt-3">{selectedProduct.price},00 TL</p>
                <p className="text-sm text-neutral-500 mt-6 font-light leading-relaxed">TUTU Giyim kalitesiyle özel olarak üretilen bu parça, modern ve şık hatlarıyla gardırobunuzun vazgeçilmezi olmaya aday.</p>
              </div>

              {/* Varyant Seçimleri */}
              <div className="mt-8 space-y-6">
                {/* Renk Seçimi */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 tracking-wider uppercase mb-3">Renk Seçimi: {mainColor}</h4>
                  <div className="flex gap-2">
                    {['Siyah', 'Beyaz', 'Ekru', 'Pudra Pink'].map(c => (
                      <button key={c} onClick={() => setMainColor(c)} className={`px-4 py-2 text-xs font-medium border transition ${mainColor === c ? 'border-pink-600 text-pink-600 bg-pink-50/50 font-bold' : 'border-gray-200 text-neutral-600 hover:border-neutral-400'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beden Seçimi (Dinamik Kontrol) */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 tracking-wider uppercase mb-3">Beden Seçimi: {mainSize}</h4>
                  {selectedProduct.category === 'GİYİM' ? (
                    <div className="flex gap-2">
                      {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                        <button key={s} onClick={() => setMainSize(s)} className={`w-12 h-12 text-xs font-semibold border transition rounded-full flex items-center justify-center ${mainSize === s ? 'border-neutral-900 bg-neutral-900 text-white font-bold' : 'border-gray-200 text-neutral-600 hover:border-neutral-900'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block px-4 py-2 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-sm border border-neutral-200 cursor-not-allowed">Standart Beden (One Size)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= BU KOMBİNİ TAMAMLA MENÜSÜ ================= */}
          <div className="py-16">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 mb-8">Bu Kombini Tamamla</h3>
            <div className="space-y-6 max-w-3xl">
              {Object.keys(kombinSelections).map(id => {
                const item = kombinSelections[id];
                return (
                  <div key={id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-neutral-50 border border-neutral-100 rounded-sm gap-4">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedProduct(item.product)}>
                      <input type="checkbox" checked={item.checked} onChange={(e) => setKombinSelections({ ...kombinSelections, [id]: { ...item, checked: e.target.checked } })} onClick={(e) => e.stopPropagation()} className="w-5 h-5 accent-pink-600 cursor-pointer" />
                      {item.product.image_url && <img src={item.product.image_url} alt={item.product.name} className="w-12 h-16 object-cover bg-white border border-gray-100" />}
                      <div>
                        <h5 className="text-sm font-semibold hover:text-pink-600 transition">{item.product.name}</h5>
                        <p className="text-sm font-bold text-neutral-900 mt-0.5">{item.product.price},00 TL</p>
                      </div>
                    </div>

                    {/* Kombin Ürünü Beden/Renk Seçimi */}
                    <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                      <select value={item.color} onChange={(e) => setKombinSelections({ ...kombinSelections, [id]: { ...item, color: e.target.value } })} className="text-xs bg-white border border-gray-200 p-2 rounded focus:outline-none focus:border-pink-500">
                        <option value="Siyah">Siyah</option>
                        <option value="Beyaz">Beyaz</option>
                        <option value="Taba">Taba</option>
                      </select>
                      
                      {item.product.category === 'GİYİM' ? (
                        <select value={item.size} onChange={(e) => setKombinSelections({ ...kombinSelections, [id]: { ...item, size: e.target.value } })} className="text-xs bg-white border border-gray-200 p-2 rounded focus:outline-none focus:border-pink-500">
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded">Standart</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Büyük Sepet Aksiyon Butonu */}
            <div className="mt-10 border-t border-gray-100 pt-8">
              <button onClick={handleKombinSubmit} className="bg-pink-600 text-white px-12 py-5 font-bold tracking-widest text-sm hover:bg-neutral-900 shadow-xl transition-all duration-300">
                SEÇİLEN KOMBİNİ SEPETE EKLE
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STANDART KATALOG GÖRÜNÜMÜ ================= */
        <>
          {/* HERO BANNER */}
          <section className="relative bg-gradient-to-b from-pink-50/30 to-white py-24 border-b border-gray-100">
            <div className="container mx-auto px-4 flex flex-col items-center text-center">
              <span className="text-pink-600 font-bold tracking-widest text-sm mb-4 uppercase">Yeni Sezon Koleksiyonu</span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 mb-6 tracking-tight">
                Şehrin <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700">Ritmini</span> Yakala
              </h1>
              <p className="text-lg md:text-xl text-neutral-500 mb-10 max-w-2xl font-light">Modern kadının gücünden ilham alan yepyeni tasarımları keşfet. Premium dokular, zamansız çizgiler.</p>
            </div>
          </section>

          {/* ÜRÜN LİSTELEME GRİDİ */}
          <section className="py-16 container mx-auto px-4">
            <div className="flex justify-between items-end mb-10 border-b border-gray-100 pb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                {activeCategory === 'TÜMÜ' ? 'Sezonun Öne Çıkanları' : `${activeCategory} Koleksiyonu`}
              </h2>
              <span className="text-sm font-medium text-neutral-500">{filteredProducts.length} Ürün Listeleniyor</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {filteredProducts.map((product) => (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="group flex flex-col cursor-pointer">
                  {/* Resim Alanı */}
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
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}