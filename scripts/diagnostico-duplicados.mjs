/**
 * Diagnóstico de datos duplicados en Firestore (solo lectura).
 * Cuenta documentos por colección y detecta duplicados por campos clave.
 *
 * Uso:
 *   node scripts/diagnostico-duplicados.mjs [--prod]
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

function detectarDuplicados(docs, campoClave) {
  const porClave = new Map();
  for (const doc of docs) {
    const clave = String(doc[campoClave] ?? "").toLowerCase().trim();
    if (!clave) continue;
    if (!porClave.has(clave)) porClave.set(clave, []);
    porClave.get(clave).push({ id: doc.id, ...doc });
  }
  const duplicados = [...porClave.entries()].filter(([, lista]) => lista.length > 1);
  return duplicados;
}

async function main() {
  const env = cargarVariablesEnv();
  const rutaCredenciales = usarProd
    ? "secrets/renacer-drinks-service-account.json"
    : "secrets/renacer-drinks-dev-service-account.json";
  const credenciales = JSON.parse(readFileSync(join(__dirname, "..", rutaCredenciales), "utf-8"));

  const app = initializeApp(
    {
      credential: cert(credenciales),
      projectId: usarProd ? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD : env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    `diag-${usarProd ? "prod" : "dev"}`
  );
  const db = getFirestore(app);

  const colecciones = ["products", "categories", "usuarios", "ordenes", "financial_transactions", "daily_summaries"];

  for (const nombre of colecciones) {
    const snapshot = await db.collection(nombre).limit(5000).get();
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`\n=== ${nombre}: ${docs.length} documentos ===`);

    let campoClave = null;
    if (nombre === "products") campoClave = "name";
    if (nombre === "categories") campoClave = "name";
    if (nombre === "usuarios") campoClave = "email";
    if (nombre === "financial_transactions") campoClave = "concept";

    if (!campoClave) continue;

    const duplicados = detectarDuplicados(docs, campoClave);
    if (duplicados.length === 0) {
      console.log("  Sin duplicados por", campoClave);
    } else {
      for (const [clave, lista] of duplicados) {
        console.log(`  ⚠ DUPLICADO "${clave}" (${lista.length} docs):`);
        for (const d of lista) {
          console.log(`    - id: ${d.id} | name: ${d.name} | category: ${d.category} | price: ${d.price} | updatedAt: ${d.updatedAt ?? "-"}`);
        }
      }
    }
  }

  // Duplicados exactos por TODOS los campos (migraciones dobles)
  const snapshotProducts = await db.collection("products").limit(5000).get();
  const docsProducts = snapshotProducts.docs.map((d) => ({ id: d.id, ...d.data() }));
  const porNombre = new Map();
  for (const doc of docsProducts) {
    const nombre = String(doc.name ?? "").toLowerCase().trim();
    if (!porNombre.has(nombre)) porNombre.set(nombre, []);
    porNombre.get(nombre).push(doc);
  }
  let copiasExactas = 0;
  for (const [, lista] of porNombre) {
    if (lista.length < 2) continue;
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        const sonIguales =
          a.price === b.price &&
          a.category === b.category &&
          a.isAvailable === b.isAvailable &&
          a.imageUrl === b.imageUrl;
        if (sonIguales) {
          copiasExactas++;
          console.log(`  🔴 Copia exacta: "${a.name}" (${a.id} == ${b.id})`);
        }
      }
    }
  }
  if (copiasExactas === 0) console.log("\nSin copias exactas de productos.");

  await deleteApp(app);
  console.log("\n✅ Diagnóstico finalizado");
}

main().catch((error) => {
  console.error("❌ Error en el diagnóstico:", error);
  process.exitCode = 1;
});