// Cola offline de envíos: PENDING → SENT | ERROR.
// A diferencia de FSTrack (donde la web era un stub), acá la cola funciona
// en ambas plataformas: SQLite en Android, IndexedDB en el navegador.
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { openDB, type IDBPDatabase } from 'idb';

export type FormType = 'PEDIDO_COMPRA';
export type SubmissionStatus = 'PENDING' | 'SENT' | 'ERROR';

export type Submission = {
  id: number;
  form_type: FormType;
  payload: string;
  status: SubmissionStatus;
  company_label: string | null;
  created_at: string;
  sent_at: string | null;
  error_detail: string | null;
};

interface LocalDB {
  init(): Promise<void>;
  add(form_type: FormType, payload: string, company_label: string | null): Promise<number>;
  updatePayload(id: number, payload: string): Promise<void>;
  markSent(id: number): Promise<void>;
  markError(id: number, error_detail: string): Promise<void>;
  getPending(): Promise<Submission[]>;
  getAll(): Promise<Submission[]>;
}

// ---------- Web: IndexedDB ----------

class WebDB implements LocalDB {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    this.db = await openDB('centraliza', 1, {
      upgrade(db) {
        const store = db.createObjectStore('submissions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status');
        store.createIndex('created_at', 'created_at');
      },
    });
  }

  private get idb(): IDBPDatabase {
    if (!this.db) throw new Error('DB no inicializada');
    return this.db;
  }

  async add(form_type: FormType, payload: string, company_label: string | null): Promise<number> {
    const id = await this.idb.add('submissions', {
      form_type,
      payload,
      status: 'PENDING',
      company_label,
      created_at: new Date().toISOString(),
      sent_at: null,
      error_detail: null,
    });
    return id as number;
  }

  private async patch(id: number, changes: Partial<Submission>): Promise<void> {
    const row = await this.idb.get('submissions', id);
    if (!row) return;
    await this.idb.put('submissions', { ...row, ...changes });
  }

  async updatePayload(id: number, payload: string): Promise<void> {
    await this.patch(id, { payload });
  }

  async markSent(id: number): Promise<void> {
    await this.patch(id, { status: 'SENT', sent_at: new Date().toISOString() });
  }

  async markError(id: number, error_detail: string): Promise<void> {
    await this.patch(id, { status: 'ERROR', error_detail });
  }

  async getPending(): Promise<Submission[]> {
    const rows: Submission[] = await this.idb.getAllFromIndex('submissions', 'status', 'PENDING');
    return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async getAll(): Promise<Submission[]> {
    const rows: Submission[] = await this.idb.getAll('submissions');
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
  }
}

// ---------- Android/iOS: SQLite ----------

class NativeDB implements LocalDB {
  private db: SQLiteDBConnection | null = null;

  async init(): Promise<void> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection('centraliza', false)).result;
    this.db =
      ret.result && isConn
        ? await sqlite.retrieveConnection('centraliza', false)
        : await sqlite.createConnection('centraliza', false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        form_type     TEXT NOT NULL,
        payload       TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'PENDING',
        company_label TEXT,
        created_at    TEXT NOT NULL,
        sent_at       TEXT,
        error_detail  TEXT
      );
    `);
  }

  private get conn(): SQLiteDBConnection {
    if (!this.db) throw new Error('DB no inicializada');
    return this.db;
  }

  async add(form_type: FormType, payload: string, company_label: string | null): Promise<number> {
    const result = await this.conn.run(
      `INSERT INTO submissions (form_type, payload, status, company_label, created_at)
       VALUES (?, ?, 'PENDING', ?, ?)`,
      [form_type, payload, company_label, new Date().toISOString()]
    );
    return result.changes?.lastId ?? 0;
  }

  async updatePayload(id: number, payload: string): Promise<void> {
    await this.conn.run(`UPDATE submissions SET payload = ? WHERE id = ?`, [payload, id]);
  }

  async markSent(id: number): Promise<void> {
    await this.conn.run(`UPDATE submissions SET status = 'SENT', sent_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }

  async markError(id: number, error_detail: string): Promise<void> {
    await this.conn.run(`UPDATE submissions SET status = 'ERROR', error_detail = ? WHERE id = ?`, [
      error_detail,
      id,
    ]);
  }

  async getPending(): Promise<Submission[]> {
    const res = await this.conn.query(
      `SELECT * FROM submissions WHERE status = 'PENDING' ORDER BY created_at ASC`
    );
    return (res.values ?? []) as Submission[];
  }

  async getAll(): Promise<Submission[]> {
    const res = await this.conn.query(
      `SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100`
    );
    return (res.values ?? []) as Submission[];
  }
}

// ---------- API pública (misma firma que utils/local-db de FSTrack) ----------

const impl: LocalDB = Capacitor.isNativePlatform() ? new NativeDB() : new WebDB();

export const initDB = () => impl.init();
export const addSubmission = (form_type: FormType, payload: string, company_label: string | null) =>
  impl.add(form_type, payload, company_label);
export const updateSubmissionPayload = (id: number, payload: string) =>
  impl.updatePayload(id, payload);
export const markSent = (id: number) => impl.markSent(id);
export const markError = (id: number, error_detail: string) => impl.markError(id, error_detail);
export const getPending = () => impl.getPending();
export const getAll = () => impl.getAll();
