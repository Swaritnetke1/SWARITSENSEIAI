import { useState, useEffect, useRef } from 'react';
import { Brain, Lock, User, Shield, Eye, EyeOff, Headphones, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginUser, loginAdmin, logout, AuthUser } from '../lib/auth';
import { AdminPanel } from './AdminPanel';
import { SupportPanel } from './SupportPanel';

interface LoginScreenProps {
  onAuth: (user: AuthUser) => void;
  adminOnly?: boolean;
}

type Mode = 'user' | 'admin' | 'adminPanel';

function getControl(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function LoginScreen({ onAuth, adminOnly = false }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>(adminOnly ? 'admin' : 'user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminSession, setAdminSession] = useState<AuthUser | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [appName, setAppName] = useState('SwaritSensei');
  const [tagline, setTagline] = useState('Data-Driven Productivity');
  const [motd, setMotd] = useState('');
  const [motdEnabled, setMotdEnabled] = useState(true);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAppName(getControl('ss_app_name', 'SwaritSensei'));
    setTagline(getControl('ss_tagline', 'Data-Driven Productivity'));
    setMotd(getControl('ss_motd', ''));
    setMotdEnabled(localStorage.getItem('ss_motd_enabled') !== 'false');
    setTimeout(() => usernameRef.current?.focus(), 300);
  }, []);

  const clearError = () => setError('');

  const switchMode = (m: 'user' | 'admin') => {
    setMode(m);
    setUsername('');
    setPassword('');
    clearError();
    setTimeout(() => usernameRef.current?.focus(), 50);
  };

  const handleLogin = async () => {
    if (loading) return;
    clearError();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    // small delay so button press feels responsive
    await new Promise((r) => setTimeout(r, 300));

    if (mode === 'user') {
      const result = loginUser(username.trim(), password);
      setLoading(false);
      if (result) { onAuth(result); return; }
      setError('Wrong username or password. Please try again.');
    } else if (mode === 'admin') {
      const result = loginAdmin(username.trim(), password);
      setLoading(false);
      if (result) { setAdminSession(result); setMode('adminPanel'); return; }
      setError('Wrong Admin ID or password.');
    }
  };

  // ── Admin panel view ───────────────────────────────────────────────────────
  if (mode === 'adminPanel' && adminSession) {
    return (
      <AdminPanel
        adminUser={adminSession}
        onEnterDashboard={() => onAuth(adminSession)}
        onLogout={() => {
          logout();
          setAdminSession(null);
          setMode('admin');
          setUsername('');
          setPassword('');
          clearError();
        }}
      />
    );
  }

  const hasError = error.length > 0;

  const inputCls = [
    'w-full bg-white/5 border rounded-xl py-3 text-white placeholder:text-white/20 text-sm',
    'outline-none transition-all duration-200 focus:ring-0',
    hasError
      ? 'border-red-500/70 focus:border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
      : 'border-white/10 focus:border-purple-500/70 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)]',
  ].join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950 flex items-center justify-center p-4 dark">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,0.08),transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo block */}
        <div className="text-center mb-7">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-900/30"
          >
            <Brain className="w-9 h-9 text-purple-400" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            {adminOnly ? 'Admin Access' : appName}
          </h1>
          <p className="text-white/35 text-sm mt-1">
            {adminOnly ? 'Restricted — enter admin credentials' : tagline}
          </p>
        </div>

        {/* MOTD */}
        <AnimatePresence>
          {!adminOnly && motdEnabled && motd && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-purple-900/40 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-purple-200 text-center">
                {motd}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40 space-y-4">

          {/* Mode toggle — animated pill, zero vertical line artifact */}
          {!adminOnly && (
            <div className="relative flex p-1 bg-white/5 border border-white/8 rounded-xl">
              <motion.span
                className="absolute inset-y-1 rounded-[10px] bg-purple-600 shadow-lg shadow-purple-900/40"
                style={{ width: 'calc(50% - 4px)', left: 4 }}
                animate={{ x: mode === 'user' ? 0 : 'calc(100% + 0px)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
              {(['user', 'admin'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-[10px] transition-colors duration-150 ${
                    mode === m ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {m === 'user' ? <User className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {m === 'user' ? 'User Login' : 'Admin'}
                </button>
              ))}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest pl-1">
              {mode === 'admin' ? 'Admin ID' : 'Username'}
            </label>
            <div className="relative">
              <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${hasError ? 'text-red-400/70' : 'text-white/25'}`} />
              <input
                ref={usernameRef}
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError(); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={mode === 'admin' ? 'Admin ID' : 'Username'}
                autoComplete="username"
                spellCheck={false}
                className={`${inputCls} pl-10 pr-4`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest pl-1">Password</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${hasError ? 'text-red-400/70' : 'text-white/25'}`} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                autoComplete="current-password"
                className={`${inputCls} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors p-0.5"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Inline error banner */}
          <AnimatePresence>
            {hasError && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm flex-1 leading-snug">{error}</p>
                  <button onClick={clearError} className="text-red-400/50 hover:text-red-300 transition-colors shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign-in button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-purple-900/30"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full inline-block"
                  />
                  Signing in…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {mode === 'admin' ? 'Access Admin Panel' : 'Sign In'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Support button */}
        {!adminOnly && (
          <button
            onClick={() => setShowSupport(true)}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 text-white/40 hover:text-white/70 text-sm font-medium transition-all"
          >
            <Headphones className="w-4 h-4 text-purple-400/70" />
            Support & Contact
          </button>
        )}

        <p className="text-center text-white/15 text-xs mt-4">
          SwaritSensei · Local-first · Offline-ready
        </p>
      </motion.div>

      <AnimatePresence>
        {showSupport && <SupportPanel onClose={() => setShowSupport(false)} />}
      </AnimatePresence>
    </div>
  );
}
