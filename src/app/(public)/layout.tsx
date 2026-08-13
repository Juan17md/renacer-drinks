import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Toaster } from "@/components/ui/sonner";
import { obtenerTasaBCV } from "@/lib/bcv";

export const revalidate = 3600;

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

export default async function LayoutPublico({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tasa = await obtenerTasaBCV();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar tasaBCV={tasa.promedio} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="top-center" />
    </div>
  );
}