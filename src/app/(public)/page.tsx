import { HeroSection } from "@/components/public/HeroSection";
import { PromosSection } from "@/components/public/PromosSection";
import { AboutSection } from "@/components/public/AboutSection";
import { LocationHoursSection } from "@/components/public/LocationHoursSection";
import { FeaturedProducts } from "@/components/public/FeaturedProducts";

export const revalidate = 3600;

export default function PaginaInicio() {
  return (
    <>
      <HeroSection />
      <PromosSection />
      <FeaturedProducts />
      <AboutSection />
      <LocationHoursSection />
    </>
  );
}