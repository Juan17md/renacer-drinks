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
});