import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getFriendlyError } from '../lib/api-error';
import { onForeground } from '../lib/foreground';
import { getFinnegansToken } from '../lib/get-finnegans-token';
import {
  addSubmission,
  getAll,
  getPending,
  initDB,
  markError,
  markSent,
  updateSubmissionPayload,
  type FormType,
  type Submission,
} from '../lib/local-db';
import { notify } from '../lib/notifications';
import { sendLog } from '../lib/send-log';
import { useAuth } from './AuthContext';

const ENDPOINTS: Record<FormType, string> = {
  PEDIDO_COMPRA: 'https://api.finneg.com/api/pedidoCompra',
};

export type AddParams = {
  formType: FormType;
  payload: object;
  companyLabel: string | null;
};

export type AddResult =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'error'; title: string; detail?: string };

type SubmissionsContextType = {
  submissions: Submission[];
  syncing: boolean;
  addAndSubmit: (params: AddParams) => Promise<AddResult>;
  syncPending: () => Promise<void>;
  syncOne: (id: number, updatedPayload?: object) => Promise<void>;
  refresh: () => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

type AttemptResult =
  | { result: 'sent' }
  | { result: 'pending' }
  | { result: 'error'; detail: string };

async function attemptSend(
  userToken: string,
  id: number,
  formType: FormType,
  payload: object,
  companyLabel: string | null
): Promise<AttemptResult> {
  try {
    const finnegansToken = await getFinnegansToken(userToken);
    const res = await fetch(`${ENDPOINTS[formType]}?ACCESS_TOKEN=${finnegansToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await markSent(id);
      sendLog(userToken, {
        form_type: formType,
        company_label: companyLabel,
        status: 'SUCCESS',
      });
      return { result: 'sent' };
    }

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // no era JSON
    }
    const { title } = getFriendlyError(res.status, parsed ?? text);
    const rawBody = parsed !== null ? JSON.stringify(parsed) : text.trim();
    const detailStr = (rawBody ? `${title}\n${rawBody}` : title).slice(0, 1000);
    await markError(id, detailStr);
    sendLog(userToken, {
      form_type: formType,
      company_label: companyLabel,
      status: 'ERROR',
      error_detail: detailStr,
    });
    return { result: 'error', detail: detailStr };
  } catch {
    // Sin red — queda PENDING para el próximo sync
    return { result: 'pending' };
  }
}

export function SubmissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB().then(() => {
      setReady(true);
      reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    return onForeground(() => syncPending());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.token]);

  async function reload() {
    const all = await getAll();
    setSubmissions(all);
  }

  async function addAndSubmit(params: AddParams): Promise<AddResult> {
    const id = await addSubmission(
      params.formType,
      JSON.stringify(params.payload),
      params.companyLabel
    );
    await reload();

    if (!user?.token) {
      return { status: 'queued' };
    }

    const outcome = await attemptSend(
      user.token,
      id,
      params.formType,
      params.payload,
      params.companyLabel
    );
    await reload();

    if (outcome.result === 'sent') return { status: 'sent' };
    if (outcome.result === 'pending') return { status: 'queued' };

    const stored = outcome.detail || 'Error al enviar.';
    const nl = stored.indexOf('\n');
    return nl >= 0
      ? { status: 'error', title: stored.slice(0, nl), detail: stored.slice(nl + 1) }
      : { status: 'error', title: stored };
  }

  async function syncPending() {
    if (!user?.token || syncing) return;
    const pending = await getPending();
    if (pending.length === 0) return;
    setSyncing(true);
    let sent = 0;
    let errored = 0;
    for (const sub of pending) {
      try {
        const payload = JSON.parse(sub.payload);
        const outcome = await attemptSend(user.token, sub.id, sub.form_type, payload, sub.company_label);
        if (outcome.result === 'sent') sent++;
        else if (outcome.result === 'error') errored++;
      } catch {
        // payload corrupto — dejarlo como está
      }
    }
    await reload();
    setSyncing(false);

    // Avisar por notificación local el resultado del reintento de pendientes.
    if (sent > 0) {
      notify(
        'Pedidos enviados',
        sent === 1 ? 'Se envió 1 pedido pendiente.' : `Se enviaron ${sent} pedidos pendientes.`
      );
    }
    if (errored > 0) {
      notify(
        'Pedidos rechazados',
        errored === 1
          ? '1 pedido fue rechazado. Revisalo en Envíos.'
          : `${errored} pedidos fueron rechazados. Revisalos en Envíos.`
      );
    }
  }

  async function syncOne(id: number, updatedPayload?: object): Promise<void> {
    if (!user?.token) return;
    if (updatedPayload !== undefined) {
      await updateSubmissionPayload(id, JSON.stringify(updatedPayload));
    }
    const all = await getAll();
    const sub = all.find((s) => s.id === id);
    if (!sub) return;
    try {
      const payload = JSON.parse(sub.payload);
      await attemptSend(user.token, sub.id, sub.form_type, payload, sub.company_label);
    } catch {
      // payload corrupto
    }
    await reload();
  }

  const value = useMemo<SubmissionsContextType>(
    () => ({ submissions, syncing, addAndSubmit, syncPending, syncOne, refresh: reload }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submissions, syncing, user?.token]
  );

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error('useSubmissions must be used inside SubmissionsProvider');
  return ctx;
}
