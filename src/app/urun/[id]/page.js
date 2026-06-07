"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Sayfa linkinden ürün ID'sini alacak motor

export default function UrunDetay() {
  const { id } = useParams(); // URL'deki ürün ID'sini yakaladık
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mainSize, setMainSize] = useState('S');
  const [mainColor, setMainColor] = useState('Siyah');

  useEffect(() => {
    // Tüm ürünleri çekip, linkteki ID'ye uyanı buluyoruz
    const fetchProduct = async () => {
      try {
        const response = await fetch('https://tutu-backend-api.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          // Gelen ürünler arasından, linkteki id ile eşleşeni bul (String/Number eşleşmesi için id == product.id yapıyoruz)
          const foundProduct = data.data.find(p => p.id.toString() === id.toString());
          setProduct(foundProduct);
          if(foundProduct?.category === 'GİYİM') setMainSize('S');
          else setMainSize('Standart Beden');
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Ürün Bulunamadı</h1>
        <a href="/" className="text-pink-600 font-bold hover:underline">← Ana Sayfaya Dön</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl animate-fade-in min-h-screen">
      <a href="/" className="mb-8 inline-block text-sm font-semibold text-neutral-500 hover:text-pink-600 transition">
        ← Alışverişe Devam Et
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 pb-16">
        <div className="bg-neutral-50 aspect-[3/4] border border-gray-100 overflow-hidden rounded-sm">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400">Görsel Yok</div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-1 rounded w-max">{product.category}</span>
          <h1 className="text-3xl font-extrabold text-neutral-900 mt-4 tracking-tight">{product.name}</h1>
          <p className="text-2xl font-black text-pink-600 mt-3">{product.price},00 TL</p>
          <p className="text-sm text-neutral-500 mt-6 font-light leading-relaxed">TUTU Giyim kalitesiyle özel olarak üretilen bu parça, modern ve şık hatlarıyla gardırobunuzun vazgeçilmezi olmaya aday.</p>

          <div className="mt-8 space-y-6">
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

            <div>
              <h4 className="text-xs font-bold text-neutral-500 tracking-wider uppercase mb-3">Beden Seçimi: {mainSize}</h4>
              {product.category === 'GİYİM' ? (
                <div className="flex gap-2">
                  {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                    <button key={s} onClick={() => setMainSize(s)} className={`w-12 h-12 text-xs font-semibold border transition rounded-full flex items-center justify-center ${mainSize === s ? 'border-neutral-900 bg-neutral-900 text-white font-bold' : 'border-gray-200 text-neutral-600 hover:border-neutral-900'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="inline-block px-4 py-2 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-sm border border-neutral-200 cursor-not-allowed">Standart Beden</span>
              )}
            </div>
            
            <button className="w-full mt-6 bg-neutral-900 text-white px-12 py-5 font-bold tracking-widest text-sm hover:bg-pink-600 shadow-xl transition-all duration-300">
              SEPETE EKLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}