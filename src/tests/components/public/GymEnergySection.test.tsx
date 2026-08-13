import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GymEnergySection } from "@/components/public/GymEnergySection";

describe("GymEnergySection", () => {
  it("muestra el mensaje de estar dentro del gimnasio", () => {
    render(<GymEnergySection />);

    expect(screen.getByText(/Dentro de Zona Gym/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Energía para tu entrenamiento/i })
    ).toBeInTheDocument();
  });

  it("promociona los batidos con proteína, energizantes y suplementos", () => {
    render(<GymEnergySection />);

    expect(screen.getByText("Batidos con proteína")).toBeInTheDocument();
    expect(screen.getByText("Energía para tu rutina")).toBeInTheDocument();
    expect(screen.getByText("Suplementos")).toBeInTheDocument();
    expect(
      screen.getByText(/whey en batidos cremosos/i)
    ).toBeInTheDocument();
  });
});