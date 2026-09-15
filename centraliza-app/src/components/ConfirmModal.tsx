import type { ReactNode } from 'react';

type Props = {
  visible: boolean;
  title: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  busy?: boolean;
  destructive?: boolean;
};

// Confirmación de envíos y otras acciones del usuario.
export function ConfirmModal({
  visible,
  title,
  children,
  onCancel,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  busy = false,
  destructive = false,
}: Props) {
  if (!visible) return null;

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} aria-busy={busy} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <div className="btn-row">
          <button className={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {confirmText}
          </button>
          <button onClick={onCancel} disabled={busy}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
