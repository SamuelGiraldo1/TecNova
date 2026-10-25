import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, User as UserIcon, KeyRound, AlertTriangle, CheckCircle, Sparkles, Mail, UserPlus, Server } from 'lucide-react';
import { AuthService } from '../services/auth';
import { User } from '../types/inventory';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [username, setUsername] = useState('admin@tecnova.com');
  const [password, setPassword] = useState('Admin123!');
  
  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'cajero'>('cajero');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>('Verificando 3 Capas...');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.estado === 'ONLINE') {
          setBackendStatus(`3 Capas ONLINE (React ⇄ Express ⇄ MySQL)`);
        } else {
          setBackendStatus('Servidor API en modo local');
        }
      })
      .catch(() => setBackendStatus('Modo Offline / LocalStorage'));
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (isRegisterTab) {
      // Process registration
      try {
        const res = await AuthService.register(regName, regEmail, regPassword, regRole);
        setIsLoading(false);
        if (res.success) {
          setSuccessMsg('✅ Cuenta registrada exitosamente. Ahora puedes ingresar.');
          setIsRegisterTab(false);
          setUsername(regEmail);
          setPassword(regPassword);
        } else {
          setError(res.mensaje || 'Error al registrar.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Error de red.');
      }
      return;
    }

    // Process login
    try {
      const res = await AuthService.login(username, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciales inválidas.');
        if (res.remainingLockoutSeconds) {
          setLockoutSeconds(res.remainingLockoutSeconds);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError('Error al procesar el inicio de sesión.');
    }
  };

  const handleQuickFill = (userType: 'admin' | 'cajero') => {
    setIsRegisterTab(false);
    if (userType === 'admin') {
      setUsername('admin@tecnova.com');
      setPassword('Admin123!');
    } else {
      setUsername('cajero@tecnova.com');
      setPassword('Cajero123!');
    }
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="inline-flex items-center justify-center p-3.5 bg-white/10 rounded-2xl backdrop-blur-md mb-2 border border-white/20 shadow-inner">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">TecNova</h2>
          <p className="text-xs text-indigo-100 font-medium mt-0.5">Control Integral de Inventario & Facturación</p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/40 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Sistema en Línea
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => { setIsRegisterTab(false); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegisterTab 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión (Login)
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterTab(true); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegisterTab 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Cuenta (Registro)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-3 border animate-shake ${
              lockoutSeconds > 0 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {lockoutSeconds > 0 && (
                  <p className="mt-1 font-bold text-rose-400">
                    ⏱️ Tiempo de espera activo: {lockoutSeconds}s
                  </p>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isRegisterTab ? (
            /* Login Form */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Correo o Usuario
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={lockoutSeconds > 0 || isLoading}
                    placeholder="admin@tecnova.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Contraseña Encriptada (Bcrypt)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutSeconds > 0 || isLoading}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="usuario@tecnova.com"
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Rol de Acceso (RBAC)
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cajero">Cajero / Vendedor (Ventas & Catálogo)</option>
                  <option value="ADMIN">Administrador (Control Total)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={lockoutSeconds > 0 || isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegisterTab ? (
              <>
                <UserPlus className="w-4 h-4" />
                Crear Cuenta de Usuario
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Ingresar al Sistema
              </>
            )}
          </button>

          {/* Quick Demo Access Buttons */}
          {!isRegisterTab && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-400">Acceso Rápido por Perfil:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-xl text-[11px] font-semibold text-purple-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Rol Administrador
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cajero')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 rounded-xl text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Rol Cajero / Ventas
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
