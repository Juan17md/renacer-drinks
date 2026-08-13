/**
 * Limpieza de productos duplicados en Firestore.
 *
 * Agrupa productos por nombre (insensible a mayúsculas) y, cuando hay
 * más de una copia, conserva la de `updatedAt` más reciente (o la primera
 * si ninguna tiene) y elimina el resto.
 *
 * Uso:
 *   node scripts/limpiar-duplicados.mjs [--prod]
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

function mejorCopia(lista) {
  return lista.reduce((mejor, actual) => {
    const tActual = actual.updatedAt?.toDate?.() ?? null;
    const tMejor = mejor.updatedAt?.toDate?.() ?? null;
    if (!tActual) return mejor;
    if (!tMejor) return actual;
    return tActual > tMejor ? actual : mejor;
  }, lista[0]);
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
    `limpieza-${usarProd ? "prod" : "dev"}`
  );
  const db = getFirestore(app);

  const snapshot = await db.collection("products").get();
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const porNombre = new Map();
  for (const doc of docs) {
    const nombre = String(doc.name ?? "").toLowerCase().trim();
    if (!nombre) continue;
    if (!porNombre.has(nombre)) porNombre.set(nombre, []);
    porNombre.get(nombre).push(doc);
  }

  const aEliminar = [];
  let gruposDuplicados = 0;
  let conservados = 0;

  for (const [, lista] of porNombre) {
    if (lista.length < 2) {
      conservados += lista.length;
      continue;
    }
    gruposDuplicados += 1;
    const mejor = mejorCopia(lista);
    conservados += 1;
    for (const doc of lista) {
      if (doc.id !== mejor.id) aEliminar.push(doc.id);
    }
  }

  console.log(`Total de productos en la base: ${docs.length}`);
  console.log(`Grupos con duplicados: ${gruposDuplicados}`);
  console.log(`A eliminar: ${aEliminar.length} | A conservar: ${conservados}`);

  if (aEliminar.length === 0) {
    console.log("✅ No hay duplicados que eliminar.");
  } else {
    const lote = db.batch();
    for (const id of aEliminar) {
      lote.delete(db.doc(`products/${id}`));
    }
    await lote.commit();
    console.log(`✅ Eliminados ${aEliminar.length} productos duplicados.`);
  }

  await deleteApp(app);
}

main().catch((error) => {
  console.error("❌ Error durante la limpieza:", error);
  process.exitCode = 1;
});