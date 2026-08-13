import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Renacer Drinks & Coffe | Cafetería en Barquisimeto",
  description:
    "Descubre Renacer Drinks & Coffe: cafetería artesanal en Barquisimeto, Lara. Bebidas frías y calientes, postres y un ambiente para renacer. Pide por WhatsApp.",
  openGraph: {
    title: "Renacer Drinks & Coffe",
    description:
      "Cafetería artesanal en Barquisimeto, Lara. Pide tu bebida favorita por WhatsApp.",
    images: [{ url: "/logo.png", width: 725, height: 717, alt: "Renacer Drinks & Coffe" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
