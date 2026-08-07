// Payload de PEDIDO_COMPRA tal como se guarda/envía (ver buildPayload en PedidoCompraPage).
export type PedidoCompraPayload = {
  Fecha?: string;
  Descripcion?: string;
  Items?: Array<{
    ProductoCodigo?: string;
    Cantidad?: number | string;
    Descripcion?: string;
    FechaProximoPaso?: string;
  }>;
};

export function parsePedidoPayload(raw: string): PedidoCompraPayload | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
