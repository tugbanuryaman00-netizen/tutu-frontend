"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UrunDetay() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [mainSize, setMainSize] = useState('S');
  const [mainColor, setMainColor] = useState('Siyah');
  const [activeImage, setActiveImage] = useState('');
  
  // Accordion (Açılır Kutu) State'leri
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          const products = data.data;
          setAllProducts(products); // Alttaki "Bunu da Beğenebilirsiniz" için hepsini hafızaya al
          
          const foundProduct = products.find(p => p.id.toString() === id.toString());
          setProduct(foundProduct);
          
          if(foundProduct) {
            setActiveImage(foundProduct.image_url); // Ana resmi ayarla
            if(foundProduct.category.includes('GİYİM') || foundProduct.category === 'KOMBİN') setMainSize('S');
            else setMainSize('Standart Beden');
          }
        }
      } catch (error) {
        console.error("Ürün bulunamadı:", error);
      } finally {
        setIsLoading(false);
      }
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

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('tutu_cart')) || [];
    const cartItem = {
      ...product,
      selectedSize: mainSize,
      selectedColor: mainColor,
      cartImage: activeImage, // Seçilen rengin/pozun resmini sepete atar
      uniqueId: product.id + '-' + mainSize + '-' + mainColor + '-' + Math.random()
    };
    existingCart.push(cartItem);
    localStorage.setItem('tutu_cart', JSON.stringify(existingCart));
    window.location.href = '/?cart=open';
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Ürün Bulunamadı</h1>
        <a href="/" className="text-pink-600 font-bold hover:underline">← Ana Sayfaya Dön</a>
      </div>
    );
  }

  // Çoklu Resim / Renk Simülasyonu (İleride admin panele eklenecek, şimdilik placeholder array)
  // Eğer veritabanında "images" array'i yoksa, ana resmi 3 kez koyarak simüle ediyoruz.
  const galleryImages = product.gallery || [product.image_url, product.image_url, product.image_url];

  // Rastgele Diğer Ürünleri Seç (Mevcut ürün hariç, en fazla 6 tane)
  const randomProducts = allProducts
    .filter(p => p.id.toString() !== id.toString())
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      
      {/* 1. WHATSAPP BUTONU (SABİT) */}
      <a href={`https://wa.me/905331400419?text=${encodeURIComponent(`Merhaba, ${product.name} ürünü hakkında bilgi almak istiyorum. (Link: https://tutugiyim.com.tr/urun/${product.id})`)}`} 
         target="_blank" rel="noopener noreferrer" 
         className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:bg-[#128C7E] transition-all transform hover:scale-110">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a5.49 5.49 0 0 1-2.793-.768l-.2-.116-2.073.544.553-2.016-.128-.212a5.49 5.49 0 0 1-.84-2.883c0-3.036 2.47-5.505 5.507-5.505 1.47 0 2.853.573 3.89 1.614a5.474 5.474 0 0 1 1.605 3.888c0 3.037-2.47 5.506-5.505 5.506z"/></svg>
      </a>

      {/* 2. ÜST BİLGİ VE ÜRÜN DETAYI */}
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
        <a href="/" className="mb-8 inline-block text-sm font-bold text-neutral-400 hover:text-pink-600 transition tracking-wide">
          ← Alışverişe Devam Et
        </a>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-16">
          
          {/* SOL TARAF: ÇOKLU RESİM GALERİSİ */}
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Küçük Seçilebilir Resimler (Mobilde yatay, PC'de dikey) */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0 hide-scrollbar">
              {galleryImages.map((img, idx) => (
                <button key={idx} onMouseEnter={() => setActiveImage(img)} onClick={() => setActiveImage(img)} className={`w-20 md:w-24 aspect-[3/4] border-2 rounded-md overflow-hidden transition-all ${activeImage === img ? 'border-pink-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            {/* Ana Büyük Resim */}
            <div className="bg-neutral-50 flex-1 aspect-[3/4] overflow-hidden rounded-xl border border-neutral-100 shadow-sm relative group">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>

          {/* SAĞ TARAF: ÜRÜN BİLGİLERİ VE SEPETE EKLE */}
          <div className="md:col-span-5 flex flex-col justify-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 bg-pink-50 px-2.5 py-1 rounded w-max mb-3">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight leading-tight">{product.name}</h1>
            <p className="text-3xl font-black text-[#db2777] mt-4">{product.price},00 TL</p>
            
            {/* SEO Description (Açıklama) buraya yansır */}
            <p className="text-sm text-neutral-500 mt-6 font-medium leading-relaxed pb-6 border-b border-neutral-100">
              {product.description || "TUTU Giyim kalitesiyle özel olarak üretilen bu parça, modern ve şık hatlarıyla gardırobunuzun vazgeçilmezi olmaya aday. Tüm detayları özenle tasarlanmıştır."}
            </p>

            <div className="mt-6 space-y-8">
              {/* Renk Seçimi */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Renk Seçimi</h4>
                  <span className="text-xs font-bold text-neutral-400">{mainColor}</span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {['Siyah', 'Beyaz', 'Ekru', 'Pudra Pink'].map(c => (
                    <button key={c} onClick={() => setMainColor(c)} className={`px-5 py-2.5 text-xs font-bold border rounded-md transition-all ${mainColor === c ? 'border-[#db2777] text-[#db2777] bg-pink-50 shadow-sm' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beden Seçimi */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Beden Seçimi</h4>
                  <span className="text-[#db2777] text-xs font-bold hover:underline cursor-pointer">Beden Tablosu</span>
                </div>
                {product.category.includes('GİYİM') || product.category === 'KOMBİN' ? (
                  <div className="flex gap-3">
                    {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                      <button key={s} onClick={() => setMainSize(s)} className={`w-12 h-12 text-xs font-black border transition-all rounded-full flex items-center justify-center ${mainSize === s ? 'border-neutral-900 bg-neutral-900 text-white shadow-md transform scale-110' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="inline-block px-5 py-2.5 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-md border border-neutral-200 cursor-not-allowed w-full text-center">Standart Beden</span>
                )}
              </div>
              
              <button onClick={handleAddToCart} className="w-full bg-neutral-900 text-white px-12 py-5 font-bold tracking-widest text-sm rounded-lg hover:bg-[#db2777] shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_rgba(219,39,119,0.3)] transition-all duration-300 transform hover:-translate-y-1">
                SEPETE EKLE
              </button>
            </div>

            {/* 3. AÇILIR BİLGİ KUTULARI (ACCORDION) */}
            <div className="mt-10 border-t border-neutral-200 divide-y divide-neutral-200">
              
              {/* Ürün Detayları Kutusu */}
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'detay' ? null : 'detay')} className="w-full flex justify-between items-center font-bold text-sm text-neutral-800 uppercase tracking-wider focus:outline-none">
                  Kumaş ve Ürün Detayları
                  <span className="text-xl font-light text-neutral-400">{openAccordion === 'detay' ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openAccordion === 'detay' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Kumaş Tipi: %100 Pamuk / Cotton. Terletmeyen nefes alabilir doku.<br/>
                    Yıkama Talimatı: 30 derecede hassas yıkama önerilir. Ağartıcı kullanmayınız.
                  </p>
                </div>
              </div>

              {/* Kargo Kutusu */}
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'kargo' ? null : 'kargo')} className="w-full flex justify-between items-center font-bold text-sm text-neutral-800 uppercase tracking-wider focus:outline-none">
                  Kargo & Teslimat
                  <span className="text-xl font-light text-neutral-400">{openAccordion === 'kargo' ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openAccordion === 'kargo' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Siparişleriniz 24 saat içinde MNG veya Yurtiçi Kargo'ya teslim edilir.<br/>
                    <strong className="text-neutral-800">500 TL ve üzeri alışverişlerinizde kargo ücretsizdir.</strong>
                  </p>
                </div>
              </div>

              {/* İade Kutusu */}
              <div className="py-4">
                <button onClick={() => setOpenAccordion(openAccordion === 'iade' ? null : 'iade')} className="w-full flex justify-between items-center font-bold text-sm text-neutral-800 uppercase tracking-wider focus:outline-none">
                  İade & Değişim Koşulları
                  <span className="text-xl font-light text-neutral-400">{openAccordion === 'iade' ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openAccordion === 'iade' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Ürünün etiketi koparılmamış ve kullanılmamış olması şartıyla <strong>14 gün içinde</strong> koşulsuz iade ve değişim yapabilirsiniz. İade kargo ücretleri firmamıza aittir.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 4. DİĞER ALABİLECEĞİNİZ ÜRÜNLER (CROSS-SELLING) */}
      {randomProducts.length > 0 && (
        <section className="bg-neutral-50 py-16 border-t border-neutral-100 mt-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-widest">BUNLARI DA BEĞENEBİLİRSİNİZ</h2>
              <div className="w-16 h-1 bg-pink-600 mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {randomProducts.map(rp => (
                <Link href={`/urun/${rp.id}`} key={rp.id} className="group bg-white rounded-lg p-2 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-pink-100">
                  <div className="aspect-[3/4] bg-neutral-100 overflow-hidden rounded mb-3">
                    <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  </div>
                  <h3 className="text-[11px] font-bold text-neutral-700 line-clamp-1 group-hover:text-pink-600">{rp.name}</h3>
                  <p className="text-pink-600 font-black text-xs mt-1">{rp.price},00 TL</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. YENİ GELİŞMİŞ KURUMSAL FOOTER */}
      <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Marka & Hakkında */}
          <div>
            <h3 className="text-white text-3xl font-black mb-4 tracking-tighter">TUTU<span className="text-[#db2777]">✮⋆</span></h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Tarzınızı yansıtan, modern ve yenilikçi moda anlayışıyla her anınızda yanınızdayız. Kaliteyi hisset, tarzını yaşa.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#db2777] hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a>
              <a href="#" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#db2777] hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>
            </div>
          </div>

          {/* Kurumsal Bilgiler (KVKK, Hakkımızda vb) */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Kurumsal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>Hakkımızda</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>İletişim</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>KVKK - Gizlilik Politikası</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>Aydınlatma Metni</Link></li>
            </ul>
          </div>

          {/* Alışveriş (İade, Sözleşme vb) */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Alışveriş</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>Güvenli Alışveriş</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>İade & Değişim Koşulları</Link></li>
              <li><Link href="#" className="hover:text-[#db2777] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#db2777] rounded-full"></span>S.S.S (Sıkça Sorulanlar)</Link></li>
            </ul>
          </div>

          {/* Güvenlik & Ödeme */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs border-b border-neutral-700 pb-2 inline-block">Güvenli Ödeme</h4>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">Sitemizdeki tüm işlemler 256-bit SSL şifreleme teknolojisi ile korunmaktadır. Kart bilgileriniz güvendedir.</p>
            <div className="flex gap-2">
              <div className="w-12 h-8 bg-white rounded border border-neutral-700 flex items-center justify-center text-[10px] font-black text-blue-900 shadow-inner">VISA</div>
              <div className="w-12 h-8 bg-white rounded border border-neutral-700 flex items-center justify-center text-[10px] font-black text-red-600 shadow-inner">MC</div>
              <div className="w-12 h-8 bg-white rounded border border-neutral-700 flex items-center justify-center text-[10px] font-black text-teal-600 shadow-inner">TROY</div>
            </div>
          </div>

        </div>

        {/* Telif Hakkı (Yaman Medya) */}
        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-neutral-800 text-center">
          <p className="text-xs text-neutral-500 font-medium tracking-wide">
            © 2026 TUTU Giyim Platformu. Tüm Hakları <span className="font-bold text-white tracking-widest uppercase">Yaman Medya</span> Tarafından Saklıdır.
          </p>
        </div>
      </footer>

    </div>
  );
}