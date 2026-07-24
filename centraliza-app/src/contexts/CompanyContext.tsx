import { Preferences } from '@capacitor/preferences';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import { getFinnegansToken } from '../lib/get-finnegans-token';
import { useAuth } from './AuthContext';

export type CompanyOption = {
  label: string;
  value: string;
};

type CompanyContextType = {
  companies: CompanyOption[];
  selectedCompany: CompanyOption | null;
  setSelectedCompanyByValue: (value: string) => Promise<void>;
  clearSelectedCompany: () => Promise<void>;
  loadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const COMPANY_STORAGE_KEY = 'centraliza_selected_company';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const loadStoredCompanyValue = async () => {
    try {
      const { value } = await Preferences.get({ key: COMPANY_STORAGE_KEY });
      return value;
    } catch (error) {
      console.error('Error reading stored company:', error);
      return null;
    }
  };

  const clearSelectedCompany = async () => {
    try {
      await Preferences.remove({ key: COMPANY_STORAGE_KEY });
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error clearing selected company:', error);
    }
  };

  const refreshCompanies = async () => {
    if (!user?.token) return;
    try {
      setLoadingCompanies(true);

      const token = await getFinnegansToken(user.token);

      const response = await fetch(
        `https://api.finneg.com/api/empresaSucursal/list?ACCESS_TOKEN=${token}`
      );

      if (!response.ok) {
        throw new Error(`Company request failed: ${response.status}`);
      }

      const data = await response.json();

      // La respuesta de Finnegans varía de shape: probar data/rows/result/raíz
      const rows: Record<string, unknown>[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.result)
        ? data.result
        : [];

      const activeRows = rows.filter((item) => {
        const activo = item.activo ?? item.ACTIVO;
        return activo === true || activo === 'true' || activo === 1 || activo === '1';
      });

      const options: CompanyOption[] = activeRows
        .map((item) => ({
          label: String(
            item.nombre ?? item.NOMBRE ?? item.establecimiento ?? item.Establecimiento ??
            item.descripcion ?? item.Descripcion ?? item.codigo ?? item.CODIGO ?? ''
          ),
          value: String(
            item.codigo ?? item.CODIGO ?? item.empresaCodigo ?? item.EmpresaCodigo ??
            item.establecimientoCodigo ?? item.EstablecimientoCodigo ?? item.value ?? ''
          ),
        }))
        .filter((item) => item.label && item.value);

      // Filtrar por empresas asignadas; lista vacía = sin restricción
      let allowedCodes: string[] = [];
      try {
        const acRes = await fetch(`${API_BASE_URL}/auth/my-companies`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (acRes.ok) {
          const acData = await acRes.json();
          allowedCodes = acData.codes ?? [];
        }
      } catch {
        // sin restricción si el endpoint falla
      }

      const filtered =
        allowedCodes.length > 0 ? options.filter((c) => allowedCodes.includes(c.value)) : options;

      setCompanies(filtered);

      const storedValue = await loadStoredCompanyValue();
      if (storedValue) {
        const restored = filtered.find((company) => company.value === storedValue) || null;
        setSelectedCompany(restored);
      } else {
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const setSelectedCompanyByValue = async (value: string) => {
    const found = companies.find((company) => company.value === value) || null;
    setSelectedCompany(found);

    if (found) {
      await Preferences.set({ key: COMPANY_STORAGE_KEY, value: found.value });
    } else {
      await Preferences.remove({ key: COMPANY_STORAGE_KEY });
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompanyByValue,
        clearSelectedCompany,
        loadingCompanies,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used inside CompanyProvider');
  }
  return context;
}
