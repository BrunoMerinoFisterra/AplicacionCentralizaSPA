import { Link } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useSubmissions } from '../contexts/SubmissionsContext';

export function HomePage() {
  const { user } = useAuth();
  const { companies, selectedCompany, setSelectedCompanyByValue, loadingCompanies, refreshCompanies } =
    useCompany();
  const { submissions } = useSubmissions();

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const errorCount = submissions.filter((s) => s.status === 'ERROR').length;

  return (
    <div className="page">
      <h1>Hola, {user?.fullName || user?.username}</h1>
      <p className="muted">Cargá pedidos de compra y envialos a Finnegans.</p>

      <div className="card">
        <h3>Empresa</h3>
        <SearchableSelect
          label="Seleccioná la empresa con la que vas a trabajar"
          selectedValue={selectedCompany?.value ?? ''}
          options={companies}
          onValueChange={(value) => setSelectedCompanyByValue(value)}
          placeholder="Seleccionar empresa..."
          loading={loadingCompanies}
        />
        {!loadingCompanies && companies.length === 0 && (
          <p className="muted">
            No se pudieron cargar las empresas.{' '}
            <button className="link" onClick={() => refreshCompanies()}>
              Reintentar
            </button>
          </p>
        )}
      </div>

      <div className="card">
        <h3>Accesos</h3>
        <div className="btn-row">
          <Link to="/pedido-compra">
            <button className="primary" disabled={!selectedCompany}>
              Nuevo Pedido de Compra
            </button>
          </Link>
          <Link to="/envios">
            <button>
              Envíos
              {pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}
              {errorCount > 0 ? ` · ${errorCount} con error` : ''}
            </button>
          </Link>
        </div>
        {!selectedCompany && <p className="muted">Seleccioná una empresa para cargar pedidos.</p>}
      </div>
    </div>
  );
}
