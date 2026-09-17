# ALBIO - Plataforma de Agentes de Inteligencia Artificial (SENS)

Plataforma modular y profesional para interacción con agentes inteligentes de **SENS**, diseñada con arquitectura desacoplada, gestión multi-chat por proyectos y despliegue contenerizado.

---

## 🏗️ Arquitectura del Sistema

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + CSS Moderno (Vanilla CSS optimizado, sin frameworks pesados).
- **Backend**: Node.js + Fastify + TypeScript + Zod.
- **Base de Datos**: PostgreSQL 16 + Prisma ORM.
- **Autenticación**: Better Auth (sesiones persistentes mediante cookies `HttpOnly`, `SameSite: "lax"` y `Secure`).
- **Integración IA**: Abstracción `AIProvider` desacoplada con implementación `DifyProvider` protegida en el backend.
- **Infraestructura**: Docker & Docker Compose con builds multi-stage ligeros en Alpine Linux.

---

## ✨ Características Principales y Experiencia de Usuario (UX)

### 1. Sistema Multi-Chat y Organización por Proyectos (Estilo ChatGPT)
- **`+ NUEVO CHAT`**: Genera conversaciones limpias e independientes con ALBIO al instante.
- **`PROYECTOS ALBIO`**:
  - Creación de carpetas/proyectos para clasificar conversaciones por temática o cliente.
  - Acordeones colapsables con contador de chats `(N)`.
  - Creación directa de chats dentro de proyectos y eliminación con traspaso automático a chats sueltos.
- **`CHATS ALBIO`**: Listado de chats que no pertenecen a ningún proyecto.
- **Asignación Flexible y Drag & Drop**:
  - Mové cualquier chat arrastrándolo y soltándolo directamente sobre la carpeta del proyecto.
  - O utilizá el menú emergente de cada chat para reasignarlo o volverlo a chats sueltos.
- **Autotitulado Dinámico**:
  - Tras enviar el primer mensaje en un chat nuevo, el sistema renombra automáticamente la conversación a partir del contenido de tu consulta y actualiza la barra lateral en tiempo real.
- **Scroll Independiente**:
  - Se eliminó el scroll general de la ventana: la barra lateral y la zona de mensajes cuentan con scroll vertical independiente con barras estilizadas, manteniendo el encabezado y el input de mensajes siempre visibles y anclados.

### 2. Autenticación y Persistencia
- Autenticación requerida para interactuar con el agente y persistir historiales en base de datos.
- Registro completo con recolección de datos demográficos (`país`, `ciudad`, `año de nacimiento`) y consentimiento legal de comunicaciones.
- Recuperación instantánea del historial completo de conversaciones al iniciar sesión o recargar.

### 3. Identidad de Marca Oficial
- Integración del logotipo oficial de **SENS Desarrollo Humano** en el encabezado.
- Navegación simplificada centrada en el asistente inteligente **ALBIO Beta**.

---

## 🚀 Puesta en Marcha Rápida

### Opción A: Con Docker Compose (Recomendado)

1. Crear el archivo `.env` en la raíz (copiar desde `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Configurar la clave de API de tu agente en Dify:
   ```env
   DIFY_API_KEY_ALBIO=tu-api-key-de-dify
   ```
3. Levantar los contenedores:
   ```bash
   docker compose up -d --build
   ```
4. Acceder en el navegador:
   - **Frontend**: [http://localhost:3000/albio](http://localhost:3000/albio)
   - **Backend API**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
   - **Base de Datos Visual (Prisma Studio)**: [http://localhost:5555](http://localhost:5555)

---

### 🗄️ Visualizador de Base de Datos (Prisma Studio)

Para inspeccionar y gestionar visualmente todas las tablas (`users`, `projects`, `conversations`, `messages`, `user_consents`, etc.):

```bash
# Desde la raíz del proyecto:
npm run studio
```
O abrir directamente en el navegador:
👉 **[http://localhost:5555](http://localhost:5555)**

---

### Opción B: Ejecución Local para Desarrollo

#### 1. Backend
```bash
cd backend
npm install
# Asegúrate de tener PostgreSQL corriendo y DATABASE_URL configurada en backend/.env
npx prisma db push
npx prisma db seed # Inserta el agente ALBIO inicial
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

## 📡 Endpoints de la API REST

### Proyectos (`/api/projects`)
- `GET /api/projects`: Lista los proyectos del usuario autenticado con conteo de conversaciones.
- `POST /api/projects`: Crea un nuevo proyecto (`{ name, description }`).
- `PATCH /api/projects/:id`: Modifica el nombre o descripción del proyecto.
- `DELETE /api/projects/:id`: Elimina un proyecto (desvincula los chats a chats sueltos).

### Conversaciones (`/api/conversations`)
- `GET /api/conversations`: Lista todas las conversaciones activas del usuario ordenadas por última actualización.
- `POST /api/conversations`: Crea un nuevo chat (`{ projectId?, title? }`).
- `GET /api/conversations/current`: Obtiene o inicializa la conversación activa actual.
- `GET /api/conversations/:id`: Obtiene el historial completo de mensajes de una conversación.
- `POST /api/conversations/:id/messages`: Envía un mensaje, consulta al proveedor de IA (Dify), autotitula el chat y almacena la respuesta.
- `PATCH /api/conversations/:id`: Actualiza el título o asigna/desasigna el proyecto del chat.
- `DELETE /api/conversations/:id`: Elimina una conversación y todos sus mensajes asociados.

### Autenticación y Consentimiento
- `/api/auth/*`: Endpoints administrados por Better Auth (registro, login, logout, sesión).
- `POST /api/consent`: Guarda o actualiza los datos demográficos y consentimiento del usuario.
