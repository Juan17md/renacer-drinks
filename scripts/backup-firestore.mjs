#!/usr/bin/env node

/**
 * Backup diario de Firestore (Renacer Drinks & Coffe - DEV y PROD)
 *
 * - Exporta todas las colecciones (incluidas subcolecciones) de ambos proyectos
 * - Comprime en backups/renacer-<env>-firestore-<fecha>.json.gz
 * - Sube a Google Drive con rclone (remoto "gdrive", carpeta "Renacer-Backups")
 * - Conserva los últimos MAX_LOCAL_BACKUPS locales y los últimos
 *   MAX_REMOTE_BACKUPS en Drive, por cada entorno
 *
 * Uso:
 *   node scripts/backup-firestore.mjs
 *   node scripts/backup-firestore.mjs --sin-subida
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { execFileSync } from "child_process"
import zlib from "zlib"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROYECTO_DIR = join(__dirname, "..")
const CARPETA_BACKUPS = join(PROYECTO_DIR, "backups")
const CARPETA_DRIVE = "Renacer-Backups"
const REMOTO_RCLONE = "gdrive"
const MAX_LOCAL_BACKUPS = 7
const MAX_REMOTE_BACKUPS = 7
const SIN_SUBIDA = process.argv.includes("--sin-subida")

const ENTORNOS = [
  {
    nombre: "dev",
    proyecto: "renacer-drinks-dev",
    credencial: join(PROYECTO_DIR, "secrets", "renacer-drinks-dev-service-account.json"),
  },
  {
    nombre: "prod",
    proyecto: "renacer-drinks",
    credencial: join(PROYECTO_DIR, "secrets", "renacer-drinks-service-account.json"),
  },
]

const BIN_RCLONE = process.env.RCLONE_BIN || "/home/juan/.local/bin/rclone"

function log(mensaje, nivel = "info") {
  const prefijos = { info: "[INFO]", ok: "[OK]", warn: "[WARN]", error: "[ERROR]" }
  const linea = `${new Date().toISOString()} ${prefijos[nivel] || ""} ${mensaje}`
  console.log(linea)
}

function fechahora() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
}

function serializar(valor) {
  if (valor && typeof valor === "object") {
    if (typeof valor.toDate === "function") return { __tipo: "fecha", valor: valor.toDate().toISOString() }
    if (Array.isArray(valor)) return valor.map(serializar)
    const obj = {}
    for (const [clave, val] of Object.entries(valor)) obj[clave] = serializar(val)
    return obj
  }
  return valor
}

async function exportarColeccionRecursiva(db, coleccion, resultado) {
  const snapshot = await coleccion.get()
  for (const doc of snapshot.docs) {
    const rutaCompleta = doc.ref.path
    resultado[rutaCompleta] = {
      ...serializar(doc.data()),
      _meta: { id: doc.id, ruta: rutaCompleta },
    }
    const subcolecciones = await doc.ref.listCollections()
    for (const sub of subcolecciones) {
      await exportarColeccionRecursiva(db, sub, resultado)
    }
  }
}

function mantenerUltimos(carpeta, maximo, prefijo) {
  const archivos = readdirSync(carpeta)
    .filter((f) => f.startsWith(prefijo) && f.endsWith(".json.gz"))
    .map((f) => ({ nombre: f, ruta: join(carpeta, f), mtime: statSync(join(carpeta, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  for (const antiguo of archivos.slice(maximo)) {
    unlinkSync(antiguo.ruta)
    log(`Eliminado backup local antiguo: ${antiguo.nombre}`)
  }
}

function listarRemotos(prefijo) {
  try {
    const salida = execFileSync(BIN_RCLONE, ["lsf", `${REMOTO_RCLONE}:${CARPETA_DRIVE}`], { encoding: "utf-8" })
    return salida.split("\n").filter((f) => f.startsWith(prefijo) && f.endsWith(".json.gz")).sort()
  } catch {
    return []
  }
}

function limpiarRemotos(maximo, prefijo) {
  const remotos = listarRemotos(prefijo)
  if (remotos.length <= maximo) return
  for (const antiguo of remotos.slice(0, remotos.length - maximo)) {
    try {
      execFileSync(BIN_RCLONE, ["deletefile", `${REMOTO_RCLONE}:${CARPETA_DRIVE}/${antiguo}`], { stdio: "pipe" })
      log(`Eliminado backup remoto antiguo: ${antiguo}`)
    } catch (e) {
      log(`No se pudo eliminar ${antiguo} en Drive: ${e.message}`, "warn")
    }
  }
}

async function respaldarEntorno(entorno) {
  const admin = await import("firebase-admin")
  const { getFirestore } = await import("firebase-admin/firestore")

  if (!existsSync(entorno.credencial)) {
    throw new Error(`No se encuentra la credencial en ${entorno.credencial}`)
  }

  const serviceAccount = JSON.parse(readFileSync(entorno.credencial, "utf-8"))

  if (!admin.getApps().some((app) => app.name === entorno.nombre)) {
    admin.initializeApp({ credential: admin.cert(serviceAccount) }, entorno.nombre)
  }

  const db = getFirestore(admin.getApp(entorno.nombre))

  const colecciones = await db.listCollections()
  if (colecciones.length === 0) {
    log(`(${entorno.nombre}) No hay colecciones que respaldar`, "warn")
    return
  }

  const resultado = {}
  for (const coleccion of colecciones) {
    await exportarColeccionRecursiva(db, coleccion, resultado)
  }

  const totalDocs = Object.keys(resultado).length
  log(`(${entorno.nombre}) Exportación completa: ${totalDocs} documento(s) exportados (incluyendo subcolecciones)`)

  mkdirSync(CARPETA_BACKUPS, { recursive: true })
  const nombreArchivo = `renacer-${entorno.nombre}-firestore-${fechahora()}.json.gz`
  const rutaArchivo = join(CARPETA_BACKUPS, nombreArchivo)

  const json = JSON.stringify(resultado, null, 2)
  const contenidoGzip = zlib.gzipSync(json)
  writeFileSync(rutaArchivo, contenidoGzip)
  log(`(${entorno.nombre}) Backup local creado: ${rutaArchivo} (${(contenidoGzip.length / 1024 / 1024).toFixed(2)} MB)`)

  mantenerUltimos(CARPETA_BACKUPS, MAX_LOCAL_BACKUPS, `renacer-${entorno.nombre}-firestore-`)
  log(`(${entorno.nombre}) Retención local aplicada: últimos ${MAX_LOCAL_BACKUPS} backups`)

  if (SIN_SUBIDA) {
    log(`(${entorno.nombre}) Modo --sin-subida: no se subirá a Google Drive`)
    return
  }

  log(`(${entorno.nombre}) Subiendo a Google Drive (${REMOTO_RCLONE}:${CARPETA_DRIVE})...`)
  execFileSync(BIN_RCLONE, ["copy", rutaArchivo, `${REMOTO_RCLONE}:${CARPETA_DRIVE}`], { stdio: "inherit" })
  log(`(${entorno.nombre}) Backup subido exitosamente a Google Drive`)

  limpiarRemotos(MAX_REMOTE_BACKUPS, `renacer-${entorno.nombre}-firestore-`)
  log(`(${entorno.nombre}) Retención remota aplicada: últimos ${MAX_REMOTE_BACKUPS} backups`)
}

async function main() {
  log("=== Backup de Firestore (Renacer) ===\n")

  for (const entorno of ENTORNOS) {
    log(`Proyecto: ${entorno.proyecto}`)
    try {
      await respaldarEntorno(entorno)
      log(`(${entorno.nombre}) OK\n`)
    } catch (e) {
      log(`(${entorno.nombre}) Error: ${e.message}`, "error")
      process.exitCode = 1
    }
  }

  log("=== Backup finalizado ===")
}

main()
