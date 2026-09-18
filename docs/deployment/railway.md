# Guía de Despliegue Técnico en Railway — ALBIO / SENS

Este documento describe la preparación técnica y los pasos manuales necesarios para desplegar la plataforma **ALBIO** en **Railway**.

---

## 1. Arquitectura de Despliegue

```
Railway Project
│
├── PostgreSQL (Managed Database)
│   └── Base de datos relacional persistente
│
├── ALBIO Backend (Service 1)
│   └── API Fastify (Node.js 20 / TypeScript)
│   └── Prisma ORM
│   └── Better Auth
│   └── Conector con Dify (externo)
│
└── ALBIO Frontend (Service 2)
    └── Next.js 14 (App Router / Standalone)
    └── React Chat UI
```

- **PostgreSQL**: Instancia gestionada por Railway. No se despliega en un contenedor Docker propio.
- **Dify**: Servicio de IA externo. Se conecta únicamente desde el backend de ALBIO.

---

## 2. Servicios Necesarios en Railway

1. **Postgres** (Database): Servicio nativo de PostgreSQL en Railway.
2. **albio-backend** (Web Service): Desplegado desde la carpeta `/backend` del repositorio.
3. **albio-frontend** (Web Service): Desplegado desde la carpeta `/frontend` del repositorio.

---

## 3. Matriz de Variables de Entorno

| Variable | Servicio | Visibilidad | Obligatoria | Descripción / Valor Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend | PRIVADA | Opcional | `production` |
| `PORT` | Backend | PRIVADA | Automática | Inyectada dinámicamente por Railway (default 4000). |
| `HOST` | Backend | PRIVADA | Opcional | `0.0.0.0` |
| `DATABASE_URL` | Backend | PRIVADA | **SÍ** | Referencia de Railway: `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | Backend | PRIVADA | **SÍ** | Cadena aleatoria segura de al menos 32 caracteres (ej: `openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Backend | PRIVADA | **SÍ** | URL pública del Backend generada por Railway (ej: `https://backend-production.up.railway.app`). |
| `FRONTEND_URL` | Backend | PRIVADA | **SÍ** | URL pública del Frontend generada por Railway (ej: `https://frontend-production.up.railway.app`). |
| `DIFY_API_KEY_ALBIO` | Backend | PRIVADA | **SÍ** | API Key del agente ALBIO en Dify Cloud / Self-hosted. |
| `DIFY_API_URL` | Backend | PRIVADA | Opcional | URL base de Dify (default: `https://api.dify.ai/v1`). |
| `NODE_ENV` | Frontend | PRIVADA | Opcional | `production` |
| `PORT` | Frontend | PRIVADA | Automática | Inyectada dinámicamente por Railway (default 3000). |
| `NEXT_PUBLIC_API_URL` | Frontend | **PÚBLICA** | **SÍ** | URL pública del Backend a la que el navegador web del usuario enviará peticiones (ej: `https://backend-production.up.railway.app`). |

### Advertencia Crítica sobre Variables `NEXT_PUBLIC_*`
- `NEXT_PUBLIC_API_URL` es leída por Next.js en **tiempo de compilación** (`next build`) y queda **embebida permanentemente dentro de los archivos JavaScript que se envían al navegador de los usuarios**.
- **BAJO NINGUNA CIRCUNSTANCIA** se debe prefijar con `NEXT_PUBLIC_` variables sensibles como `DIFY_API_KEY_ALBIO`, `BETTER_AUTH_SECRET` o `DATABASE_URL`. El backend es el único guardián de esas credenciales.

---

## 4. Comandos de Build y Start

### Backend
- **Si se utiliza Dockerfile** (configuración recomendada):
  - Build: Ejecutado automáticamente mediante `backend/Dockerfile` (multietapa con `prisma generate` y `tsc`).
  - Start: `CMD ["node", "dist/server.js"]`
- **Si se utiliza Nixpacks / Node nativo**:
  - Build Command: `npm run build`
  - Start Command: `npm run start` (ejecuta `node dist/server.js`)

### Frontend
- **Si se utiliza Dockerfile** (configuración recomendada):
  - Build: Ejecutado automáticamente mediante `frontend/Dockerfile` (con inyección de `ARG NEXT_PUBLIC_API_URL`).
  - Start: `CMD ["node", "server.js"]` (servidor Next.js Standalone).
- **Si se utiliza Nixpacks / Node nativo**:
  - Build Command: `npm run build`
  - Start Command: `npm run start` (ejecuta `next start` respetando automáticamente la variable `PORT` asignada).

