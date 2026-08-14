/**
 * Siembra los métodos de pago por defecto en la colección `metodos_pago`
 * usando Admin SDK (ignora reglas de seguridad).
 *
 * Uso:
 *   node scripts/sembrar-metodos-pago.mjs [--prod]
 *
 * Por defecto escribe en el proyecto DEV (renacer-drinks-dev).
 * Con --prod escribe en renacer-drinks (¡usar con precaución!).
 *
 * NOTA: los datos sembrados son de PRUEBA. El negocio debe corregirlos
 * desde el panel (Panel → Pagos) antes de lanzar a producción.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const usarProd = process.argv.includes("--prod");

const METODOS_POR_DEFECTO = [
  {
    id: "PAGO_MOVIL",
    label: "Pago Móvil",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Banco", valor: "Banesco" },
      { etiqueta: "Teléfono", valor: "0414-1234567" },
      { etiqueta: "Cédula/RIF", valor: "V-12.345.678" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "ZELLE",
    label: "Zelle",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Correo", valor: "pagos@renacer.com" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "TRANSFERENCIA",
    label: "Transferencia",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Banco", valor: "Banesco" },
      { etiqueta: "Cuenta", valor: "0134-0000-00-0000000000" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "BINANCE",
    label: "Binance",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Pay ID", valor: "123456789" },
      { etiqueta: "Beneficiario", valor: "Renacer" },
    ],
  },
  {
    id: "PUNTO",
    label: "Punto",
    activo: true,
    requiereComprobante: false,
    datos: [],
  },
  {
    id: "EFECTIVO",
    label: "Efectivo",
    activo: true,
    requiereComprobante: false,
    datos: [],
  },
];

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

async function sembrarMetodos(env) {
  const rutaCredenciales = usarProd
    ? "secrets/renacer-drinks-service-account.json"
    : "secrets/renacer-drinks-dev-service-account.json";
  const credenciales = JSON.parse(
    readFileSync(join(__dirname, "..", rutaCredenciales), "utf-8")
  );

  const app = initializeApp(
    {
      credential: cert(credenciales),
      projectId: usarProd
        ? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD
        : env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    `sembrar-metodos-${usarProd ? "prod" : "dev"}`
  );
  const db = getFirestore(app);

  try {
    const batch = db.batch();
    for (const metodo of METODOS_POR_DEFECTO) {
      batch.set(db.collection("metodos_pago").doc(metodo.id), {
        label: metodo.label,
        activo: metodo.activo,
        requiereComprobante: metodo.requiereComprobante,
        datos: metodo.datos,
      });
    }
    await batch.commit();
    console.log(`✅ ${METODOS_POR_DEFECTO.length} métodos de pago sembrados`);
  } catch (error) {
    console.error("❌ Error al sembrar métodos de pago:", error);
    process.exitCode = 1;
  } finally {
    await deleteApp(app);
  }
}

const env = cargarVariablesEnv();
const proyecto = usarProd ? "PROD (renacer-drinks)" : "DEV (renacer-drinks-dev)";
console.log(`\n🚀 Sembrando métodos de pago → ${proyecto}\n`);
await sembrarMetodos(env);
console.log("✅ Proceso finalizado");