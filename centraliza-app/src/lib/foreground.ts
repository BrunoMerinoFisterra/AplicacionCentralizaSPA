// Equivalente multiplataforma del AppState "active" de React Native:
// - nativo: appStateChange de @capacitor/app
// - web: visibilitychange del document
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function onForeground(callback: () => void): () => void {
  if (Capacitor.isNativePlatform()) {
    const handle = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) callback();
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }
  const listener = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}
