/**
 * Creación del usuario administrador inicial del panel de Renacer
 * usando Admin SDK (ignora reglas de seguridad).
 * Crea la cuenta en Firebase Auth y su documento en la colección
 * `usuarios` con rol "admin".
 *
 * Uso:
 *   node scripts/crear-admin.mjs [--prod]
 *
 * Por defecto escribe en el proyecto DEV (renacer-drinks-dev).
 * Con --prod escribe en renacer-drinks (¡usar con precaución!).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const usarProd = process.argv.includes("--prod");

const EMAIL_ADMIN = "juan9182morales@gmail.com";
const PASSWORD_ADMIN = "Jamd-1707";
const NOMBRE_ADMIN = "Juan Morales";

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

async function crearAdmin(env) {
  const rutaCredenciales = usarProd
    ? "secrets/renacer-drinks-service-account.json"
    : "secrets/renacer-drinks-dev-service-account.json";
  const credenciales = JSON.parse(readFileSync(join(__dirname, "..", rutaCredenciales), "utf-8"));

  const app = initializeApp(
    {
      credential: cert(credenciales),
      projectId: usarProd ? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD : env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    `admin-${usarProd ? "prod" : "dev"}`
  );
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    const usuarioExistente = await auth.getUserByEmail(EMAIL_ADMIN).catch(() => null);
    let uid;

    if (usuarioExistente) {
      uid = usuarioExistente.uid;
      console.log(`⚡ El usuario ${EMAIL_ADMIN} ya existe en Auth (uid: ${uid}). Se actualizará su rol.`);
    } else {
      const usuarioCreado = await auth.createUser({
        email: EMAIL_ADMIN,
        password: PASSWORD_ADMIN,
        displayName: NOMBRE_ADMIN,
      });
      uid = usuarioCreado.uid;
      console.log(`✅ Usuario creado en Auth (uid: ${uid})`);
    }

    const referencia = db.collection("usuarios").doc(uid);
    const documento = await referencia.get();
    if (documento.exists) {
      await referencia.update({
        nombre: NOMBRE_ADMIN,
        rol: "admin",
        bloqueado: false,
      });
      console.log("♻️  Documento actualizado con rol admin");
    } else {
      await referencia.set({
        email: EMAIL_ADMIN,
        nombre: NOMBRE_ADMIN,
        rol: "admin",
        bloqueado: false,
        creadoEn: new Date().toISOString(),
      });
      console.log("✅ Documento creado en colección usuarios");
    }
  } catch (error) {
    console.error("❌ Error al crear el administrador:", error);
    process.exitCode = 1;
  } finally {
    await deleteApp(app);
  }
}

const env = cargarVariablesEnv();
const proyecto = usarProd ? "PROD (renacer-drinks)" : "DEV (renacer-drinks-dev)";
console.log(`\n🚀 Creando administrador ${EMAIL_ADMIN} → ${proyecto}\n`);
await crearAdmin(env);
console.log("✅ Proceso finalizado");