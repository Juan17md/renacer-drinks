import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationHoursSection } from "@/components/public/LocationHoursSection";

describe("LocationHoursSection", () => {
  it("renderiza la dirección y los horarios de atención", () => {
    render(<LocationHoursSection />);

    expect(
      screen.getByText(/Dentro de Zona Gym/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/6:00 am – 12:00 pm/i)).toBeInTheDocument();
    expect(screen.getByText(/2:00 pm – 9:00 pm/i)).toBeInTheDocument();
  });

  it("incluye el mapa embebido con las coordenadas de la cafetería", () => {
    render(<LocationHoursSection />);

    const iframe = screen.getByTitle(/Mapa de ubicación/i) as HTMLIFrameElement;
    expect(iframe.src).toContain("10.0876488,-69.3056495");
  });

  it("enlaza el botón Cómo llegar al enlace oficial de Google Maps", () => {
    render(<LocationHoursSection />);

    const enlace = screen.getByRole("link", { name: /Cómo llegar/i });
    expect(enlace).toHaveAttribute(
      "href",
      "https://maps.app.goo.gl/3Bi6iZRkv2ej18he9"
    );
    expect(enlace).toHaveAttribute("target", "_blank");
  });
});