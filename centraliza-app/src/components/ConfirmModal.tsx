type Props = {
  visible: boolean;
  title: string;
  payload?: object | null;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

// Modal de confirmación previa al envío, con vista del payload
// (port de components/SendConfirmationModal.tsx de FSTrack).
export function ConfirmModal({
  visible,
  title,
  payload,
  onCancel,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: Props) {
  if (!visible) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {payload != null && (
          <>
            <p className="muted">Se enviará la siguiente información:</p>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </>
        )}
        <div className="btn-row">
          <button className="primary" onClick={onConfirm}>
            {confirmText}
          </button>
          <button onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
