# Instrucciones Globales

- Responde siempre en español
- Todos los commits deben ser profesionales, descriptivos y en español
- Siempre que generes la lista de tareas y el plan debe ser en espanol
- Nunca realices pruebas en el navegador a menos de que yo lo indique explicitamente
- Verificar siempre con las skills
- Priorizar el uso de las skills
- Los nombres de las variables y funciones seran en espanol cuando se pueda
- Al escribir, redactar o modificar archivos README, el contenido debe ser profesional, elegante y diseñado para ser presentable como parte de un portafolio en GitHub
- Realiza solo lo descrito explicitamente, cualquier otra modificacion se debe consultar.
- Antes de ejecutar cualquier tarea, realiza todas las preguntas necesarias para entender el alcance, requerimientos y contexto. No asumas nada.
- No utilices el navegador para las pruebas a menos de lo que lo indique explicitamente. Todas las pruebas se haran manualmente.
- La carpeta docs-obsidian nunca de debe subir al repositorio remoto. Siempre debe estar en el .gitignore
- Las skills y los archivos de reglas siempre  deben estar en el gitignore y no debes subirse al repo remoto.

# Flujo de Trabajo Git (Ramas dev / main)

- **Toda modificacion, prueba y desarrollo se realiza en la rama `dev`.** Nunca se trabaja directamente en `main`.
- Los commits se hacen siempre en `dev`. Cada push a `dev` genera automaticamente un Preview Deployment en Vercel (entorno de pruebas con la BD de Firebase).
- **PROHIBIDO hacer push, merge o cambios directos a `main`** sin la aprobacion explicita del usuario. Solo cuando el usuario lo indique se integra `dev` a `main` (produccion).
- Al terminar una tarea en `dev`, se presentan los resultados y la suite de tests (`npm run test`) debe pasar antes de solicitar la aprobacion para el merge a `main`.

# Instrucciones de Testing Automatizado

- Todo cambio que introduzca, modifique o elimine una pagina, componente, servicio, utilidad o logica de negocio debe estar cubierto por tests automatizados.
- Los tests se ejecutan con `npm run test` (Vitest + React Testing Library) y deben pasar antes de considerar terminada una tarea.
- PROHIBIDO tocar la base de datos real durante los tests: toda interaccion con Firestore, Firebase Auth o servicios se debe simular con mocks (vi.mock) o emulador local. Nunca conectar a la BD de produccion.
- Todos los tests residen en la carpeta central `src/tests/`, espejando la estructura de `src/`.
- Los tests deben cubrir: funciones puras (utils, constantes), servicios (con mocks de Firestore), stores (Zustand) y el renderizado sin errores de cada pagina del sistema (prueba de humo) mas sus interacciones criticas.
- Al crear una pagina, componente o funcion nueva, se debe generar su test en la misma tarea. No se permite dejar funciones sin cobertura.

# Instrucciones Obsidian

- **Alias de Directorio (Obsidian = docs-obsidian):** Siempre que el usuario mencione la palabra "obsidian" (ej. "guárdalo en obsidian" o "lee el archivo de obsidian"), la IA debe interpretar automáticamente que la ruta de destino u origen es la carpeta local `docs-obsidian` del proyecto en el que se esté trabajando.
- **Protocolo de Arranque (Lectura Obligatoria):** Al iniciar una nueva sesión de desarrollo sobre un proyecto existente, la IA debe obligatoriamente leer primero los archivos clave de `docs-obsidian` del proyecto (Backlog de tareas, Design System, último Handover y Arquitectura) **antes de escribir una sola línea de código**. El usuario nunca debería tener que decir "revisa la documentación".
- Siempre que realices cambios arquitectónicos, añadas nuevos módulos o alteres el flujo de negocio, **debes revisar y actualizar** la base de Obsidian que se encuentra en la carpeta `docs-obsidian` de cada proyecto. Es obligatorio mantener el planteamiento técnico, los flujos y las tareas nuevas sincronizados con la realidad de la base de código.
- **Uso Obligatorio de Frontmatter:** Todo nuevo archivo Markdown generado para Obsidian debe incluir un bloque de YAML (Frontmatter) al inicio, conteniendo al menos `tags:` para categorizar y `date:` con la fecha de creación o actualización, para asegurar compatibilidad con plugins de gestión.
- **Cero Notas Huérfanas:** Nunca debe crearse una nota aislada en `docs-obsidian`. Todo nuevo documento debe obligatoriamente contener al menos un enlace bidireccional (`[[...]]`) referenciando a un índice maestro, al ecosistema principal o a archivos hermanos.
- **Formato Nativo y Elementos Visuales:** Para representar flujos lógicos o arquitecturas, utiliza obligatoriamente bloques de `mermaid`. Para resaltar información clave o advertencias, prioriza el uso de Callouts dinámicos de Obsidian (como `> [!INFO]`, `> [!WARNING]`, `> [!TODO]`).
- **Nomenclatura Limpia y Lógica:** Al crear nuevos documentos, utiliza prefijos numéricos para establecer el orden de lectura (ej. `01_`, `02_`) y evita usar espacios libres en los nombres de archivo (sustituidos por guiones bajos `_` o CamelCase), garantizando máxima compatibilidad global y un ordenamiento estricto en el panel de navegación.
- **Registro de Decisiones Arquitectónicas (ADRs):** Siempre que se tome una decisión técnica estructural sobre el código (cambio de frameworks, bases de datos o grandes librerías), debes generar un archivo `ADR_` explicando el contexto, la decisión adoptada de forma argumentada y las consecuencias.
- **Patrón de Índices Centrales (MOC):** Todo nuevo sub-folder, módulo complejo o área de alto nivel que se documente, debe contar obligatoriamente con una nota raíz (ej. `00_Index` o `00_MOC`) que actúe como agrupador y hub central de enlaces, evitando que el gráfico posea notas agrupadas sin jerarquía.
- **Bitácoras y Resoluciones (Sin Post-Mortems):** Al resolver un bug crítico o refactorizar código problemático, registra el suceso directamente en la entrada correspondiente de [[09_Bitacora]] (síntoma original, causa raíz y la lógica técnica exacta de la solución) y, si aplica, en el archivo técnico relacionado ([[08_Entorno_Snippets]] para errores de build/config, [[04_Flujo_de_Estados]] para lógica de estados, etc.). **NO se crean archivos de Post-Mortem separados.**

