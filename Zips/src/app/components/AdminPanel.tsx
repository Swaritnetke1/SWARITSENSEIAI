import { useState, useEffect } from 'react';
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users,
  Headphones, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  RefreshCw, Lock, Eye, EyeOff, Settings, FileText,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addUser, removeUser, getStoredUsers, AuthUser } from '../lib/auth';
import {
  getSupportItems, saveSupportItems, resetSupportItems,
  SupportItem, SupportIcon,
} from '../lib/support';
import { IconFor, ICON_COLORS } from './SupportPanel';
import { toast } from 'sonner';

type AdminTab = 'users' | 'support' | 'controls' | 'logs';

const ICON_OPTIONS: SupportIcon[] = [
  'telegram', 'whatsapp', 'instagram', 'phone', 'email',
  'message', 'gift', 'group', 'youtube', 'twitter', 'link',
];

const ICON_LABEL: Record<SupportIcon, string> = {
  telegram: 'Telegram', whatsapp: 'WhatsApp', instagram: 'Instagram',
  phone: 'Phone/Call', email: 'Email', message: 'Message',
  gift: 'Gift', group: 'Group', youtube: 'YouTube', twitter: 'X/Twitter', link: 'Link',
};

interface AdminPanelProps {
  adminUser: AuthUser;
  onEnterDashboard: () => void;
  onLogout: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getLS(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function setLS(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

// ── Users Tab ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState(getStoredUsers);
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const refresh = () => setUsers(getStoredUsers());

  const handleAdd = () => {
    if (!form.username.trim() || !form.password.trim()) { toast.error('Fill both fields'); return; }
    if (!addUser(form.username.trim(), form.password)) { toast.error('Username already taken'); return; }
    toast.success(`User "${form.username}" created`);
    setForm({ username: '', password: '' });
    refresh();
  };

  const handleRemove = (u: string) => {
    removeUser(u); refresh();
    toast.success(`"${u}" removed`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Create User</p>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors"
        />
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors"
          />
          <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-bold transition-colors active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Users ({users.length})</p>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {users.map((u) => (
            <div key={u.username} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <span className="text-white text-sm font-semibold">{u.username}</span>
                <span className="ml-2 text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{u.role}</span>
              </div>
              <button onClick={() => handleRemove(u.username)}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-white/25 text-xs text-center py-4">No users yet</p>}
        </div>
      </div>
    </div>
  );
}

// ── Support Tab ───────────────────────────────────────────────────────────
function SupportTab() {
  const [items, setItems] = useState<SupportItem[]>(() =>
    getSupportItems().sort((a, b) => a.order - b.order)
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState<Partial<SupportItem>>({ icon: 'telegram', label: '', value: '', hint: '', enabled: true });

  const save = (updated: SupportItem[]) => {
    const reordered = updated.map((it, i) => ({ ...it, order: i }));
    saveSupportItems(reordered);
    setItems(reordered);
  };

  const toggleEnabled = (id: string) => save(items.map((it) => it.id === id ? { ...it, enabled: !it.enabled } : it));
  const moveUp = (idx: number) => { if (idx === 0) return; const n = [...items]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; save(n); };
  const moveDown = (idx: number) => { if (idx === items.length - 1) return; const n = [...items]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; save(n); };
  const deleteItem = (id: string) => { save(items.filter((it) => it.id !== id)); toast.success('Removed'); };
  const startEdit = (it: SupportItem) => { setEditId(it.id); setForm({ ...it }); setAddMode(false); };
  const startAdd = () => { setForm({ icon: 'telegram', label: '', value: '', hint: '', enabled: true }); setAddMode(true); setEditId(null); };

  const commitEdit = () => {
    if (!form.label?.trim() || !form.value?.trim()) { toast.error('Label and URL required'); return; }
    if (addMode) {
      save([...items, { id: `item_${Date.now()}`, icon: form.icon ?? 'link', label: form.label!.trim(), value: form.value!.trim(), hint: form.hint?.trim(), enabled: form.enabled ?? true, order: items.length }]);
      toast.success('Item added');
    } else {
      save(items.map((it) => it.id === editId ? { ...it, ...form } as SupportItem : it));
      toast.success('Updated');
    }
    setEditId(null); setAddMode(false);
  };

  const editing = addMode || editId !== null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-purple-950/40 border border-purple-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">{addMode ? 'New Item' : 'Edit Item'}</p>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((ic) => (
                  <button key={ic} onClick={() => setForm({ ...form, icon: ic })} title={ICON_LABEL[ic]}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${form.icon === ic ? ICON_COLORS[ic] + ' scale-110' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                    <IconFor icon={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
              {(['label', 'value', 'hint'] as const).map((f) => (
                <input key={f} placeholder={f === 'label' ? 'Label' : f === 'value' ? 'URL / phone / email' : 'Hint (optional)'}
                  value={(form[f] as string) ?? ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors" />
              ))}
              <div className="flex gap-2">
                <button onClick={commitEdit} className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-bold">
                  <Save className="w-3.5 h-3.5" /> {addMode ? 'Add' : 'Save'}
                </button>
                <button onClick={() => { setEditId(null); setAddMode(false); }} className="px-4 border border-white/10 text-white/50 hover:text-white rounded-lg text-sm transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!editing && (
        <div className="flex gap-2">
          <button onClick={startAdd} className="flex-1 flex items-center justify-center gap-2 border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 rounded-xl py-2.5 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button onClick={() => { resetSupportItems(); setItems(getSupportItems()); toast.success('Reset to defaults'); }}
            className="px-3 border border-white/10 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((it, idx) => (
          <div key={it.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${it.enabled ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${ICON_COLORS[it.icon]}`}>
              <IconFor icon={it.icon} className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{it.label}</p>
              <p className="text-xs text-white/30 truncate">{it.hint || it.value}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => moveUp(idx)} className="p-1 text-white/20 hover:text-white rounded transition-colors"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => moveDown(idx)} className="p-1 text-white/20 hover:text-white rounded transition-colors"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => startEdit(it)} className="p-1 text-white/30 hover:text-white rounded transition-colors"><Edit3 className="w-3 h-3" /></button>
              <button onClick={() => toggleEnabled(it.id)} className={`p-1 rounded transition-colors ${it.enabled ? 'text-green-400' : 'text-white/20 hover:text-white'}`}>
                {it.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteItem(it.id)} className="p-1 text-white/20 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-white/25 text-xs py-4">No items. Add one above.</p>}
      </div>
    </div>
  );
}

// ── Controls Tab ──────────────────────────────────────────────────────────
function ControlsTab() {
  const [appName, setAppName] = useState(() => getLS('ss_app_name', 'SwaritSensei'));
  const [tagline, setTagline] = useState(() => getLS('ss_tagline', 'Data-Driven Productivity'));
  const [motdEnabled, setMotdEnabled] = useState(() => localStorage.getItem('ss_motd_enabled') !== 'false');
  const [motd, setMotd] = useState(() => getLS('ss_motd', ''));
  const [allowSignup, setAllowSignup] = useState(() => localStorage.getItem('ss_allow_signup') !== 'false');

  const save = (key: string, val: string) => { setLS(key, val); toast.success('Saved'); };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Branding</p>
        {[
          { label: 'App Name', val: appName, set: setAppName, key: 'ss_app_name' },
          { label: 'Tagline', val: tagline, set: setTagline, key: 'ss_tagline' },
        ].map(({ label, val, set, key }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs text-white/40">{label}</label>
            <div className="flex gap-2">
              <input value={val} onChange={(e) => set(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors" />
              <button onClick={() => save(key, val)} className="px-3 bg-purple-600/60 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors">Save</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Login Message</p>
          <button onClick={() => { const n = !motdEnabled; setMotdEnabled(n); setLS('ss_motd_enabled', String(n)); }}>
            {motdEnabled ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-white/30" />}
          </button>
        </div>
        <textarea value={motd} onChange={(e) => setMotd(e.target.value)} rows={2}
          placeholder="Message shown on the login screen…"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 outline-none focus:border-purple-500 resize-none transition-colors" />
        <button onClick={() => save('ss_motd', motd)} className="w-full bg-purple-600/60 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">
          Save Message
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Access</p>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-white font-medium">Allow new sign-ups</p>
            <p className="text-xs text-white/30 mt-0.5">Users can create accounts from the login screen</p>
          </div>
          <button onClick={() => { const n = !allowSignup; setAllowSignup(n); setLS('ss_allow_signup', String(n)); }}>
            {allowSignup ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
          </button>
        </div>
      </div>

      <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
        <p className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-2">Danger Zone</p>
        <button
          onClick={() => {
            if (!confirm('Clear all local data? This logs everyone out and resets the app.')) return;
            localStorage.clear();
            window.location.reload();
          }}
          className="w-full py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Clear All Data & Reload
        </button>
      </div>
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────
interface LogEntry { ts: string; username: string; type: 'user' | 'admin'; success: boolean; }

function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ss_login_logs');
      setLogs(raw ? JSON.parse(raw) : []);
    } catch { setLogs([]); }
  }, []);

  const clear = () => {
    localStorage.removeItem('ss_login_logs');
    setLogs([]);
    toast.success('Logs cleared');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
          Login Attempts ({logs.length})
        </p>
        {logs.length > 0 && (
          <button onClick={clear} className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-8 h-8 mx-auto text-white/10 mb-2" />
          <p className="text-white/25 text-sm">No login attempts recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
          {logs.map((l, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${l.success ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
              {l.success
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{l.username}</p>
                <p className="text-xs text-white/35">
                  {new Date(l.ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })} · {l.type}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold shrink-0 ${l.success ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20' : 'bg-red-600/20 text-red-300 border-red-500/20'}`}>
                {l.success ? '✓ OK' : '✗ Fail'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
const TABS: { id: AdminTab; label: string; Icon: typeof Users }[] = [
  { id: 'users',    label: 'Users',    Icon: Users },
  { id: 'support',  label: 'Support',  Icon: Headphones },
  { id: 'controls', label: 'Controls', Icon: Settings },
  { id: 'logs',     label: 'Logs',     Icon: FileText },
];

export function AdminPanel({ adminUser, onEnterDashboard, onLogout }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('users');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950 dark flex items-start justify-center p-4 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg space-y-5 pb-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-600/25 border border-purple-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Admin Panel</h1>
              <p className="text-xs text-white/35">{adminUser.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEnterDashboard}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
              Dashboard →
            </button>
            <button onClick={onLogout}
              className="px-3 py-1.5 border border-white/10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl text-xs transition-colors"
              title="Logout">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-[10px] text-xs font-bold transition-all ${
                tab === id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'users'    && <UsersTab />}
            {tab === 'support'  && <SupportTab />}
            {tab === 'controls' && <ControlsTab />}
            {tab === 'logs'     && <LogsTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
