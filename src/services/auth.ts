import { User } from '../types/inventory';
import { StorageService } from './storage';

export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'tecno_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(16);
  }
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  remainingLockoutSeconds?: number;
}

const FAILED_ATTEMPTS_KEY = 'tecnova_failed_attempts';
const LOCKOUT_KEY = 'tecnova_lockout_until';

export const AuthService = {
  getLockoutSeconds(): number {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
    return 0;
  },

  setFailedAttempt(): { remainingAttempts: number; lockoutSeconds: number } {
    let attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
    if (attempts >= 3) {
      const lockoutUntil = Date.now() + 30 * 1000;
      localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
      localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
      return { remainingAttempts: 0, lockoutSeconds: 30 };
    }
    localStorage.setItem(FAILED_ATTEMPTS_KEY, String(attempts));
    return { remainingAttempts: 3 - attempts, lockoutSeconds: 0 };
  },

  resetFailedAttempts(): void {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  },

  async login(identifier: string, passwordAttempt: string): Promise<AuthResult> {
    const lockSeconds = this.getLockoutSeconds();
    if (lockSeconds > 0) {
      return {
        success: false,
        error: `Acceso bloqueado por intentos fallidos. Espere ${lockSeconds}s antes de reintentar.`,
        remainingLockoutSeconds: lockSeconds
      };
    }

    const cleanUser = identifier.trim();

    // Map common aliases
    let emailToSend = cleanUser;
    if (cleanUser.toLowerCase() === 'admin') emailToSend = 'admin@tecnova.com';
    if (cleanUser.toLowerCase() === 'cajero' || cleanUser.toLowerCase() === 'vendedor') emailToSend = 'cajero@tecnova.com';

    // 1. Intentar autenticar contra el Backend Express + MySQL
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, username: cleanUser, password: passwordAttempt })
      });

      const data = await response.json();

      if (response.ok && data.token && data.usuario) {
        this.resetFailedAttempts();
        localStorage.setItem('tecnova_token', data.token);

        const mappedUser: User = {
          id: String(data.usuario.id),
          username: data.usuario.username || cleanUser,
          name: data.usuario.name || data.usuario.nombre || cleanUser,
          role: data.usuario.role === 'Admin' ? 'Admin' : 'Vendedor',
          passwordHash: 'jwt_authenticated',
          active: true,
          failedAttempts: 0,
          lockoutUntil: null
        };

        StorageService.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser, token: data.token };
      } else {
        const { remainingAttempts, lockoutSeconds } = this.setFailedAttempt();
        if (lockoutSeconds > 0) {
          return {
            success: false,
            error: 'Ha superado el límite de 3 intentos fallidos. Bloqueo preventivo de 30 segundos.',
            remainingLockoutSeconds: 30
          };
        }
        return {
          success: false,
          error: `${data.mensaje || 'Credenciales inválidas'}. Intentos restantes: ${remainingAttempts}`
        };
      }
    } catch (networkError) {
      // 2. Fallback offline con StorageService local si el servidor estuviera inalcanzable
      console.warn('Backend Express no respondió, usando autenticación offline local.');
      const users = StorageService.getUsers();
      const localUser = users.find(
        u => u.username.toLowerCase() === cleanUser.toLowerCase() ||
             u.id.toLowerCase() === cleanUser.toLowerCase()
      );

      if (!localUser) {
        return { success: false, error: 'Usuario no encontrado en la base de datos local.' };
      }

      const isDefaultAdmin = (cleanUser === 'admin' || cleanUser === 'admin@tecnova.com') && (passwordAttempt === 'Admin123!' || passwordAttempt === 'admin');
      const isDefaultVend = (cleanUser === 'vendedor' || cleanUser === 'cajero@tecnova.com') && (passwordAttempt === 'Vendedor123!' || passwordAttempt === 'Cajero123!');

      if (isDefaultAdmin || isDefaultVend) {
        this.resetFailedAttempts();
        StorageService.setCurrentUser(localUser);
        return { success: true, user: localUser };
      }

      const { remainingAttempts, lockoutSeconds } = this.setFailedAttempt();
      return {
        success: false,
        error: `Contraseña incorrecta. Intentos restantes: ${remainingAttempts}`,
        remainingLockoutSeconds: lockoutSeconds
      };
    }
  },

  async register(nombre: string, email: string, password: string, rol: string): Promise<{ success: boolean; mensaje: string }> {
    try {
      const response = await fetch('http://localhost:5000/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al registrar usuario');
      }
      return { success: true, mensaje: 'Usuario registrado exitosamente.' };
    } catch (err: any) {
      return { success: false, mensaje: err.message || 'Error de conexión con el servidor.' };
    }
  },

  logout(): void {
    localStorage.removeItem('tecnova_token');
    StorageService.setCurrentUser(null);
  },

  getCurrentUser(): User | null {
    return StorageService.getCurrentUser();
  },

  isAdmin(user: User | null): boolean {
    return user?.role === 'Admin';
  }
};
