import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import { SearchableSelect, type SelectOption } from '../components/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useSubmissions } from '../contexts/SubmissionsContext';
import { useWorkflow } from '../contexts/WorkflowContext';
import type { ApiError } from '../lib/api-error';
import { cleanObject, getTodayDate, toNumberOrNull } from '../lib/form-utils';
import { getFinnegansToken } from '../lib/get-finnegans-token';
import { getCached, setCached } from '../lib/options-cache';

type CompraItem = {
  ProductoCodigo: string;
  Cantidad: string;
  Descripcion: string;
  FechaProximoPaso: string;
};

const createEmptyItem = (): CompraItem => ({
  ProductoCodigo: '',
  Cantidad: '',
  Descripcion: '',
  FechaProximoPaso: '',
});

export function PedidoCompraPage() {
  const { user } = useAuth();
  const {
    companies,
    selectedCompany,
    setSelectedCompanyByValue,
    loadingCompanies,
    loadError,
    refreshCompanies,
  } = useCompany();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [productoOptions, setProductoOptions] = useState<SelectOption[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<CompraItem[]>([createEmptyItem()]);

  const sinEmpresas = !loadingCompanies && !loadError && companies.length === 0;

  const loadProductos = async () => {
    if (!user?.token) return;
    const cacheKey = 'productos_compra';
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) {
      setProductoOptions(cached);
      return;
    }
    setLoadingProductos(true);
    try {
      const token = await getFinnegansToken(user.token);

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
          return activo === true || activo === 'true' || activo === 1 || activo === '1';
        });
      }

      const options: SelectOption[] = data
        .map((raw) => {
          const item = raw as Record<string, unknown>;
          return {
            label: String(
              item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.DESCRIPCION ?? item.descripcion ??
              item.CODIGO ?? item.Codigo ?? item.codigo ?? ''
            ).trim(),
            value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
          };
        })
        .filter((item) => item.label && item.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
      setProductoOptions(options);
      await setCached(cacheKey, options);
    } catch (err) {
      console.error('Error loading productos:', err);
    } finally {
      setLoadingProductos(false);
    }
  };

  useEffect(() => {
    loadProductos();
    // Re-consultar las empresas habilitadas al entrar: si un admin acaba de
    // asignar una, aparece sin necesidad de recargar la página.
    refreshCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (index: number, field: keyof CompraItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const buildPayload = () =>
    cleanObject({
      WorkflowCodigo: workflow.compra?.codigo || null,
      Fecha: fecha || null,
      EmpresaCodigo: selectedCompany?.value || null,
      TransaccionSubtipoCodigo: workflow.compra?.subtipoCodigo || null,
      TransaccionTipoCodigo: 'OPER',
      Descripcion: descripcion || null,
      Items: items.map((item) => ({
        ProductoCodigo: item.ProductoCodigo || null,
        Cantidad: toNumberOrNull(item.Cantidad),
        Descripcion: item.Descripcion || null,
        FechaProximoPaso: item.FechaProximoPaso || null,
      })),
    }) as object;

  const handleSendPress = () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná la empresa antes de enviar el pedido.' });
      return;
    }
    if (!workflow.compra) {
      setError({ title: 'Esta cuenta no tiene un workflow de compra asignado. Contactá al administrador.' });
      return;
    }
    if (!workflow.compra.subtipoCodigo) {
      setError({ title: 'Esta cuenta no tiene un tipo de documento asignado al workflow de compra. Contactá al administrador.' });
      return;
    }
    setConfirmVisible(true);
  };

  const submitCompra = async () => {
    setLoading(true);
    setError(null);
    const result = await addAndSubmit({
      formType: 'PEDIDO_COMPRA',
      payload: buildPayload(),
      companyLabel: selectedCompany?.label ?? null,
    });
    setLoading(false);
    if (result.status === 'error') {
      setError({ title: result.title, detail: result.detail });
    } else {
      navigate('/envios');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pedido de Compra</h1>
      </div>

      <div className="card">
        <h3 className="section-title">Datos del pedido</h3>

        {sinEmpresas ? (
          <div className="note">
            Tu cuenta no tiene ninguna empresa habilitada, así que no podés cargar pedidos. Pedile a
            un administrador que te habilite las empresas con las que vas a trabajar.
          </div>
        ) : loadError ? (
          <div className="error-box">
            <div className="title">No se pudieron cargar las empresas.</div>
            <div className="detail">
              Verificá tu conexión a internet.{' '}
              <button className="link" onClick={() => refreshCompanies()}>
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <SearchableSelect
            label="Empresa"
            selectedValue={selectedCompany?.value ?? ''}
            options={companies}
            onValueChange={(value) => setSelectedCompanyByValue(value)}
            placeholder="Seleccionar empresa..."
            loading={loadingCompanies}
          />
        )}

        <div className="form-row">
          <div className="field narrow">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción general del pedido (opcional)"
            />
          </div>
        </div>

        <h3 className="section-title">Ítems</h3>
        {items.map((item, index) => (
          <div key={index} className="item-card">
            <div className="item-card-header">
              <span className="item-title">Ítem {index + 1}</span>
              {items.length > 1 && (
                <button className="link-danger" onClick={() => removeItem(index)}>
                  Quitar
                </button>
              )}
            </div>
            <SearchableSelect
              label="Producto"
              selectedValue={item.ProductoCodigo}
              options={productoOptions}
              onValueChange={(value) => updateItem(index, 'ProductoCodigo', value)}
              placeholder="Seleccionar producto..."
              loading={loadingProductos}
            />
            <div className="form-row">
              <div className="field narrow">
                <label>Cantidad</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.Cantidad}
                  onChange={(e) => updateItem(index, 'Cantidad', e.target.value)}
                />
              </div>
              <div className="field narrow">
                <label>Fecha próximo paso</label>
                <input
                  type="date"
                  value={item.FechaProximoPaso}
                  onChange={(e) => updateItem(index, 'FechaProximoPaso', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Descripción</label>
                <input
                  type="text"
                  value={item.Descripcion}
                  onChange={(e) => updateItem(index, 'Descripcion', e.target.value)}
                  placeholder="Detalle del ítem (opcional)"
                />
              </div>
            </div>
          </div>
        ))}

        <button className="btn-add" onClick={addItem}>
          + Agregar ítem
        </button>

        <div className="form-footer">
          <button
            className="primary btn-lg"
            onClick={handleSendPress}
            disabled={loading || sinEmpresas}
          >
            {loading ? 'Enviando...' : 'Enviar pedido'}
          </button>
          {loading && <span className="spinner" />}
        </div>

        {error && (
          <div className="error-box">
            <div className="title">{error.title}</div>
            {error.detail && <div className="detail">{error.detail}</div>}
          </div>
        )}
      </div>

      <ConfirmModal
        visible={confirmVisible}
        title="¿Enviar el pedido?"
        payload={confirmVisible ? buildPayload() : null}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => {
          setConfirmVisible(false);
          await submitCompra();
        }}
      />
    </div>
  );
}
