import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSansHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e6396e",
};

export const metadata: Metadata = {
  title: "Renacer Drinks & Coffe | Cafetería en Barquisimeto",
  description:
    "Descubre Renacer Drinks & Coffe: cafetería artesanal en Barquisimeto, Lara. Bebidas frías y calientes, postres y un ambiente para renacer. Pide desde tu celular en la barra.",
  openGraph: {
    title: "Renacer Drinks & Coffe",
    description:
      "Cafetería artesanal en Barquisimeto, Lara. Pide tu bebida favorita desde tu celular.",
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
        className={`${plusJakartaSans.variable} ${plusJakartaSansHeading.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
