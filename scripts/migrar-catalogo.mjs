/**
 * Migración del catálogo actual (menu.json del sitio GitHub Pages)
 * hacia Firestore. Crea las categorías y los productos de Renacer.
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
import { initializeApp, deleteApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";

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

function obtenerFechaLocalISO(fecha = new Date()) {
  const desplazamiento = fecha.getTimezoneOffset();
  return new Date(fecha.getTime() - desplazamiento * 60000).toISOString();
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

function configuracionFirebase(env) {
  if (usarProd) {
    return {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY_PROD,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID_PROD,
    };
  }
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

async function main() {
  const env = cargarVariablesEnv();
  const config = configuracionFirebase(env);
  const proyecto = usarProd ? "PROD (renacer-drinks)" : "DEV (renacer-drinks-dev)";
  console.log(`\n🚀 Migrando catálogo a Firestore → ${proyecto}\n`);

  const app = initializeApp(config);
  const db = getFirestore(app);

  const menu = JSON.parse(
    readFileSync(join(__dirname, "..", "scripts", "menu.json"), "utf-8")
  );

  const ahora = obtenerFechaLocalISO();
  const lote = writeBatch(db);

  let totalProductos = 0;

  for (const [indice, categoria] of menu.categorias.entries()) {
    const slug = generarSlug(categoria.nombre);
    const idCategoria = `cat_${slug}`;

    lote.set(
      doc(collection(db, "categories"), idCategoria),
      {
        name: categoria.nombre,
        slug,
      },
      { merge: true }
    );
    console.log(`  ✅ Categoría: ${categoria.nombre} (${slug})`);

    for (const producto of categoria.productos) {
      totalProductos += 1;
      lote.set(
        doc(collection(db, "products")),
        {
          name: producto.nombre,
          description: producto.descripcion ?? "",
          price: Number(producto.precio),
          category: slug,
          isAvailable: true,
          imageUrl: "",
          imageId: "",
          updatedAt: ahora,
        },
        { merge: true }
      );
    }
  }

  await lote.commit();
  await deleteApp(app);

  console.log(`\n✅ Migración completada: ${menu.categorias.length} categorías y ${totalProductos} productos.`);
}

main().catch((error) => {
  console.error("\n❌ Error durante la migración:", error);
  process.exit(1);
});
