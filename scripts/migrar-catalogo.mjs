/**
 * Migración del catálogo actual (menu.json del sitio GitHub Pages)
 * hacia Firestore usando Admin SDK (ignora reglas de seguridad).
 * Crea las categorías y los productos de Renacer.
 *
 * Uso:
 *   node scripts/migrar-catalogo.mjs [--prod]
 *
 * Por defecto escribe en el proyecto DEV (renacer-drinks-dev).
 * Con --prod escribe en renacer-drinks (¡usar con precaución!).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const usarProd = process.argv.includes("--prod");

function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
  const proyecto = usarProd ? "PROD (renacer-drinks)" : "DEV (renacer-drinks-dev)";
  console.log(`\n🚀 Migrando catálogo a Firestore → ${proyecto}\n`);

  const rutaCredenciales = usarProd
    ? "secrets/renacer-drinks-service-account.json"
    : "secrets/renacer-drinks-dev-service-account.json";
  const credenciales = JSON.parse(readFileSync(join(__dirname, "..", rutaCredenciales), "utf-8"));

  const app = initializeApp(
    {
      credential: cert(credenciales),
      projectId: usarProd ? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD : env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    `migracion-${usarProd ? "prod" : "dev"}`
  );
  const db = getFirestore(app);

  const menu = JSON.parse(
    readFileSync(join(__dirname, "..", "scripts", "menu.json"), "utf-8")
  );

  const lote = db.batch();

  let totalProductos = 0;
  let omitidos = 0;

  for (const [indice, categoria] of menu.categorias.entries()) {
    const slug = generarSlug(categoria.nombre);
    const idCategoria = `cat_${slug}`;

    lote.set(
      db.doc(`categories/${idCategoria}`),
      {
        name: categoria.nombre,
        slug,
      },
      { merge: true }
    );
    console.log(`  ✅ Categoría: ${categoria.nombre} (${slug})`);

    for (const producto of categoria.productos) {
      const existente = await db
        .collection("products")
        .where("name", "==", producto.nombre)
        .limit(1)
        .get();

      if (!existente.empty) {
        omitidos += 1;
        console.log(`  ⏭️  Omitido (ya existe): ${producto.nombre}`);
        continue;
      }

      totalProductos += 1;
      lote.set(
        db.collection("products").doc(),
        {
          name: producto.nombre,
          description: producto.descripcion ?? "",
          price: Number(producto.precio),
          category: slug,
          isAvailable: true,
          imageUrl: "",
          imageId: "",
        },
        { merge: true }
      );
    }
  }

  await lote.commit();
  await deleteApp(app);

  console.log(`\n✅ Migración completada: ${menu.categorias.length} categorías y ${totalProductos} productos creados (${omitidos} omitidos por ya existir).`);
}

main().catch((error) => {
  console.error("\n❌ Error durante la migración:", error);
  process.exit(1);
});
