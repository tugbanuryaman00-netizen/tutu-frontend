import "./globals.css";

export const metadata = {
  title: 'TUTU Giyim | Modern Giyim ve Moda',
  description: 'TUTU Giyim ile en trend giyim, çanta ve aksesuar modellerini keşfedin. Güvenli alışveriş ve hızlı teslimat avantajı.',
  keywords: 'tutu giyim, kadın giyim, moda, trend elbiseler, şık çanta, yaman medya e-ticaret',
  authors: [{ name: 'Yaman Medya' }],
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-white text-gray-800">
        {children}
      </body>
    </html>
  );
}