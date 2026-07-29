import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Notificaciones locales: las dispara la propia app cuando detecta un cambio
// de estado en la cola (un PENDING que pasa a SENT o queda en ERROR tras un sync).
// No requieren servidor ni Firebase. En web son un no-op (el plugin no aplica).
//
// Para push remoto real (iniciado por el servidor) habría que integrar
// Firebase Cloud Messaging + APNs, que es un paso de infraestructura aparte.

const isNative = Capacitor.isNativePlatform();

let permissionAsked = false;

async function ensurePermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    if (permissionAsked) return false;
    permissionAsked = true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}

let seq = 1;

export async function notify(title: string, body: string): Promise<void> {
  if (!isNative) return;
  try {
    const granted = await ensurePermission();
    if (!granted) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: seq++,
          title,
          body,
          schedule: { at: new Date(Date.now() + 200) },
        },
      ],
    });
  } catch {
    // No romper el flujo de envío si la notificación falla.
  }
}
