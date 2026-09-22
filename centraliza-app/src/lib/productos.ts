import type { SelectOption } from '../components/SearchableSelect';
import { API_BASE_URL } from './api';
import { getFinnegansToken } from './get-finnegans-token';
import { getCached, setCached } from './options-cache';

export type ProductoOption = SelectOption & {
  unidad?: string;
  unidadIdCompra?: string;
  rubro?: string;
  familia?: string;
};

export type ProductoFilters = {
  rubros: string[];
  familias: string[];
};

// La versión evita reutilizar opciones cacheadas que todavía no incluían
// NombreRubro y NombreFamilia.
const CACHE_KEY = 'productos_compra_v3';

const normalizeCategory = (value: string) => value.trim().toLocaleLowerCase('es');

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
      const rubro = String(
        item.NOMBRERUBRO ?? item.NombreRubro ?? item.nombreRubro ?? item.rubro ?? ''
      ).trim();
      const familia = String(
        item.NOMBREFAMILIA ?? item.NombreFamilia ?? item.nombreFamilia ?? item.familia ?? ''
      ).trim();
      return {
        label: String(
          item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.DESCRIPCION ?? item.descripcion ??
          item.CODIGO ?? item.Codigo ?? item.codigo ?? ''
        ).trim(),
        value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
        ...(unidad ? { unidad } : {}),
        ...(unidadIdCompra ? { unidadIdCompra } : {}),
        ...(rubro ? { rubro } : {}),
        ...(familia ? { familia } : {}),
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

export async function loadProductoFilters(userToken: string): Promise<ProductoFilters> {
  const response = await fetch(`${API_BASE_URL}/auth/my-product-filters`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `my-product-filters request failed: ${response.status}`);
  }
  return {
    rubros: Array.isArray(data.rubros)
      ? data.rubros.filter((item: unknown): item is string => typeof item === 'string')
      : [],
    familias: Array.isArray(data.familias)
      ? data.familias.filter((item: unknown): item is string => typeof item === 'string')
      : [],
  };
}

// Cada dimensión vacía es opcional y no restringe. Si ambas tienen valores,
// el producto debe pertenecer a un rubro y a una familia habilitados.
export function filterProductoOptions(
  options: ProductoOption[],
  filters: ProductoFilters
): ProductoOption[] {
  const rubros = new Set(filters.rubros.map(normalizeCategory));
  const familias = new Set(filters.familias.map(normalizeCategory));
  return options.filter((option) =>
    (rubros.size === 0 || (option.rubro ? rubros.has(normalizeCategory(option.rubro)) : false)) &&
    (familias.size === 0 || (option.familia ? familias.has(normalizeCategory(option.familia)) : false))
  );
}

export function getProductoCategoryOptions(
  options: ProductoOption[],
  field: 'rubro' | 'familia'
): string[] {
  const unique = new Map<string, string>();
  for (const option of options) {
    const value = option[field]?.trim();
    if (value && !unique.has(normalizeCategory(value))) {
      unique.set(normalizeCategory(value), value);
    }
  }
  return [...unique.values()].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );
}
