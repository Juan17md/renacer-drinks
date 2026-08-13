import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/public/Navbar";

vi.mock("@/store/useCartStore", () => ({
  useCartStore: (selector: (estado: { items: unknown[] }) => unknown) =>
    selector({ items: [] }),
}));

vi.mock("@/components/cart/CartDrawer", () => ({
  CartDrawer: () => null,
}));

describe("Navbar", () => {
  it("ofrece el acceso al panel administrativo en escritorio", () => {
    render(<Navbar tasaBCV={50} />);

    expect(
      screen.getByRole("link", { name: "Panel" })
    ).toHaveAttribute("href", "/admin/login");
  });

  it("muestra la navegación principal", () => {
    render(<Navbar tasaBCV={50} />);

    expect(
      screen.getByRole("link", { name: "Menú" })
    ).toHaveAttribute("href", "/catalogo");
    expect(
      screen.getByRole("link", { name: "Ubicación" })
    ).toHaveAttribute("href", "/#ubicacion");
  });

  it("incluye el acceso al panel en el menú móvil", () => {
    render(<Navbar tasaBCV={50} />);

    fireEvent.click(
      screen.getByRole("button", { name: /abrir menú/i })
    );

    expect(
      screen.getByRole("link", { name: /panel admin/i })
    ).toHaveAttribute("href", "/admin/login");
  });
});