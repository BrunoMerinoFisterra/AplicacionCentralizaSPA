import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useSubmissions } from '../contexts/SubmissionsContext';

export function HomePage() {
  const { user, isAdmin } = useAuth();
  const { companies, loadingCompanies, loadError } = useCompany();
  const { submissions } = useSubmissions();

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const errorCount = submissions.filter((s) => s.status === 'ERROR').length;

  const sinEmpresas = !loadingCompanies && !loadError && companies.length === 0;

  return (
    <div className="page">
      <h1>Hola, {user?.fullName || user?.username}</h1>
      <p className="muted">Cargá pedidos de compra y envialos a Finnegans.</p>

      <div className="home-brand">
        <Logo size="lg" />
      </div>

      {sinEmpresas && (
        <div className="note">
          Tu cuenta no tiene ninguna empresa habilitada, así que todavía no podés cargar pedidos.
          Pedile a un administrador que te habilite las empresas con las que vas a trabajar.
        </div>
      )}

      <div className="tile-grid">
        <Link className="tile" to="/pedido-compra">
          <span className="tile-title">Nuevo Pedido de Compra</span>
          <span className="tile-desc">Cargar un pedido y enviarlo a Finnegans</span>
        </Link>

        <Link className="tile" to="/envios">
          <span className="tile-title">
            Envíos
            {pendingCount > 0 && <span className="badge PENDING">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>}
            {errorCount > 0 && <span className="badge ERROR">{errorCount} con error</span>}
          </span>
          <span className="tile-desc">Historial y estado de tus pedidos</span>
        </Link>

        <Link className="tile" to="/guia">
          <span className="tile-title">Guía de uso</span>
          <span className="tile-desc">Cómo cargar un pedido paso a paso</span>
        </Link>

        {isAdmin && (
          <>
            <Link className="tile" to="/admin">
              <span className="tile-title">Administración</span>
              <span className="tile-desc">Gestionar usuarios y revisar logs</span>
            </Link>
            <Link className="tile" to="/guia-admin">
              <span className="tile-title">Guía del administrador</span>
              <span className="tile-desc">Cómo usar el panel de administración</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
