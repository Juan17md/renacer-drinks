import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PromosSection } from "@/components/public/PromosSection";

describe("PromosSection", () => {
  it("renderiza las dos promociones vigentes", () => {
    render(<PromosSection />);

    expect(screen.getByRole("heading", { name: "Happy Hours" })).toBeInTheDocument();
    expect(
      screen.getByText(/lunes a sábado de 8am a 12pm/i)
    ).toBeInTheDocument();
    expect(screen.getByText("2 Merengadas")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(screen.getByText("2 Especiales")).toBeInTheDocument();
    expect(screen.getByText("$5.60")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Tarde de Poder" })
    ).toBeInTheDocument();
    expect(screen.getByText(/proteína gratis en todos los batidos/i)).toBeInTheDocument();
    expect(screen.getByText(/extra de proteína a tu batido por/i)).toBeInTheDocument();
  });

  it("muestra el indicador de tiempo limitado", () => {
    render(<PromosSection />);
    expect(screen.getByText(/solo por tiempo limitado/i)).toBeInTheDocument();
  });
});