# Instrucciones de Diseño y Retención de Memoria (Anti-Amnesia)

- **Control de Diseño (Design System Maestro):** Toda decisión estética (paletas de colores hexadecimales concretas, jerarquía tipográfica, estilos recurrentes de botones, márgenes fijos, animaciones) debe registrarse obligatoriamente en un archivo enfocado en el diseño (ej. `00_Design_System.md`). Obligatoriamente debo leer estos parámetros *antes* de proponer o construir cualquier interfaz nueva, asegurando consistencia visual absoluta y librando al usuario de tener que repetir qué colores de la marca queremos usar.
- **Cierre de Sesión y Registro de Progreso (Sin Handovers):** Cuando se alcance un hito, o el usuario indique que retomará el trabajo al "día siguiente", **NO se crean archivos de Handover**. La información del avance se divide y registra directamente en el archivo de documentación correspondiente:
  - Actividades, decisiones y avances de la sesión → [[09_Bitacora]]
  - Tareas completadas / pendientes → [[10_Backlog]] o [[15_Tareas_Nuevas]]
  - Decisiones estéticas y UI → [[06_Design_System]]
  - Cambios en modelo de datos / colecciones Firestore → [[03_Modelo_de_Datos]]
  - Configuraciones, comandos y variables de entorno → [[08_Entorno_Snippets]]
  - Páginas nuevas, servicios o funciones → [[21_Estructura_Sistema]]
  - Cambios de stack o dependencias → [[07_Stack_Tecnico]]
  - El punto de reanudación (**¿En qué archivo nos detuvimos? ¿Qué variables quedaron a medias? ¿Cuál es la primera tarea a encarar?**) se registra como una sección `> [!TODO] Punto de Reanudación` dentro de la entrada de la Bitácora. El usuario *nunca* debería tener que re-explicar el contexto perdido al iniciar un nuevo chat.
- **Canon de Lógica de Negocio Automática:** Toda constante del negocio que se defina verbalmente durante el chat (como fórmulas matemáticas de envío, lógicas exactas para dividir cuotas financieras, roles de Firestore de lectura y escritura) debe llevarse de inmediato al archivo de Arquitectura respectivo. Siempre debo recurrir a esta "Biblia" antes de codificar la lógica Backend para evitar fallas o suposiciones mágicas.

# Filosofía DevOps y Ciclo de Vida (Mantenimiento de la Bóveda)

- **Poda Activa y Depuración (Vault Pruning):** La documentación debe tratarse con el mismo rigor que el código fuente. Si eliminamos una función técnica, cambiamos una base de datos o refactorizamos masivamente el proyecto, la IA debe ir obligatoriamente a la bóveda de Obsidian y marcar las notas antiguas con la etiqueta Frontmatter `status: obsoleto` o `deprecated`. Nunca se debe conservar documentación técnica de código eliminado o sin uso como si fuera la actual.
- **Registro de Entorno, Configuración y Snippets:** Cualquier configuración compleja de variables de entorno (`.env`), arreglos de dependencias ocultas (NPM conflicts), comandos densos de Firebase CLI o configuraciones de Vercel/Hosting que logremos hacer funcionar, deben registrarse de inmediato en un archivo de entorno (ej. `03_Entorno_Snippets.md`). La IA extraerá siempre los comandos complejos ejecutados con éxito hacia Obsidian.
- **Notas de Lanzamiento (Release Notes & Changelog Automático):** Cuando se alcance un hito de producción o se realice un despliegue principal a la rama principal (Deploy), la IA se encargará de cruzar las tareas tachadas en los `Backlogs`, purgar el documento y transformarlo en una `Release_Note` estructurada, documentando para un registro general qué características exactas componen la nueva versión del ecosistema.

# Reglas de UI/UX

- Si el proyecto ya cuenta con diseños establecidos, no crees nuevos sin consultar primero. Prioriza la consistencia visual y la armonía con el estilo existente.
- Evita controles nativos del navegador; usa componentes personalizados para alertas, selectores, desplegables y calendarios.
- Crea y reutiliza componentes siempre que sea posible para mantener el código modular, limpio y fácil de mantener.
- Siempre utiliza notificaciones de tipo toast al realizar acciones necesarias.
