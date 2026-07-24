import { useState } from 'react';
import { useSubmissions } from '../contexts/SubmissionsContext';
import type { Submission } from '../lib/local-db';

const FORM_LABELS: Record<string, string> = {
  PEDIDO_COMPRA: 'Pedido de Compra',
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
  const [reviewing, setReviewing] = useState<Submission | null>(null);

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="page">
      <h1>Envíos</h1>
      <p className="muted">
        Historial de pedidos cargados. Los pendientes se reenvían automáticamente al recuperar
        conexión.
      </p>

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button onClick={() => refresh()}>Actualizar</button>
        {pendingCount > 0 && (
          <button className="primary" onClick={() => syncPending()} disabled={syncing}>
            {syncing ? 'Sincronizando...' : `Reenviar pendientes (${pendingCount})`}
          </button>
        )}
      </div>

      {submissions.length === 0 && (
        <div className="card">
          <p className="muted">Todavía no hay envíos.</p>
        </div>
      )}

      {submissions.map((sub) => (
        <div key={sub.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong>
              {FORM_LABELS[sub.form_type] ?? sub.form_type} #{sub.id}
            </strong>
            <span className={`badge ${sub.status}`}>{sub.status}</span>
          </div>
          <p className="muted" style={{ margin: '0.35rem 0' }}>
            {sub.company_label ?? 'Sin empresa'} · Creado: {formatDate(sub.created_at)}
            {sub.sent_at ? ` · Enviado: ${formatDate(sub.sent_at)}` : ''}
          </p>
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
      ))}

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
