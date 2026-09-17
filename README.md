# ALBIO - Plataforma de Agentes de Inteligencia Artificial (SENS)

Migración productiva de la implementación de ALBIO desde Wix + Velo hacia una arquitectura propia, profesional y modular.

---

## 🏗️ Arquitectura del Sistema

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + CSS Moderno (sin librerías pesadas).
- **Backend**: Node.js + Fastify + TypeScript + Zod.
- **Base de Datos**: PostgreSQL + Prisma ORM.
- **Autenticación**: Better Auth (sesiones basadas en cookies `HttpOnly`, `SameSite: "lax"` y `Secure`).
- **Integración IA**: Abstracción `AIProvider` con implementación `DifyProvider` protegida en backend.
- **Infraestructura**: Docker & Docker Compose.

---

## 🚀 Puesta en Marcha Rápida

### Opción A: Con Docker Compose (Recomendado)

1. Crear el archivo `.env` en la raíz (copiar desde `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Configurar la variable `DIFY_API_KEY_ALBIO` con la clave de tu agente en Dify.
3. Levantar los servicios:
   ```bash
   docker compose up --build
   ```
4. Abrir en el navegador:
   - Frontend: [http://localhost:3000/albio](http://localhost:3000/albio)
   - Backend API: [http://localhost:4000/api/health](http://localhost:4000/api/health)
   - Base de Datos Visual (Prisma Studio): [http://localhost:5555](http://localhost:5555)

---

### 🗄️ Visualizador de Base de Datos (Prisma Studio)

Para explorar visualmente todas las tablas, relaciones, usuarios, conversaciones y mensajes:

```bash
# Desde la raíz del proyecto:
npm run studio
```
O bien abrir directamente en el navegador si ya está en ejecución:
👉 **[http://localhost:5555](http://localhost:5555)**

---

### Opción B: Ejecución Local para Desarrollo

#### 1. Backend
```bash
cd backend
npm install
# Asegúrate de tener PostgreSQL corriendo y DATABASE_URL configurada en backend/.env
npx prisma db push # o npx prisma migrate dev
npx prisma db seed # Inserta el agente ALBIO y su saludo inicial
npm run dev
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Acceder a [http://localhost:3000/albio](http://localhost:3000/albio).

---

## 🧪 Pruebas Automatizadas

Para ejecutar los tests unitarios y de integración del backend:
```bash
cd backend
npm test
```

---

## 🔐 Decisiones Clave Implementadas

1. **Gate de Límite Anónimo (3 Mensajes)**:
   - Control estricto en backend en PostgreSQL.
   - Incremento atómico post-respuesta de Dify (fiel al comportamiento de Wix).
2. **Reanudación Post-Login**:
   - Al autenticarse, se inicia una nueva conversación en Dify enviando el contexto previo de la sesión anónima y el saludo personalizado: `"Hola {nombre}. Retomo lo que veníamos hablando."`.
3. **Desacople de IA**:
   - Los servicios de conversación solo conocen la interfaz `AIProvider`. El proveedor `DifyProvider` gestiona los secretos, timeouts y el mapeo de errores.