---

## 5. Migraciones de Base de Datos (Prisma)

En Railway, la base de datos PostgreSQL se inicia vacía.
El mecanismo de producción oficial es **Prisma Migrate**:

```bash
npx prisma migrate deploy
```

- **NO utilizar `npx prisma db push` en producción**. El `Dockerfile` del backend no ejecuta `db push`.
- El repositorio cuenta con una migración base (`20260916000000_init`) y una migración de restricción referencial (`20260917210800_agent_on_delete_restrict`).
- Al ejecutar `npx prisma migrate deploy` en la base limpia de Railway, se crearán todas las tablas, relaciones e índices de forma consistente.

### Seed Inicial de ALBIO
- El servicio de agentes (`agentsService`) cuenta con un mecanismo de **autocreación bajo demanda**: si la base de datos está recién desplegada y se recibe la primera solicitud al agente ALBIO, se crea automáticamente el registro con el saludo institucional.
- Adicionalmente, el comando existente `npm run prisma:seed` (o `npx tsx prisma/seed.ts`) puede ejecutarse opcionalmente desde la terminal de Railway si se desea poblar el registro del agente antes de recibir visitas.

---

## 6. Configuración de Red, CORS y Health Check

### Health Check
- Endpoint de verificación: `GET /health`
- Respuesta: HTTP 200 con `{ "status": "ok" }`
- En Railway se puede configurar en la pestaña **Settings** > **Healthcheck Path**: `/health`.

### Reverse Proxy y HTTPS
- Fastify está configurado con `trustProxy: true`.
- Esto permite detectar correctamente el protocolo real (`https`) a partir de `x-forwarded-proto` y la IP real del cliente a partir de `x-forwarded-for`.

### CORS y Better Auth
- Los orígenes permitidos en CORS y en `trustedOrigins` de Better Auth se configuran dinámicamente mediante `FRONTEND_URL`.
- La lógica de normalización en el backend elimina automáticamente barras finales (`/`) para evitar discrepancias de origen (`https://dominio` vs `https://dominio/`).

---

## 7. Pasos Manuales para el Administrador en Railway

Una vez que se decida realizar el despliegue, el operador realizará manualmente los siguientes pasos desde el panel de Railway:

1. **Crear Proyecto**:
   - En el dashboard de Railway, crear un nuevo proyecto vacío (*Empty Project*).
2. **Añadir PostgreSQL**:
   - Click en *+ New* > *Database* > *Add PostgreSQL*.
3. **Crear Servicio Backend**:
   - Click en *+ New* > *GitHub Repo* > seleccionar el repositorio.
   - En *Settings* > *Root Directory*, indicar: `/backend`.
   - En *Variables*, agregar:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `BETTER_AUTH_SECRET` = (generar clave segura de 32+ caracteres)
     - `DIFY_API_KEY_ALBIO` = (clave de API de Dify)
     - `DIFY_API_URL` = `https://api.dify.ai/v1`
   - En *Settings* > *Networking*, click en *Generate Domain* para obtener la URL pública del backend.
   - Añadir la variable:
     - `BETTER_AUTH_URL` = `https://<dominio-backend-generado>`
   - En *Settings* > *Healthcheck Path*, indicar: `/health`.
4. **Ejecutar Migración de Base de Datos**:
   - Una vez desplegado el backend y conectada la base, abrir la consola de Railway (*Deployments* > *View Logs* / *Exec*) o ejecutar vía Railway CLI:
     ```bash
     npx prisma migrate deploy
     ```
   - (Opcional) Ejecutar seed: `npm run prisma:seed`.
5. **Crear Servicio Frontend**:
   - Click en *+ New* > *GitHub Repo* > seleccionar el repositorio.
   - En *Settings* > *Root Directory*, indicar: `/frontend`.
   - En *Variables*, agregar:
     - `NEXT_PUBLIC_API_URL` = `https://<dominio-backend-generado>`
   - En *Settings* > *Networking*, click en *Generate Domain* para obtener la URL pública del frontend.
6. **Vincular Frontend en Backend**:
   - Volver al servicio **albio-backend** > *Variables*, y definir:
     - `FRONTEND_URL` = `https://<dominio-frontend-generado>`
   - Railway redesplegará el backend con la nueva variable de CORS actualizada.
7. **Verificación**:
   - Ingresar a `https://<dominio-frontend-generado>/albio`.
   - Abrir el formulario de registro y comprobar que la carga de conversaciones y consentimiento funcione correctamente.
