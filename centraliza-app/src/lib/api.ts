// URL de centraliza-api.
// En dev apunta al server local; en producción se define VITE_API_BASE_URL
// (Vercel → Settings → Environment Variables, y .env.production para el APK).
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002';
