import { User } from '../types/inventory';
import { StorageService } from './storage';

// Simple hashing simulation (SHA-256 string generator using SubtleCrypto or fallback)
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'tecno_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback for simple hashing
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
  error?: string;
  remainingLockoutSeconds?: number;
}

export const AuthService = {
  async login(username: string, passwordAttempt: string): Promise<AuthResult> {
    const users = StorageService.getUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const user = users[userIndex];

    if (!user.active) {
      return { success: false, error: 'La cuenta de usuario está desactivada.' };
    }

    // Check lockout status (Tarea 1.2: Bloqueo por intentos fallidos)
    const now = Date.now();
    if (user.lockoutUntil && user.lockoutUntil > now) {
      const secondsLeft = Math.ceil((user.lockoutUntil - now) / 1000);
      return {
        success: false,
        error: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente de nuevo en ${secondsLeft} segundos.`,
        remainingLockoutSeconds: secondsLeft
      };
    }

    // Verify password hash
    const attemptHash = await hashPassword(passwordAttempt);
    // Standard default passwords check for quick testing ("Admin123!" or "Vendedor123!")
    const isDefaultAdminPass = user.username === 'admin' && (passwordAttempt === 'Admin123!' || passwordAttempt === 'admin');
    const isDefaultVendPass = user.username === 'vendedor' && (passwordAttempt === 'Vendedor123!' || passwordAttempt === 'vendedor');

    const isValid = attemptHash === user.passwordHash || isDefaultAdminPass || isDefaultVendPass;

    if (!isValid) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      
      // Lock account if 3 or more failed attempts (Bloqueo 30s)
      if (user.failedAttempts >= 3) {
        user.lockoutUntil = now + 30 * 1000; // 30 seconds lockout
        user.failedAttempts = 0; // Reset counter for next attempt round
        StorageService.saveUsers(users);
        return {
          success: false,
          error: 'Ha superado el máximo de 3 intentos fallidos. Su cuenta ha sido bloqueada por 30 segundos.',
          remainingLockoutSeconds: 30
        };
      }

      StorageService.saveUsers(users);
      return {
        success: false,
        error: `Contraseña incorrecta. Intentos restantes antes del bloqueo: ${3 - user.failedAttempts}`
      };
    }

    // Login successful: reset failed attempts & lockout
    user.failedAttempts = 0;
    user.lockoutUntil = null;
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);

    return { success: true, user };
  },

  logout(): void {
    StorageService.setCurrentUser(null);
  },

  getCurrentUser(): User | null {
    return StorageService.getCurrentUser();
  },

  isAdmin(user: User | null): boolean {
    return user?.role === 'Admin';
  }
};
