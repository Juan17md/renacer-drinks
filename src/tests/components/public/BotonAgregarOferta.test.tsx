import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BotonAgregarOferta } from "@/components/public/BotonAgregarOferta";
import { useCartStore } from "@/store/useCartStore";

describe("BotonAgregarOferta", () => {
  beforeEach(() => {
    useCartStore.getState().vaciarCarrito();
  });

  it("agrega la oferta como item especial con su precio promocional", () => {
    render(
      <BotonAgregarOferta
        promoId="happy_hours"
        oferta={{ nombre: "2 Merengadas", precio: "$4.50" }}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar 2 merengadas al pedido/i })
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].producto.name).toBe("2 Merengadas");
    expect(items[0].producto.price).toBe(4.5);
    expect(items[0].producto.category).toBe("Promociones");
    expect(items[0].cantidad).toBe(1);
  });

  it("genera un id estable basado en la promo y el nombre", () => {
    render(
      <BotonAgregarOferta
        promoId="happy_hours"
        oferta={{ nombre: "2 Merengadas", precio: "$4.50" }}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar 2 merengadas al pedido/i })
    );

    expect(useCartStore.getState().items[0].producto.id).toBe(
      "promo-happy_hours-2-merengadas"
    );
  });

  it("acumula la cantidad al agregar la misma oferta varias veces", () => {
    render(
      <BotonAgregarOferta
        promoId="happy_hours"
        oferta={{ nombre: "2 Merengadas", precio: "$4.50" }}
      />
    );
    const boton = screen.getByRole("button", {
      name: /agregar 2 merengadas al pedido/i,
    });

    fireEvent.click(boton);
    fireEvent.click(boton);

    expect(useCartStore.getState().items[0].cantidad).toBe(2);
  });

  it("muestra el feedback Agregado tras el clic", () => {
    render(
      <BotonAgregarOferta
        promoId="happy_hours"
        oferta={{ nombre: "2 Merengadas", precio: "$4.50" }}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar 2 merengadas al pedido/i })
    );

    expect(
      screen.getByRole("button", {
        name: /2 merengadas agregado al pedido/i,
      })
    ).toBeInTheDocument();
  });
});