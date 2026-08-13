import { HeroSection } from "@/components/public/HeroSection";
import { PromosSection } from "@/components/public/PromosSection";
import { FeaturedProducts } from "@/components/public/FeaturedProducts";
import { GymEnergySection } from "@/components/public/GymEnergySection";
import { AboutSection } from "@/components/public/AboutSection";
import { LocationHoursSection } from "@/components/public/LocationHoursSection";

export const revalidate = 3600;

export default function PaginaInicio() {
  return (
    <>
      <HeroSection />
      <PromosSection />
      <FeaturedProducts />
      <GymEnergySection />
      <AboutSection />
      <LocationHoursSection />
    </>
  );
}