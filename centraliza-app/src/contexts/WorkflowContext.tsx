import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import { onForeground } from '../lib/foreground';
import { useAuth } from './AuthContext';

type WorkflowEntry = {
  codigo: string;
  nombre: string;
  // TipoDocumento asignado al workflow — se envía como TransaccionSubtipoCodigo en el payload.
  subtipoCodigo?: string | null;
  subtipoNombre?: string;
};

type WorkflowSet = {
  compra: WorkflowEntry | null;
};

type WorkflowContextType = {
  workflow: WorkflowSet;
  loadingWorkflow: boolean;
  refreshWorkflow: () => Promise<void>;
};

const EMPTY: WorkflowSet = { compra: null };

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowSet>(EMPTY);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  const refreshWorkflow = async () => {
    if (!user?.token) {
      setWorkflow(EMPTY);
      return;
    }
    setLoadingWorkflow(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/my-workflow`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflow({ compra: data.compra ?? null });
      } else if (res.status === 401) {
        // Token expirado — cerrar sesión para re-autenticar
        await signOut();
      } else {
        console.error('Error loading workflow: HTTP', res.status);
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  // Al loguear
  useEffect(() => {
    refreshWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // Reintentar al volver al foreground (cubre fallas transitorias de red)
  useEffect(() => {
    if (!user?.token) return;
    return onForeground(() => refreshWorkflow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  return (
    <WorkflowContext.Provider value={{ workflow, loadingWorkflow, refreshWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used inside WorkflowProvider');
  }
  return context;
}
