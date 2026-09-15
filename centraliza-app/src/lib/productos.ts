import type { SelectOption } from '../components/SearchableSelect';
import { getFinnegansToken } from './get-finnegans-token';
import { getCached, setCached } from './options-cache';

export type ProductoOption = SelectOption & {
  unidad?: string;
  unidadIdCompra?: string;
};

// La versión evita reutilizar opciones cacheadas antes de que Producto/list
// comenzara a devolver la unidad de compra.
const CACHE_KEY = 'productos_compra_v2';

// Trae (y cachea 24h) las opciones de producto habilitadas para Pedido de Compra.
// Se usa tanto para el selector del formulario como para resolver nombre a partir
// del código guardado en pedidos ya enviados (Envíos, Admin).
export async function loadProductoOptions(userToken: string): Promise<ProductoOption[]> {
  const cached = await getCached<ProductoOption[]>(CACHE_KEY);
  if (cached) return cached;

  const token = await getFinnegansToken(userToken);

  // 1) Reporte a medida (SP que filtra activos + comprables del lado del servidor).
  //    No existe en todas las instancias de Finnegans — si falla, se usa la API estándar.
  let data: unknown[] | null = null;
  const reportRes = await fetch(
    `https://api.finneg.com/api/reports/PRODUCTOSCOMPRAAPI?ACCESS_TOKEN=${token}`
  ).catch(() => null);
  if (reportRes?.ok) {
    const parsed = await reportRes.json();
    if (Array.isArray(parsed)) data = parsed;
  }

  // 2) Fallback: API estándar Producto/list (filtra solo activos; trae todos los productos).
  if (!data) {
    const listRes = await fetch(`https://api.finneg.com/api/Producto/list?ACCESS_TOKEN=${token}`);
    if (!listRes.ok) throw new Error(`Producto/list request failed: ${listRes.status}`);
    const parsed = await listRes.json();
    data = (Array.isArray(parsed) ? parsed : []).filter((item: Record<string, unknown>) => {
      const activo = item.activo ?? item.ACTIVO ?? item.Activo;
      // Los selectores personalizados pueden omitir Activo. En ese caso se
      // conserva el registro; si el campo está presente, se respeta su valor.
      if (activo === undefined || activo === null || activo === '') return true;
      return activo === true || activo === 'true' || activo === 1 || activo === '1';
    });
  }

  const options: ProductoOption[] = data
    .map((raw) => {
      const item = raw as Record<string, unknown>;
      const unidad = String(
        item.UNIDAD ?? item.Unidad ?? item.unidad ??
        item.UNIDADNOMBRECOMPRA ?? item.UnidadNombreCompra ?? item.unidadNombreCompra ??
        item.UNIDADCODIGOCOMPRA ?? item.UnidadCodigoCompra ?? item.unidadCodigoCompra ?? ''
      ).trim();
      const unidadIdCompra = String(
        item.UNIDADIDCOMPRA ?? item.UnidadIDCompra ?? item.unidadIDCompra ?? item.unidadIdCompra ?? ''
      ).trim();
      return {
        label: String(
          item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.DESCRIPCION ?? item.descripcion ??
          item.CODIGO ?? item.Codigo ?? item.codigo ?? ''
        ).trim(),
        value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
        ...(unidad ? { unidad } : {}),
        ...(unidadIdCompra ? { unidadIdCompra } : {}),
      };
    })
    .filter((item) => item.label && item.value)
    // Ocultar los productos marcados como no usar (ej. "** NO USAR ** ...").
    // El reporte a medida ya los excluye; esto cubre el fallback Producto/list.
    .filter((item) => !/\*+\s*no\s*usar/i.test(item.label))
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));

  await setCached(CACHE_KEY, options);
  return options;
}
