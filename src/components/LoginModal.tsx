import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, User as UserIcon, KeyRound, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { AuthService } from '../services/auth';
import { User } from '../types/inventory';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

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

  const handleQuickFill = (userType: 'admin' | 'vendedor') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('Admin123!');
    } else {
      setUsername('vendedor');
      setPassword('Vendedor123!');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-3 border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">TecnoStock POS</h2>
          <p className="text-xs text-indigo-100 font-medium mt-1">Sistema de Control de Inventario y Ventas</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 border ${
              lockoutSeconds > 0 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {lockoutSeconds > 0 && (
                  <p className="mt-1 font-bold text-rose-400">
                    Bloqueo activo: {lockoutSeconds}s restantes
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Usuario / Identificador
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={lockoutSeconds > 0 || isLoading}
                  placeholder="Ingrese su usuario..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Contraseña Encriptada
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutSeconds > 0 || isLoading}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={lockoutSeconds > 0 || isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-5 h-5" />
                Iniciar Sesión Segura
              </>
            )}
          </button>

          {/* Quick Demo Accces Controls for ease of testing */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-400">Acceso Rápido de Prueba (Demo):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-medium text-indigo-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Rol Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('vendedor')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-medium text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Rol Vendedor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
