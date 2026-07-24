import { useCallback, useEffect, useState } from 'react';
import { SearchableSelect, type SelectOption } from '../components/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/api';

type AdminUser = {
  id: number;
  username: string;
  full_name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  workflow_compra_codigo: string | null;
  workflow_compra_nombre: string | null;
  tipodoc_compra_codigo: string | null;
  tipodoc_compra_nombre: string | null;
  created_at: string;
};

type LogRow = {
  id: number;
  username: string | null;
  form_type: string;
  company_label: string | null;
  status: string;
  error_detail: string | null;
  created_at: string;
};

function useAdminApi() {
  const { user } = useAuth();
  return useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(`${API_BASE_URL}/admin${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
          ...(init?.headers ?? {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error HTTP ${res.status}`);
      return data;
    },
    [user?.token]
  );
}

// ---------- Tab: Usuarios ----------

function UsersTab() {
  const api = useAdminApi();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/users');
      setUsers(data.users);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (u: AdminUser) => {
    try {
      await api(`/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button className="primary" onClick={() => setCreating(true)}>
          Nuevo usuario
        </button>
        <button onClick={load}>Actualizar</button>
      </div>

      {error && (
        <div className="error-box">
          <div className="title">{error}</div>
        </div>
      )}

      {loading ? (
        <span className="spinner" />
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Workflow compra</th>
                <th>Tipo doc.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.full_name ?? '—'}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'SENT' : 'ERROR'}`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{u.workflow_compra_nombre ?? '—'}</td>
                  <td>{u.tipodoc_compra_nombre ?? '—'}</td>
                  <td>
                    <div className="btn-row" style={{ marginTop: 0 }}>
                      <button className="link" onClick={() => setEditing(u)}>
                        Editar
                      </button>
                      <button className="link" onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <UserFormModal
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}
      {editing && (
        <UserEditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </>
  );
}

function UserFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const api = useAdminApi();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Usuario y contraseña son requeridos.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, full_name: fullName || null, role }),
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo usuario</h3>
        <div className="field">
          <label>Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Nombre completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {error && (
          <div className="error-box">
            <div className="title">{error}</div>
          </div>
        )}
        <div className="btn-row">
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function UserEditModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const api = useAdminApi();
  const [fullName, setFullName] = useState(user.full_name ?? '');
  const [role, setRole] = useState<'admin' | 'user'>(user.role);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Empresas
  const [companies, setCompanies] = useState<SelectOption[]>([]);
  const [assignedCodes, setAssignedCodes] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Workflow
  const [workflows, setWorkflows] = useState<SelectOption[]>([]);
  const [tipos, setTipos] = useState<SelectOption[]>([]);
  const [wfCodigo, setWfCodigo] = useState(user.workflow_compra_codigo ?? '');
  const [tdCodigo, setTdCodigo] = useState(user.tipodoc_compra_codigo ?? '');
  const [loadingWf, setLoadingWf] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [companiesData, codesData] = await Promise.all([
          api('/finnegans-companies'),
          api(`/users/${user.id}/companies`),
        ]);
        setCompanies(companiesData.companies ?? []);
        setAssignedCodes(codesData.codes ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingCompanies(false);
      }
      try {
        const [wfData, tdData] = await Promise.all([
          api('/finnegans-workflows'),
          api('/finnegans-tipos-documento'),
        ]);
        setWorkflows(wfData.workflows ?? []);
        setTipos(tdData.tipos ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingWf(false);
      }
    })();
  }, [api, user.id]);

  const toggleCompany = (code: string) => {
    setAssignedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = { full_name: fullName || null, role };
      if (newPassword.trim()) patch.password = newPassword;
      await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      await api(`/users/${user.id}/companies`, {
        method: 'POST',
        body: JSON.stringify({ codes: assignedCodes }),
      });
      const wf = workflows.find((w) => w.value === wfCodigo) ?? null;
      const td = tipos.find((t) => t.value === tdCodigo) ?? null;
      await api(`/users/${user.id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({
          workflow_codigo: wf?.value ?? null,
          workflow_nombre: wf?.label ?? null,
          tipodoc_codigo: td?.value ?? null,
          tipodoc_nombre: td?.label ?? null,
        }),
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar: {user.username}</h3>

        <div className="field">
          <label>Nombre completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="field">
          <label>Nueva contraseña (dejar vacío para no cambiar)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <h3 style={{ marginTop: '1rem' }}>Empresas asignadas</h3>
        <p className="muted">Sin selección = acceso a todas las empresas.</p>
        {loadingCompanies ? (
          <span className="spinner" />
        ) : (
          <div className="mini-card" style={{ maxHeight: 180, overflowY: 'auto' }}>
            {companies.map((c) => (
              <label key={c.value} style={{ display: 'block', padding: '0.2rem 0' }}>
                <input
                  type="checkbox"
                  checked={assignedCodes.includes(c.value)}
                  onChange={() => toggleCompany(c.value)}
                />{' '}
                {c.label}
              </label>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: '1rem' }}>Workflow de compra</h3>
        {loadingWf ? (
          <span className="spinner" />
        ) : (
          <>
            <SearchableSelect
              label="Workflow"
              selectedValue={wfCodigo}
              options={workflows}
              onValueChange={setWfCodigo}
              placeholder="Seleccionar workflow..."
            />
            <SearchableSelect
              label="Tipo de documento"
              selectedValue={tdCodigo}
              options={tipos}
              onValueChange={setTdCodigo}
              placeholder="Seleccionar tipo de documento..."
            />
          </>
        )}

        {error && (
          <div className="error-box">
            <div className="title">{error}</div>
          </div>
        )}
        <div className="btn-row">
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab: Logs ----------

function LogsTab() {
  const api = useAdminApi();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/logs');
      setLogs(data.logs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button onClick={load}>Actualizar</button>
      </div>
      {error && (
        <div className="error-box">
          <div className="title">{error}</div>
        </div>
      )}
      {loading ? (
        <span className="spinner" />
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Formulario</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('es-AR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>{log.username ?? '—'}</td>
                  <td>{log.form_type}</td>
                  <td>{log.company_label ?? '—'}</td>
                  <td>
                    <span className={`badge ${log.status === 'SUCCESS' ? 'SENT' : 'ERROR'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: 340, wordBreak: 'break-word' }}>
                    {log.error_detail ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------- Página ----------

export function AdminPage() {
  const [tab, setTab] = useState<'users' | 'logs'>('users');

  return (
    <div className="page wide">
      <h1>Administración</h1>
      <div className="tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Usuarios
        </button>
        <button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>
          Logs
        </button>
      </div>
      {tab === 'users' ? <UsersTab /> : <LogsTab />}
    </div>
  );
}
