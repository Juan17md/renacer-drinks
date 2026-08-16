import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/public/Footer";

describe("Footer", () => {
  it("enlaza la dirección al enlace oficial de Google Maps", () => {
    render(<Footer />);

    const enlace = screen.getByRole("link", {
      name: /Dentro de Zona Gym/i,
    });
    expect(enlace).toHaveAttribute(
      "href",
      "https://maps.app.goo.gl/3Bi6iZRkv2ej18he9"
    );
    expect(enlace).toHaveAttribute("target", "_blank");
  });

  it("ofrece el acceso al panel administrativo", () => {
    render(<Footer />);

    const enlace = screen.getByRole("link", { name: /panel admin/i });
    expect(enlace).toHaveAttribute("href", "/admin/login");
  });

  it("muestra el crédito del desarrollador enlazado a WhatsApp", () => {
    render(<Footer />);

    const enlace = screen.getByRole("link", { name: /Developed by: Juan17md/i });
    expect(enlace).toHaveAttribute(
      "href",
      "https://wa.me/584245323388?text=Hola%20Juan%2C%20vi%20tu%20trabajo%20en%20la%20web%20de%20Renacer%20Drinks%20%26%20Coffe%20y%20me%20gustar%C3%ADa%20hablar%20contigo."
    );
    expect(enlace).toHaveAttribute("target", "_blank");
  });
});