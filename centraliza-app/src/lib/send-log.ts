import { API_BASE_URL } from './api';
import type { FormType } from './local-db';

export type LogPayload = {
  form_type: FormType;
  company_label?: string | null;
  status: 'SUCCESS' | 'ERROR';
  error_detail?: string | null;
};

export async function sendLog(token: string, payload: LogPayload): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // No crítico — nunca debe afectar la UX
  }
}
