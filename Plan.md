# PROMPT DE ARQUITECTURA E IMPLEMENTACIÓN: E-COMMERCE & ADMIN PARA CAFETERÍA "RENACER DRINKS & COFFE"

## CONTEXTO Y PROPÓSITO DEL PROYECTO

Eres un desarrollador Full-Stack Senior especializado en Next.js, Firebase y arquitecturas web modernas. Tu objetivo es construir un sistema de E-Commerce ligero para la cafetería **Renacer Drinks & Coffe**.

El sistema consta de dos áreas principales construidas bajo una estrategia **Mobile-First** (optimizadas y 100% responsivas para dispositivos móviles **Android** e **iOS**, así como para computadoras de escritorio):

1. **Área Pública**: Landing page interactiva para **Renacer Drinks & Coffe**, catálogo de productos con filtros por categoría y un carrito de compras táctil e interactivo.
2. **Panel Administrativo (Admin)**: Módulo protegido para la gestión de inventario/menú (CRUD de productos) y un módulo financiero básico (control de ingresos, egresos y reportes de ventas).

---

## IDENTIDAD VISUAL Y ASSETS DE MARCA

- **Nombre Oficial de la Marca**: Renacer Drinks & Coffe
- **Assets Disponibles (Ya integrados en la raíz del proyecto)**:
  - [logo.png](file:///home/juan/Documentos/Programacion/Trabajos/Renacer/logo.png): Logo oficial con fondo.
  - [logo_sin_fondo.png](file:///home/juan/Documentos/Programacion/Trabajos/Renacer/logo_sin_fondo.png): Logo oficial con transparencia.
- **Paleta de Colores y Diseño**:
  - Se deben extraer los colores corporativos directamente desde los logos (`logo.png` y `logo_sin_fondo.png`) para definir el sistema de diseño y la paleta principal en Tailwind CSS y Shadcn/ui.
  - Todos los componentes y vistas deben mantener coherencia visual con la identidad de marca de **Renacer Drinks & Coffe**.

---

## REPOSITORIO DE CÓDIGO Y ESTRUCTURA GIT

- **Repositorio Remoto (GitHub)**: `git@github.com:Juan17md/renacer-drinks.git`
- **Flujo de Ramas**:
  - `dev`: Rama de desarrollo principal. Toda modificación, prueba y desarrollo se realiza en `dev`. Cada push genera un Preview Deployment en Vercel (conectado al proyecto Firebase DEV `renacer-drinks-dev`).
  - `main`: Rama de producción. Prohibido hacer push directo. Solo se integra `dev` a `main` tras la aprobación explícita del usuario (despliega a producción con `renacer-drinks`).

---

## ENTORNOS Y CONFIGURACIÓN DE FIREBASE (DEV / PROD)

> [!IMPORTANT]
> Se utilizan dos proyectos de Firebase independientes para mantener separadas las pruebas y el desarrollo del entorno de producción final.

### 🧪 Entorno de Desarrollo (`dev`) - Proyecto: `renacer-drinks-dev`
- **API Key**: `AIzaSyDOeG56o22-g8aiprTpd6zWmLWvGYZK-uo`
- **Auth Domain**: `renacer-drinks-dev.firebaseapp.com`
- **Project ID**: `renacer-drinks-dev`
- **Storage Bucket**: `renacer-drinks-dev.firebasestorage.app`
- **Messaging Sender ID**: `936947947875`
- **App ID**: `1:936947947875:web:150505d50880bd9cea9b56`
- **Measurement ID**: `G-J8LZN9KKDY`

### 🚀 Entorno de Producción (`main`) - Proyecto: `renacer-drinks`
- **API Key**: `AIzaSyCaN4PufADn4n9bL2xPyBQ4-SQZ82NgYMs`
- **Auth Domain**: `renacer-drinks.firebaseapp.com`
- **Project ID**: `renacer-drinks`
- **Storage Bucket**: `renacer-drinks.firebasestorage.app`
- **Messaging Sender ID**: `767380448106`
- **App ID**: `1:767380448106:web:ae19d8c1402d7fd36ffb13`
- **Measurement ID**: `G-HG23E3EW3F`

### 📸 Credenciales de ImageKit.io
- **Public Key**: `public_XgFMbn30/2u2vkOyR3s9gL+gNd8=`
- **Private Key**: `private_o7cKN0DpEpOkdCe4yYKJmnvVI+c=`
- **URL Endpoint**: `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` (Ej. `https://ik.imagekit.io/renacerdrinks`)

### Variables de Entorno en Next.js (`.env.local` / Vercel Env Vars)
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_XgFMbn30/2u2vkOyR3s9gL+gNd8=
IMAGEKIT_PRIVATE_KEY=private_o7cKN0DpEpOkdCe4yYKJmnvVI+c=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_imagekit_id>
```

---

## ESCALA Y LÍMITES OPERATIVOS

- **Público objetivo inicial**: ~50 visitas/día en el catálogo y 3 usuarios en el panel administrativo.
- **Hosting / Despliegue**: Vercel (Plan Hobby / $0).
- **Base de Datos & Auth**: Firebase Firestore + Firebase Auth (Plan Spark / $0).
- **Estrategia de Optimización**: Minimizar lecturas/escrituras a Firestore mediante Incremental Static Regeneration (ISR) o revalidación bajo demanda (On-Demand Revalidation) en Next.js para el catálogo público.

---

## STACK TECNOLÓGICO Y HERRAMIENTAS

- **Framework**: Next.js (App Router, TypeScript).
- **UI & Estilos**: Tailwind CSS + Shadcn/ui (componentes accesibles y estilizados).
- **Estado Global**: Zustand (para la persistencia del carrito en localStorage).
- **Base de Datos**: Firebase Firestore (almacenamiento de productos, categorías y transacciones).
- **Autenticación**: Firebase Auth (email y contraseña para administradores).
- **Almacenamiento de Imágenes**: ImageKit.io (para compresión, optimización CDN y entrega rápida de imágenes del catálogo).
- **Monitoreo de Errores**: Sentry (rastreo de errores y métricas en cliente, servidor y Server Actions).
- **Tablas y Gráficos (Admin)**: TanStack Table (para gestión del inventario) y Recharts (para métricas financieras).
- **Tasa del Dólar BCV**: DolarApi (`https://ve.dolarapi.com/v1/dolares/oficial`) para la conversión en tiempo real de precios y montos de USD a Bolívares (Bs.).

---

## ESTRUCTURA DE LA BASE DE DATOS (FIRESTORE)

1. `products/` (Colección)
   - `id`: string
   - `name`: string
   - `description`: string
   - `price`: number (Precio en USD)
   - `category`: string
   - `isAvailable`: boolean
   - `imageUrl`: string (URL provista por ImageKit)
   - `imageId`: string (ID de archivo en ImageKit para eliminación/edición)
   - `updatedAt`: timestamp

2. `categories/` (Colección)
   - `id`: string
   - `name`: string
   - `slug`: string

3. `financial_transactions/` (Colección)
   - `id`: string
   - `type`: 'INGRESO' | 'EGRESO'
   - `amount`: number (Monto en USD)
   - `amountBs`: number (Monto equivalente en Bs. calculado con tasa BCV)
   - `bcvRate`: number (Tasa BCV del día al momento de la transacción)
   - `concept`: string
   - `paymentMethod`: 'EFECTIVO' | 'PAGO_MOVIL' | 'PUNTO' | 'OTRO'
   - `date`: timestamp
   - `createdBy`: string (Email o UID del admin)

4. `daily_summaries/` (Colección)
   - `id`: string (formato YYYY-MM-DD)
   - `totalIncome`: number
   - `totalExpense`: number
   - `netProfit`: number

---

## INTEGRACIONES CLAVE

### 1. ImageKit (Subida de Imágenes)

- Configura las credenciales de ImageKit en variables de entorno (`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`).
- Crea una Server Action o API Route segura para la autenticación de subidas desde el cliente utilizando el SDK oficial de ImageKit (`imagekit`).
- Implementa la subida de imagen en el formulario del panel admin, guardando `url` e `fileId` en la colección `products`.
- Al eliminar un producto, asegura eliminar la imagen correspondiente en ImageKit usando su `fileId`.

### 2. Sentry (Rastreo de Fallos)

- Configura Sentry utilizando `@sentry/nextjs`.
- Genera el archivo `sentry.client.config.ts`, `sentry.server.config.ts` y `sentry.edge.config.ts`.
- Envuelve las Server Actions y las llamadas críticas de Firebase en bloques `try/catch` reportando excepciones explícitamente con `Sentry.captureException(error)`.

### 3. API Tasa del Dólar BCV (DolarApi)

- **Endpoint**: `https://ve.dolarapi.com/v1/dolares/oficial`
- Implementa un servicio de consulta (`lib/bcv.ts`) con revalidación por tiempo (`fetch(..., { next: { revalidate: 3600 } })`) que extraiga el campo `promedio` (tasa del dólar oficial BCV en Bs.) y `fechaActualizacion`.
- Incluye un mecanismo de fallback resiliente por si la API externa experimenta fallos de conectividad temporal.
- Utiliza la tasa obtenida para calcular y desplegar dinámicamente los precios en Bolívares (Bs.) en el catálogo público, el carrito de compras, la liquidación enviada a WhatsApp y las conversiones financieras del panel administrativo.

---

## PASOS DETALLADOS A REALIZAR

### Paso 1: Configuración Inicial del Proyecto Y Sistema de Diseño

1. Inicializa el proyecto Next.js con App Router, TypeScript, Tailwind CSS y ESLint.
2. Instala e inicializa Shadcn/ui.
3. Instala las dependencias principales: `firebase`, `@sentry/nextjs`, `imagekit`, `zustand`, `@tanstack/react-table`, `recharts`, `lucide-react`.
4. Configura en `tailwind.config.ts` y las variables CSS el sistema de colores y tipografía derivados de `logo.png` y `logo_sin_fondo.png`, asegurando una paleta armoniosa para la marca **Renacer Drinks & Coffe**.

---

### Paso 2: Configuración de Firebase y Servicios Externos

1. Crea el archivo de inicialización del cliente y SDK de administración de Firebase (`lib/firebase.ts`).
2. Configura los clientes de **ImageKit** y **Sentry** en la carpeta `lib/`.
3. Configura el archivo `.env.local` con todas las variables necesarias.

### Paso 3: Módulo Público (Landing Page y Catálogo)

1. **Landing Page (`/`)**: Secciones para Hero, Historia, Ubicación, Horarios y Productos Destacados.
2. **Catálogo (`/catalogo`)**:
   - Renderiza la lista de productos obtenida desde Firestore.
   - Consulta e integra la tasa oficial del dólar BCV desde `https://ve.dolarapi.com/v1/dolares/oficial` para mostrar el precio dinámico en Bolívares (`$X.XX USD / Bs. YY.YY`).
   - Aplica revalidación por tiempo (`export const revalidate = 3600`) o revalidación por Tag/Path usando Server Actions para mantener cero consumo excesivo de Firestore.
   - Filtros por categoría y barra de búsqueda en tiempo real.
3. **Carrito de Compras (`/carrito` o Drawer/Dialog)**:
   - Estado persistente manejado con Zustand (`store/useCartStore.ts`).
   - Muestra el subtotal y total calculado tanto en USD como en Bolívares (Bs.) con la tasa BCV del día.
   - Botón para completar el pedido que genera un mensaje estructurado directo hacia WhatsApp detallando el pedido, montos en USD y su equivalente en Bs. según la tasa BCV.

### Paso 4: Módulo Administrativo (Autenticación y Rutas Protegidas)

1. **Login (`/admin/login`)**: Formulario con Firebase Auth (`signInWithEmailAndPassword`).
2. **Protección de Rutas**: Implementa un Layout/Middleware para redirigir si el usuario no está autenticado.

### Paso 5: Panel Admin - Gestión de Inventario

1. **Tabla de Productos (`/admin/inventario`)**: Vista en tabla usando TanStack Table con estado de disponibilidad, precio en USD, categoría y acciones (Editar/Eliminar).
2. **Formulario Modal/Página (Crear/Editar Producto)**:
   - Subida de imagen a ImageKit con previsualización.
   - Guardado o actualización del documento en Firestore.
   - Disparo de `revalidatePath('/catalogo')` para actualizar la vista pública instantáneamente.

### Paso 6: Panel Admin - Gestión Financiera Básica

1. **Registro de Transacciones (`/admin/finanzas`)**: Formulario rápido para registrar Ingresos y Egresos diarios en USD y su equivalente guardado en Bs. según la tasa BCV del día.
2. **Dashboard Financiero**:
   - Indicador de Tasa Oficial BCV del día en tiempo real.
   - Tarjetas KPI: Total Ingresos del Mes, Total Egresos del Mes, Balance Neto (con desglose USD / Bs.).
   - Gráfico de barras/líneas usando Recharts mostrando la tendencia semanal/mensual.

---

## REGLAS DE CÓDIGO Y BUENAS PRÁCTICAS

- Escribe código limpio, modular y fuertemente tipado con TypeScript.
- **Enfoque Mobile-First Obligatorio**:
  - Diseña primeramente las interfaces para pantallas móviles pequeñas (320px - 430px) y luego expande progresivamente para tablets (`md:`) y escritorio (`lg:`).
  - **Compatibilidad con Android**: Asegura áreas de toque cómodas (mínimo 48x48px en botones e inputs), respuesta táctil rápida y navegación fluida en navegadores móviles (Chrome Android, Edge).
  - **Compatibilidad con iOS**: Soporte para Safari iOS (manejo de safe area insets `pb-[env(safe-area-inset-bottom)]`, unidades de viewport dinámico `min-h-[100dvh]`, prevención de auto-zoom en inputs de texto configurando `font-size: 16px` mínimo).
- Respeta rigurosamente la paleta de colores e identidad gráfica extraída de `logo.png` y `logo_sin_fondo.png` para **Renacer Drinks & Coffe**.
- Utiliza `logo_sin_fondo.png` en el navbar/header, favicon y elementos donde se requiera transparencia visual.
- Maneja estados de carga (`loading.tsx` o componentes Skeleton) en todas las vistas del catálogo y admin.
- No almacenes secretos ni claves privadas de Firebase, Sentry e ImageKit en el bundle del cliente.
