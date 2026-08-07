import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/guards';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { SubmissionsProvider } from './contexts/SubmissionsContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { AdminPage } from './pages/AdminPage';
import { EnviosPage } from './pages/EnviosPage';
import { GuiaPage } from './pages/GuiaPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PedidoCompraPage } from './pages/PedidoCompraPage';

// Mismo orden de providers que FSTrack: Auth > Company > Workflow > Submissions
function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <WorkflowProvider>
          <SubmissionsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<RequireAuth />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pedido-compra" element={<PedidoCompraPage />} />
                    <Route path="/envios" element={<EnviosPage />} />
                    <Route path="/guia" element={<GuiaPage />} />
                    <Route element={<RequireAdmin />}>
                      <Route path="/admin" element={<AdminPage />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </SubmissionsProvider>
        </WorkflowProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
