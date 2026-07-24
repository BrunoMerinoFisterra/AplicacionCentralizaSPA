import { Link } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useSubmissions } from '../contexts/SubmissionsContext';

export function HomePage() {
  const { user } = useAuth();
  const {
    companies,
    selectedCompany,
    setSelectedCompanyByValue,
    loadingCompanies,
    loadError,
    refreshCompanies,
  } = useCompany();
  const { submissions } = useSubmissions();

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const errorCount = submissions.filter((s) => s.status === 'ERROR').length;

  return (
    <div className="page">
      <h1>Hola, {user?.fullName || user?.username}</h1>
      <p className="muted">Cargá pedidos de compra y envialos a Finnegans.</p>

      <div className="card">
        <h3>Empresa</h3>

        {!loadingCompanies && companies.length === 0 ? (
          loadError ? (
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
            <div className="note">
              Tu cuenta no tiene ninguna empresa habilitada, así que todavía no podés cargar
              pedidos. Pedile a un administrador que te habilite las empresas con las que vas a
              trabajar.
            </div>
          )
        ) : (
          <SearchableSelect
            label="Seleccioná la empresa con la que vas a trabajar"
            selectedValue={selectedCompany?.value ?? ''}
            options={companies}
            onValueChange={(value) => setSelectedCompanyByValue(value)}
            placeholder="Seleccionar empresa..."
            loading={loadingCompanies}
          />
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
