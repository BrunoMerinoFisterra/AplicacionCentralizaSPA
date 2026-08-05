import type { ReactNode } from 'react';

type Props = {
  visible: boolean;
  title: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

// Modal de confirmación previa al envío.
export function ConfirmModal({
  visible,
  title,
  children,
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
        {children}
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
