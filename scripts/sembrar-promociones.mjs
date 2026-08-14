#!/usr/bin/env node
/**
 * Siembra las promociones de la landing en Firestore.
 * Uso:
 *   node scripts/sembrar-promociones.mjs          -> DEV (renacer-drinks-dev)
 *   node scripts/sembrar-promociones.mjs --prod   -> PROD (renacer-drinks)
 *
 * Idempotente: sobrescribe el documento con el mismo id fijo.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const esProd = process.argv.includes("--prod");
const projectId = esProd ? "renacer-drinks" : "renacer-drinks-dev";
const serviceAccountPath = join(
  __dirname,
  "..",
  "secrets",
  esProd
    ? "renacer-drinks-service-account.json"
    : "renacer-drinks-dev-service-account.json"
);

if (!existsSync(serviceAccountPath)) {
  console.error(`❌ No existe el service account: ${serviceAccountPath}`);
  process.exit(1);
}

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync(serviceAccountPath, "utf8"))),
  projectId,
});

const PROMOCIONES = [
  {
    id: "happy_hours",
    titulo: "Happy Hours",
    horario: "Lunes a Sábado de 8AM a 12PM",
    descripcion: "Dos por el precio de uno en tus favoritas.",
    ofertas: [
      { nombre: "2 Merengadas", precio: "$4.50" },
      { nombre: "2 Especiales", precio: "$5.60" },
    ],
    activo: true,
  },
  {
    id: "tarde_de_poder",
    titulo: "Tarde de Poder",
    horario: "Por tiempo limitado",
    descripcion: "Añade extra de proteína a tu batido por $0.50.",
    ofertas: [],
    activo: true,
  },
];

const db = getFirestore();

for (const promocion of PROMOCIONES) {
  const { id, ...datos } = promocion;
  await db.doc(`promociones/${id}`).set(
    {
      ...datos,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`✅ Promoción "${datos.titulo}" (${id}) sembrada`);
}

console.log(`🚀 Promociones sembradas → ${projectId}`);
await deleteApp(app);
