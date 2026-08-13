import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const enVercelProduccion = process.env.VERCEL_ENV === "production";
const enVercelPreview = process.env.VERCEL_ENV === "preview";
const enLocalProduccion = !process.env.VERCEL_ENV && process.env.NODE_ENV === "production";
const AMBIENTE_PRODUCCION = enVercelProduccion || enLocalProduccion;

function cargarCredenciales() {
  if (enVercelPreview) {
    // En Vercel preview (rama dev): Firebase DEV vía Service Account base64
    const jsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_DEV;
    if (!jsonBase64) {
      throw new Error(
        "Falta FIREBASE_SERVICE_ACCOUNT_DEV (JSON base64 del Service Account) en el entorno de preview"
      );
    }
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      credenciales: JSON.parse(
        Buffer.from(jsonBase64, "base64").toString("utf8")
      ),
    };
  }

  if (AMBIENTE_PRODUCCION) {
    const jsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_PROD;
    if (!jsonBase64) {
      throw new Error(
        "Falta FIREBASE_SERVICE_ACCOUNT_PROD (JSON base64 del Service Account) en el entorno de producción"
      );
    }
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD,
      credenciales: JSON.parse(
        Buffer.from(jsonBase64, "base64").toString("utf8")
      ),
    };
  }

  const rutaLocal = process.env.FIREBASE_SERVICE_ACCOUNT_PATH_DEV;
  if (rutaLocal) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const credenciales = require(rutaLocal);
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      credenciales,
    };
  }

  throw new Error(
    "Falta FIREBASE_SERVICE_ACCOUNT_PATH_DEV con la ruta del Service Account DEV"
  );
}

let appAdmin: App | null = null;

function obtenerAppAdmin(): App {
  if (appAdmin) return appAdmin;

  if (getApps().length > 0) {
    appAdmin = getApps()[0];
    return appAdmin;
  }

  const { projectId, credenciales } = cargarCredenciales();

  appAdmin = initializeApp(
    {
      credential: cert(credenciales),
      projectId,
    },
    `renacer-admin-${enVercelPreview ? "preview" : AMBIENTE_PRODUCCION ? "prod" : "dev"}`
  );

  return appAdmin;
}

export function getAdminFirestore() {
  return getFirestore(obtenerAppAdmin());
}
