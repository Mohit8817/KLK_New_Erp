/**
 * Authentication API Service for KLK Solar ERP System
 * Handles User Login, Vendor Login, and User Logout with backend API
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api'
).replace(/\/+$/, '');

export interface UserSession {
  id?: number | string;
  name?: string;
  email?: string;
  vendor_id?: string;
  role: 'user' | 'vendor';
  token?: string;
  loginTime: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  data?: any;
  errors?: Record<string, string[]>;
}

class AuthService {
  /**
   * Helper to perform JSON requests with proper headers
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Attach active Bearer token if present
    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMessage = 'Request failed';
        if (data) {
          if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          } else if (data.errors) {
            const firstKey = Object.keys(data.errors)[0];
            if (firstKey && data.errors[firstKey]?.length) {
              errorMessage = data.errors[firstKey][0];
            }
          }
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized: Invalid credentials';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach ERP server. Please verify your connection.');
      }
      throw err;
    }
  }

  /**
   * POST API login (User Login)
   */
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    try {
      const result = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // Handle common response formats from Laravel API
      const token = result.token || result.access_token || result.data?.token || result.data?.access_token || 'klk_user_session_token_' + Date.now();
      const userData = result.user || result.data?.user || {
        name: email.split('@')[0].toUpperCase(),
        email: email.trim(),
        role: 'user',
      };

      const session: UserSession = {
        name: userData.name || email.split('@')[0],
        email: email.trim(),
        role: 'user',
        token,
        loginTime: new Date().toISOString(),
        ...userData,
      };

      this.saveSession(session);
      return {
        success: true,
        message: result.message || 'Login successful',
        token,
        user: session,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.',
        errors: error.data?.errors,
      };
    }
  }

  /**
   * POST API vendor-login (Vendor Login)
   */
  async loginVendor(vendorId: string, password: string): Promise<LoginResponse> {
    try {
      const result = await this.request('/vendor-login', {
        method: 'POST',
        body: JSON.stringify({ vendor_id: vendorId.trim(), password }),
      });

      const token = result.token || result.access_token || result.data?.token || result.data?.access_token || 'klk_vendor_session_token_' + Date.now();
      const vendorData = result.vendor || result.user || result.data?.vendor || {
        name: `Vendor (${vendorId.trim()})`,
        vendor_id: vendorId.trim(),
        role: 'vendor',
      };

      const session: UserSession = {
        name: vendorData.name || `Vendor ${vendorId.trim()}`,
        vendor_id: vendorId.trim(),
        role: 'vendor',
        token,
        loginTime: new Date().toISOString(),
        ...vendorData,
      };

      this.saveSession(session);
      return {
        success: true,
        message: result.message || 'Vendor login successful',
        token,
        user: session,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Vendor login failed. Please check your Vendor ID and password.',
        errors: error.data?.errors,
      };
    }
  }

  /**
   * POST API user/logout (User/Vendor Logout)
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    try {
      if (token) {
        await this.request('/user/logout', {
          method: 'POST',
        }).catch(() => {
          // Fallback silently if token already expired on server
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      this.clearSession();
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Session Management Helpers
   * Uses both sessionStorage (for session-tab lifecycle) and localStorage (for persistence)
   */
  saveSession(session: UserSession, persistLocal: boolean = true): void {
    try {
      const json = JSON.stringify(session);
      sessionStorage.setItem('klk_user_session', json);
      if (persistLocal) {
        localStorage.setItem('klk_user_session', json);
        localStorage.setItem('klk_auth_token', session.token || '');
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  getSession(): UserSession | null {
    try {
      const sessionStr = sessionStorage.getItem('klk_user_session') || localStorage.getItem('klk_user_session');
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {
      console.error('Failed to parse session:', e);
    }
    return null;
  }

  getToken(): string | null {
    const session = this.getSession();
    return session?.token || localStorage.getItem('klk_auth_token') || null;
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem('klk_user_session');
      localStorage.removeItem('klk_user_session');
      localStorage.removeItem('klk_auth_token');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }
}

export const authService = new AuthService();
export default authService;
