"use client";

import { useEffect, useRef } from "react";

const COLOR_ROSADO = 0xf5a0aa;
const COLOR_CAFE = 0xc9384a;
const COLOR_CREMA = 0xd4a373;

function obtenerDensidad() {
  if (typeof window === "undefined") return 500;
  const ancho = window.innerWidth;
  const nucleos = navigator.hardwareConcurrency || 4;
  const base = ancho < 640 ? 350 : ancho < 1024 ? 450 : 600;
  return nucleos <= 4 ? Math.floor(base * 0.6) : base;
}

export function FondoAnimado() {
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelar = false;
    let idAnimacion = 0;
    let renderer: unknown;
    let escena: unknown;
    let camara: unknown;
    let particulas: unknown;
    let material: unknown;
    let geometria: unknown;
    let observadorIntersection: IntersectionObserver | null = null;
    let visible = true;
    let ultimoTiempo = 0;

    async function inicializar() {
      try {
        const contenedorActivo = contenedor;
        if (!contenedorActivo) return;
        const { Scene, PerspectiveCamera, WebGLRenderer } = await import(
          "three"
        );
        const { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute } =
          await import("three");

        const lienzo = document.createElement("canvas");
        lienzo.setAttribute("aria-hidden", "true");
        lienzo.className = "h-full w-full";
        contenedorActivo.appendChild(lienzo);

        const escenaNueva = new Scene();
        escenaNueva.background = null;
        const camaraNueva = new PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          0.1,
          100
        );
        camaraNueva.position.z = 12;

        const rendererNuevo = new WebGLRenderer({
          canvas: lienzo,
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
        });
        rendererNuevo.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        rendererNuevo.setSize(window.innerWidth, window.innerHeight);

        const cantidad = obtenerDensidad();
        const posiciones = new Float32Array(cantidad * 3);
        const velocidades: number[] = [];

        for (let i = 0; i < cantidad; i++) {
          posiciones[i * 3] = (Math.random() - 0.5) * 24;
          posiciones[i * 3 + 1] = (Math.random() - 0.5) * 16;
          posiciones[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
          velocidades.push(
            0.001 + Math.random() * 0.0025,
            0.001 + Math.random() * 0.0025,
            0.0005 + Math.random() * 0.001
          );
        }

        const geometriaNueva = new BufferGeometry();
        geometriaNueva.setAttribute(
          "position",
          new Float32BufferAttribute(posiciones, 3)
        );

        const materialNuevo = new PointsMaterial({
          color: COLOR_ROSADO,
          size: 0.09,
          transparent: true,
          opacity: 0.55,
          blending: 2,
          depthWrite: false,
          sizeAttenuation: true,
        });

        const particulasNuevas = new Points(geometriaNueva, materialNuevo);
        escenaNueva.add(particulasNuevas);

        escena = escenaNueva;
        camara = camaraNueva;
        renderer = rendererNuevo;
        particulas = particulasNuevas;
        material = materialNuevo;
        geometria = geometriaNueva;

        function animar(tiempo: number) {
          if (cancelar) return;
          const delta = Math.min((tiempo - ultimoTiempo) / 1000, 0.05);
          ultimoTiempo = tiempo;

          if (visible && rendererNuevo && particulasNuevas) {
            const pos = (
              particulasNuevas.geometry.getAttribute("position") as {
                array: Float32Array;
                needsUpdate: boolean;
              }
            );
            for (let i = 0; i < cantidad; i++) {
              pos.array[i * 3] += velocidades[i * 3] * delta * 10;
              pos.array[i * 3 + 1] += velocidades[i * 3 + 1] * delta * 10;
              pos.array[i * 3 + 2] += velocidades[i * 3 + 2] * delta * 10;

              if (pos.array[i * 3] > 12) pos.array[i * 3] = -12;
              if (pos.array[i * 3 + 1] > 8) pos.array[i * 3 + 1] = -8;
              if (pos.array[i * 3 + 2] > 2) pos.array[i * 3 + 2] = -6;
            }
            pos.needsUpdate = true;

            particulasNuevas.rotation.y += 0.0004 * delta * 60;
            rendererNuevo.render(escenaNueva, camaraNueva);
          }
          idAnimacion = requestAnimationFrame(animar);
        }

        idAnimacion = requestAnimationFrame(animar);

        observadorIntersection = new IntersectionObserver(
          ([entrada]) => {
            visible = entrada.isIntersecting;
          },
          { rootMargin: "200px" }
        );
        observadorIntersection.observe(contenedor);
      } catch {
        // Sin soporte WebGL o error de carga: la landing queda sin fondo animado.
      }
    }

    function manejarVisibilidad() {
      visible = document.visibilityState === "visible";
    }
    function manejarResize() {
      const r = renderer as { setSize?: (w: number, h: number) => void } | null;
      const c = camara as { aspect?: number; updateProjectionMatrix?: () => void } | null;
      if (r?.setSize && c?.updateProjectionMatrix) {
        c.aspect = window.innerWidth / window.innerHeight;
        c.updateProjectionMatrix();
        r.setSize(window.innerWidth, window.innerHeight);
      }
    }

    document.addEventListener("visibilitychange", manejarVisibilidad);
    window.addEventListener("resize", manejarResize);

    inicializar();

    return () => {
      cancelar = true;
      cancelAnimationFrame(idAnimacion);
      document.removeEventListener("visibilitychange", manejarVisibilidad);
      window.removeEventListener("resize", manejarResize);
      observadorIntersection?.disconnect();
      const r = renderer as { dispose?: () => void } | null;
      r?.dispose?.();
      const m = material as { dispose?: () => void } | null;
      m?.dispose?.();
      const g = geometria as { dispose?: () => void } | null;
      g?.dispose?.();
      const lienzo = contenedor.querySelector("canvas");
      lienzo?.remove();
    };
  }, []);

  return <div ref={contenedorRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />;
}