export type Role = 'user' | 'admin';

export interface AuthUser {
  username: string;
  role: Role;
}

const STORAGE_KEY = 'ss_auth_users_v3';
const SESSION_KEY = 'ss_session';

const DEFAULT_USERS = [
  { username: 'demo0', password: 'demo00', role: 'user' as Role },
];
const ADMIN = { id: 'Swarit3236', password: 'swaritnetke..' };

export function getStoredUsers(): { username: string; password: string; role: Role }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...DEFAULT_USERS];
  } catch {
    return [...DEFAULT_USERS];
  }
}

export function saveStoredUsers(users: { username: string; password: string; role: Role }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function addUser(username: string, password: string): boolean {
  const users = getStoredUsers();
  if (users.find((u) => u.username === username)) return false;
  users.push({ username, password, role: 'user' });
  saveStoredUsers(users);
  return true;
}

export function removeUser(username: string) {
  const users = getStoredUsers().filter((u) => u.username !== username);
  saveStoredUsers(users);
}

function appendLog(username: string, type: 'user' | 'admin', success: boolean) {
  try {
    const raw = localStorage.getItem('ss_login_logs');
    const logs: unknown[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ts: new Date().toISOString(), username, type, success });
    // keep last 200 attempts
    localStorage.setItem('ss_login_logs', JSON.stringify(logs.slice(0, 200)));
  } catch { /* non-critical */ }
}

export function loginUser(username: string, password: string): AuthUser | null {
  const users = getStoredUsers();
  const match = users.find((u) => u.username === username && u.password === password);
  appendLog(username, 'user', !!match);
  if (!match) return null;
  const session: AuthUser = { username: match.username, role: match.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loginAdmin(id: string, password: string): AuthUser | null {
  const ok = id === ADMIN.id && password === ADMIN.password;
  appendLog(id, 'admin', ok);
  if (!ok) return null;
  const session: AuthUser = { username: id, role: 'admin' };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
