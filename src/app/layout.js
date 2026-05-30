import "./globals.css";

export const metadata = {
  title: "TUTU Giyim | Premium Kadın Butik",
  description: "Zarafeti Keşfet - En yeni sezon kadın giyim koleksiyonu",
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