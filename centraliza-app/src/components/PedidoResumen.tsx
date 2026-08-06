type ResumenItem = {
  producto: string;
  cantidad: string | number | null;
  fechaProximoPaso?: string | null;
  descripcion?: string | null;
};

type Props = {
  empresa?: string | null;
  fecha?: string | null;
  descripcion?: string | null;
  items: ResumenItem[];
};

// Vista legible de un pedido de compra (reemplaza el volcado de JSON crudo).
// Se usa tanto en la confirmación previa al envío como en el detalle de Envíos.
export function PedidoResumen({ empresa, fecha, descripcion, items }: Props) {
  return (
    <div className="pedido-resumen">
      <dl className="pedido-resumen-datos">
        {empresa && (
          <>
            <dt>Empresa</dt>
            <dd>{empresa}</dd>
          </>
        )}
        {fecha && (
          <>
            <dt>Fecha</dt>
            <dd>{fecha}</dd>
          </>
        )}
        {descripcion && (
          <>
            <dt>Descripción</dt>
            <dd style={{ whiteSpace: 'pre-line' }}>{descripcion}</dd>
          </>
        )}
      </dl>

      <p className="pedido-resumen-items-title">Ítems ({items.length})</p>
      {items.map((item, i) => (
        <div key={i} className="pedido-resumen-item">
          <div className="pedido-resumen-item-row">
            <strong>{item.producto || 'Sin producto'}</strong>
            <span className="muted">Cant.: {item.cantidad ?? '—'}</span>
          </div>
          {(item.fechaProximoPaso || item.descripcion) && (
            <p className="muted pedido-resumen-item-detail">
              {item.fechaProximoPaso && <>Fecha de entrega: {item.fechaProximoPaso}</>}
              {item.fechaProximoPaso && item.descripcion && ' · '}
              {item.descripcion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
