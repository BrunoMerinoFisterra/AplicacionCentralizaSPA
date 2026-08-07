import { useCallback, useEffect, useState } from 'react';
import { PedidoResumen } from '../components/PedidoResumen';
import { useAuth } from '../contexts/AuthContext';
import { useSubmissions } from '../contexts/SubmissionsContext';
import { API_BASE_URL } from '../lib/api';
import type { Submission } from '../lib/local-db';
import { parsePedidoPayload } from '../lib/pedido-compra';
import { loadProductoOptions } from '../lib/productos';

const FORM_LABELS: Record<string, string> = {
  PEDIDO_COMPRA: 'Pedido de Compra',
};

// Registro de envío que devuelve el backend (GET /log/mine).
// Refleja todo lo enviado desde cualquier dispositivo, no solo este.
type ServerLog = {
  id: number;
  form_type: string;
  company_label: string | null;
  status: string; // 'SUCCESS' | 'ERROR'
  error_detail: string | null;
  created_at: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

// Modal de edición + reintento para envíos con ERROR
// (port de components/pending-review-modal.tsx de FSTrack).
function ReviewModal({
  submission,
  onClose,
  onRetry,
}: {
  submission: Submission;
  onClose: () => void;
  onRetry: (id: number, payload?: object) => Promise<void>;
}) {
  const [text, setText] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(submission.payload), null, 2);
    } catch {
      return submission.payload;
    }
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleRetry = async () => {
    let parsed: object | undefined;
    try {
      parsed = JSON.parse(text);
      setJsonError(null);
    } catch {
      setJsonError('El JSON no es válido. Corregilo antes de reenviar.');
      return;
    }
    setSending(true);
    await onRetry(submission.id, parsed);
    setSending(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {FORM_LABELS[submission.form_type] ?? submission.form_type} #{submission.id}
        </h3>
        {submission.error_detail && (
          <div className="error-box">
            <div className="title">Último error</div>
            <div className="detail">{submission.error_detail}</div>
          </div>
        )}
        <div className="field" style={{ marginTop: '0.75rem' }}>
          <label>Payload (editable)</label>
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
        </div>
        {jsonError && (
          <div className="error-box">
            <div className="title">{jsonError}</div>
          </div>
        )}
        <div className="btn-row">
          <button className="primary" onClick={handleRetry} disabled={sending}>
            {sending ? 'Reenviando...' : 'Reenviar'}
          </button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export function EnviosPage() {
  const { submissions, syncing, syncPending, syncOne, refresh } = useSubmissions();
  const { user } = useAuth();
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(false);

  // Códigoproducto -> nombre, para mostrar el detalle de pedidos ya enviados
  // con el mismo nombre legible que se ve antes de enviar (no solo el código).
  const [productoLabels, setProductoLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.token) return;
    loadProductoOptions(user.token)
      .then((options) => {
        setProductoLabels(Object.fromEntries(options.map((o) => [o.value, o.label])));
      })
      .catch((err) => console.error('Error loading productos:', err));
  }, [user?.token]);

  const productoLabel = (codigo: string) => productoLabels[codigo] || codigo;

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  const loadServerLogs = useCallback(async () => {
    if (!user?.token) return;
    setLoadingLogs(true);
    setLogsError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/log/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`log/mine failed: ${res.status}`);
      setServerLogs(await res.json());
    } catch (err) {
      console.error('Error loading server logs:', err);
      setLogsError(true);
    } finally {
      setLoadingLogs(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadServerLogs();
  }, [loadServerLogs]);

  // Refresca ambas fuentes a la vez.
  const refreshAll = async () => {
    await Promise.all([refresh(), loadServerLogs()]);
  };

  return (
    <div className="page">
      <h1>Envíos</h1>
      <p className="muted">
        Historial de pedidos cargados. Los pendientes se reenvían automáticamente al recuperar
        conexión.
      </p>

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button onClick={refreshAll}>Actualizar</button>
        {pendingCount > 0 && (
          <button className="primary" onClick={() => syncPending()} disabled={syncing}>
            {syncing ? 'Sincronizando...' : `Reenviar pendientes (${pendingCount})`}
          </button>
        )}
      </div>

      <h3 className="section-title">En este dispositivo</h3>
      {submissions.length === 0 && (
        <div className="card">
          <p className="muted">Todavía no hay envíos en este dispositivo.</p>
        </div>
      )}

      {submissions.map((sub) => {
        const expanded = expandedId === sub.id;
        const pedido = expanded ? parsePedidoPayload(sub.payload) : null;
        return (
          <div key={sub.id} className="card">
            <button
              className="submission-toggle"
              onClick={() => setExpandedId(expanded ? null : sub.id)}
              aria-expanded={expanded}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                <strong>
                  {FORM_LABELS[sub.form_type] ?? sub.form_type} #{sub.id}
                </strong>
                <span className={`badge ${sub.status}`}>{sub.status}</span>
              </div>
            </button>
            <p className="muted" style={{ margin: '0.35rem 0' }}>
              {sub.company_label ?? 'Sin empresa'} · Creado: {formatDate(sub.created_at)}
              {sub.sent_at ? ` · Enviado: ${formatDate(sub.sent_at)}` : ''}
            </p>

            {expanded && (
              pedido ? (
                <PedidoResumen
                  empresa={sub.company_label}
                  fecha={pedido.Fecha ?? null}
                  descripcion={pedido.Descripcion ?? null}
                  items={(pedido.Items ?? []).map((item) => ({
                    producto: item.ProductoCodigo ? productoLabel(item.ProductoCodigo) : '',
                    cantidad: item.Cantidad ?? null,
                    fechaProximoPaso: item.FechaProximoPaso ?? null,
                    descripcion: item.Descripcion ?? null,
                  }))}
                />
              ) : (
                <p className="muted">No se pudo leer el detalle de este pedido.</p>
              )
            )}

            {sub.status === 'ERROR' && (
              <>
                {sub.error_detail && (
                  <div className="error-box">
                    <div className="detail">{sub.error_detail}</div>
                  </div>
                )}
                <div className="btn-row">
                  <button className="primary" onClick={() => setReviewing(sub)}>
                    Revisar y reenviar
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <h3 className="section-title">Historial (todos los dispositivos)</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Registro de envíos guardado en el servidor. Incluye lo enviado desde cualquier dispositivo.
        Los pendientes sin conexión no aparecen acá hasta que se envían.
      </p>

      {loadingLogs && <span className="spinner" />}

      {logsError && (
        <div className="error-box">
          <div className="title">No se pudo cargar el historial del servidor.</div>
          <div className="detail">
            <button className="link" onClick={loadServerLogs}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!loadingLogs && !logsError && serverLogs.length === 0 && (
        <div className="card">
          <p className="muted">Todavía no hay envíos registrados en el servidor.</p>
        </div>
      )}

      {serverLogs.map((log) => {
        const enviado = log.status === 'SUCCESS';
        return (
          <div key={log.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong>{FORM_LABELS[log.form_type] ?? log.form_type}</strong>
              <span className={`badge ${enviado ? 'SENT' : 'ERROR'}`}>
                {enviado ? 'ENVIADO' : 'ERROR'}
              </span>
            </div>
            <p className="muted" style={{ margin: '0.35rem 0' }}>
              {log.company_label ?? 'Sin empresa'} · {formatDate(log.created_at)}
            </p>
            {!enviado && log.error_detail && (
              <div className="error-box">
                <div className="detail">{log.error_detail}</div>
              </div>
            )}
          </div>
        );
      })}

      {reviewing && (
        <ReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onRetry={(id, payload) => syncOne(id, payload)}
        />
      )}
    </div>
  );
}
