import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from './Footer';
import { Logo } from './Logo';

export function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="navbar">
        <span className="brand">
          <Logo size="sm" />
        </span>
        <NavLink to="/" end>
          Inicio
        </NavLink>
        <NavLink to="/pedido-compra">Pedido de Compra</NavLink>
        <NavLink to="/envios">Envíos</NavLink>
        {isAdmin && <NavLink to="/admin">Administración</NavLink>}
        {/* Las dos guías van juntas al final: el admin ve ambas */}
        <NavLink to="/guia">Guía</NavLink>
        {isAdmin && <NavLink to="/guia-admin">Guía Admin</NavLink>}
        <span className="spacer" />
        <span className="user-chip">{user?.fullName || user?.username}</span>
        <button className="link" onClick={handleSignOut}>
          Salir
        </button>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
