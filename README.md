# Centraliza SPA App

App móvil (Android) + web con login para cargar **Pedidos de Compra** a Finnegans.
Proyecto independiente de FSTrack: usa la misma Azure SQL pero con tablas propias `centraliza_*`.

```
Centraliza/
├── centraliza-api/   # Express — auth, token Finnegans, logs, admin
└── centraliza-app/   # Vite + React + TypeScript + Capacitor
```

## Backend (centraliza-api)

```bash
cd centraliza-api
npm install
npm run dev        # nodemon en el puerto 3002
```

Requiere `.env` (ver `.env.example`): `DB_*` (Azure SQL), `JWT_SECRET` propio,
`FINNEGANS_CLIENT_ID` / `FINNEGANS_CLIENT_SECRET` (credenciales OAuth del cliente Centraliza SPA).

Primera vez:

```bash
node migrations/run-migration.js
```

```bash
node create-user.js <usuario> <clave> "<Nombre Completo>" admin
```

### Endpoints

- `POST /auth/login` — usuario + password → JWT (7 días)
- `GET /auth/my-companies`, `GET /auth/my-workflow` — restricciones del usuario
- `GET /finnegans/token` — token OAuth de Finnegans
- `POST /log`, `GET /log/mine` — auditoría de envíos
- `GET|POST|PATCH /admin/users*`, `GET /admin/logs`, `GET /admin/finnegans-*` — solo `role='admin'`

## Frontend (centraliza-app)

```bash
cd centraliza-app
npm install
npm run dev        # Vite en el puerto 5173
```

En dev apunta a `http://localhost:3002`. Para producción definir `VITE_API_BASE_URL`
(en `.env.production` para builds locales, y en Vercel → Environment Variables para la web).

El panel de administración está dentro de la app (`/admin`), visible solo para cuentas admin.

### Cola offline

Los pedidos se guardan localmente antes de enviarse (`PENDING → SENT | ERROR`):

- **Web**: IndexedDB
- **Android**: SQLite (@capacitor-community/sqlite)

Los `PENDING` se reintentan al volver la app al primer plano; los `ERROR` se pueden editar y reenviar desde Envíos.

## Deploy

### Web → Vercel

```bash
cd centraliza-app
npm run build
```

Deploy del directorio `centraliza-app` en Vercel (framework: Vite). `vercel.json` ya tiene el rewrite de SPA.
Definir `VITE_API_BASE_URL` en las Environment Variables del proyecto.

### Android → APK local (sin límites de builds)

Requisitos: Android Studio + JDK.

```bash
cd centraliza-app
npm run build
npx cap sync android
npx cap open android
```

Desde Android Studio: **Build → Generate Signed Bundle / APK**. Builds ilimitadas y locales.
(iOS: `npx cap add ios` más adelante — requiere una Mac.)

### API → Azure App Service

Deploy de `centraliza-api/` a un App Service propio (separado de fstrack-api) con las
variables del `.env` configuradas en **Configuration → Application settings**.
