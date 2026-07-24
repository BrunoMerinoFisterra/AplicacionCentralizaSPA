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
};

const createEmptyItem = (): CompraItem => ({
  ProductoCodigo: '',
  Cantidad: '',
  Descripcion: '',
});

export function PedidoCompraPage() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
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
      const response = await fetch(
        `https://api.finneg.com/api/reports/PRODUCTOSCOMPRAAPI?ACCESS_TOKEN=${token}`
      );
      if (!response.ok) throw new Error(`PRODUCTOSCOMPRAAPI request failed: ${response.status}`);
      const data = await response.json();
      // El SP ya filtra activos y comprables del lado del servidor.
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: Record<string, unknown>) => ({
          label: String(
            item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.DESCRIPCION ?? item.descripcion ??
            item.CODIGO ?? item.Codigo ?? item.codigo ?? ''
          ).trim(),
          value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
        }))
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
      })),
    }) as object;

  const handleSendPress = () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Inicio antes de enviar.' });
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
      <h1>Pedido de Compra</h1>
      <p className="muted">{selectedCompany ? selectedCompany.label : 'Sin empresa seleccionada'}</p>

      <div className="card">
        <h3>Datos del pedido</h3>
        <div className="field">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="field">
          <label>Descripción</label>
          <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <h3>Ítems</h3>
        {items.map((item, index) => (
          <div key={index} className="mini-card">
            <strong>Ítem {index + 1}</strong>
            <SearchableSelect
              label="Producto"
              selectedValue={item.ProductoCodigo}
              options={productoOptions}
              onValueChange={(value) => updateItem(index, 'ProductoCodigo', value)}
              placeholder="Seleccionar producto..."
              loading={loadingProductos}
            />
            <div className="field">
              <label>Cantidad</label>
              <input
                type="number"
                inputMode="decimal"
                value={item.Cantidad}
                onChange={(e) => updateItem(index, 'Cantidad', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Descripción</label>
              <input
                type="text"
                value={item.Descripcion}
                onChange={(e) => updateItem(index, 'Descripcion', e.target.value)}
              />
            </div>
            <div className="btn-row">
              <button onClick={addItem}>Agregar ítem</button>
              {items.length > 1 && (
                <button className="danger" onClick={() => removeItem(index)}>
                  Quitar ítem
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="btn-row">
          <button className="primary" onClick={handleSendPress} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar'}
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
