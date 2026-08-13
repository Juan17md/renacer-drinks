/**
 * Asigna el costo a los productos del catálogo que no lo tengan:
 * costo = precio de venta - 1 USD (ganancia de 1 USD por unidad).
 * Si el precio es menor o igual a 1 USD, el costo queda en 0.
 * Idempotente: los productos que ya tienen costo se omiten.
 *
 * Uso:
 *   node scripts/migrar-costos.mjs [--prod]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const usarProd = process.argv.includes("--prod");

function cargarVariablesEnv() {
  const archivo = join(__dirname, "..", ".env.local");
  const contenido = readFileSync(archivo, "utf-8");
  const variables = {};
  for (const linea of contenido.split("\n")) {
    const coincidencia = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (coincidencia) {
      variables[coincidencia[1]] = coincidencia[2].replace(/^"|"$/g, "");
    }
  }
  return variables;
}

async function main() {
  const env = cargarVariablesEnv();
  const rutaCredenciales = usarProd
    ? "secrets/renacer-drinks-service-account.json"
    : "secrets/renacer-drinks-dev-service-account.json";
  const credenciales = JSON.parse(
    readFileSync(join(__dirname, "..", rutaCredenciales), "utf-8")
  );

  const app = initializeApp({
    credential: cert(credenciales),
    projectId: usarProd
      ? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD
      : env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  const db = getFirestore(app);

  const snapshot = await db.collection("products").get();
  let actualizados = 0;
  let omitidos = 0;

  for (const documento of snapshot.docs) {
    const datos = documento.data();
    if (datos.costo !== undefined && datos.costo !== null) {
      omitidos += 1;
      continue;
    }
    const precioVenta = Number(datos.price ?? 0);
    const costo = Math.max(precioVenta - 1, 0);
    await documento.ref.update({ costo });
    console.log(
      `✓ ${datos.name}: venta $${precioVenta.toFixed(2)} → costo $${costo.toFixed(2)}`
    );
    actualizados += 1;
  }

  console.log(
    `\nResumen: ${actualizados} producto(s) actualizados, ${omitidos} omitido(s) (ya tenían costo).`
  );
  await deleteApp(app);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
