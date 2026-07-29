import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from './Footer';
import { Logo } from './Logo';

export function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="navbar">
        <span className="brand">
          <Logo size="sm" />
        </span>

        <button
          className="nav-toggle"
          aria-label="Menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-toggle-bars" />
        </button>

        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>
            Inicio
          </NavLink>
          <NavLink to="/pedido-compra" onClick={closeMenu}>
            Pedido de Compra
          </NavLink>
          <NavLink to="/envios" onClick={closeMenu}>
            Envíos
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Administración
            </NavLink>
          )}
          {/* Las dos guías van juntas al final: el admin ve ambas */}
          <NavLink to="/guia" onClick={closeMenu}>
            Guía
          </NavLink>
          {isAdmin && (
            <NavLink to="/guia-admin" onClick={closeMenu}>
              Guía Admin
            </NavLink>
          )}
          <span className="spacer" />
          <span className="user-chip">{user?.fullName || user?.username}</span>
          <button className="link" onClick={handleSignOut}>
            Salir
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
