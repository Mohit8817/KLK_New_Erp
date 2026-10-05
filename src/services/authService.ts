/**
 * Authentication API Service for KLK Solar ERP System
 *
 * Handles User Login, Vendor Login, and User Logout with backend API
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://klkerp.com/api'
).replace(/\/+$/, '');

export interface UserSession {
  id?: number | string;
  name?: string;
  email?: string;

  company_id?: string | number | null;

  vendor_id?: string;

  role: 'user' | 'vendor' | string;

  token?: string;

  loginTime: string;

  rawResponse?: any;

  [key: string]: any;
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
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
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
            errorMessage =
              typeof data.error === 'string'
                ? data.error
                : JSON.stringify(data.error);
          } else if (data.errors) {
            const firstKey = Object.keys(data.errors)[0];

            if (
              firstKey &&
              data.errors[firstKey]?.length
            ) {
              errorMessage = data.errors[firstKey][0];
            }
          }
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized: Invalid credentials';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found';
        } else if (response.status >= 500) {
          errorMessage =
            'Server error. Please try again later.';
        }

        const error = new Error(errorMessage) as any;

        error.status = response.status;
        error.data = data;

        throw error;
      }

      return data;
    } catch (err: any) {
      if (
        err.name === 'TypeError' &&
        err.message.includes('fetch')
      ) {
        throw new Error(
          'Network error: Unable to reach ERP server. Please verify your connection.'
        );
      }

      throw err;
    }
  }

  /**
   * POST API login (User Login)
   */
  async loginUser(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      const result = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const token =
        result.token ||
        result.access_token ||
        result.data?.token ||
        result.data?.access_token ||
        `klk_user_session_token_${Date.now()}`;

      const userData =
        result.user ||
        result.data?.user ||
        result.data || {
          name: email.split('@')[0].toUpperCase(),
          email: email.trim(),
          role: 'user',
        };

  
      const session: UserSession = {
        ...userData,

        id: userData.id,
        name: userData.name || email.split('@')[0],
        email: userData.email || email.trim(),

        // ✅ Explicitly preserve company_id
        company_id: userData.company_id ?? null,

        role: 'user',
        token,

        loginTime: new Date().toISOString(),

        rawResponse: result,
      };

      console.log(
        '[AUTH] Logged in company_id:',
        session.company_id
      );

      this.saveSession(session);

      return {
        success: true,
        message:
          result.message || 'Login successful',
        token,
        user: session,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message ||
          'Login failed. Please check your credentials.',
        errors: error.data?.errors,
      };
    }
  }

  /**
   * POST API vendor-login (Vendor Login)
   */
  async loginVendor(
    vendorId: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      const result = await this.request('/vendor-login', {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: vendorId.trim(),
          password,
        }),
      });

      const token =
        result.token ||
        result.access_token ||
        result.data?.token ||
        result.data?.access_token ||
        `klk_vendor_session_token_${Date.now()}`;

      const vendorData =
        result.vendor ||
        result.user ||
        result.data?.vendor ||
        result.data?.user ||
        result.data || {
          name: `Vendor (${vendorId.trim()})`,
          vendor_id: vendorId.trim(),
          role: 'vendor',
        };

      const session: UserSession = {
        ...vendorData,

        name:
          vendorData.name ||
          `Vendor ${vendorId.trim()}`,

        vendor_id: vendorId.trim(),

        role: 'vendor',

        token,

        loginTime: new Date().toISOString(),

        rawResponse: result,
      };

      this.saveSession(session);

      return {
        success: true,
        message:
          result.message ||
          'Vendor login successful',
        token,
        user: session,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message ||
          'Vendor login failed. Please check your Vendor ID and password.',
        errors: error.data?.errors,
      };
    }
  }

  /**
   * POST API user/logout
   */
  async logout(): Promise<{
    success: boolean;
    message: string;
  }> {
    const token = this.getToken();

    try {
      if (token) {
        await this.request('/user/logout', {
          method: 'POST',
        }).catch(() => {
          // Ignore expired token
        });
      }
    } catch (e) {
      console.warn(
        'Logout API error:',
        e
      );
    } finally {
      this.clearSession();
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Session Management
   */
  saveSession(
    session: UserSession,
    persistLocal: boolean = true
  ): void {
    try {
      const json = JSON.stringify(session);

      sessionStorage.setItem(
        'klk_user_session',
        json
      );

      if (session.rawResponse) {
        try {
          sessionStorage.setItem(
            'klk_raw_login_response',
            JSON.stringify(
              session.rawResponse
            )
          );
        } catch {
          // Ignore
        }
      }

      if (persistLocal) {
        localStorage.setItem(
          'klk_user_session',
          json
        );

        localStorage.setItem(
          'klk_auth_token',
          session.token || ''
        );

        if (session.rawResponse) {
          try {
            localStorage.setItem(
              'klk_raw_login_response',
              JSON.stringify(
                session.rawResponse
              )
            );
          } catch {
            // Ignore
          }
        }
      }
    } catch (e) {
      console.error(
        'Failed to save session:',
        e
      );
    }
  }

  getSession(): UserSession | null {
    try {
      const sessionStr =
        sessionStorage.getItem(
          'klk_user_session'
        ) ||
        localStorage.getItem(
          'klk_user_session'
        );

      if (sessionStr) {
        return JSON.parse(
          sessionStr
        );
      }
    } catch (e) {
      console.error(
        'Failed to parse session:',
        e
      );
    }

    return null;
  }

  getRawResponse(): any {
    try {
      const raw =
        sessionStorage.getItem(
          'klk_raw_login_response'
        ) ||
        localStorage.getItem(
          'klk_raw_login_response'
        );

      if (raw) {
        return JSON.parse(raw);
      }

      const session =
        this.getSession();

      return (
        session?.rawResponse ||
        null
      );
    } catch (e) {
      console.error(
        'Failed to parse raw response:',
        e
      );

      return null;
    }
  }

  getToken(): string | null {
    const session =
      this.getSession();

    return (
      session?.token ||
      localStorage.getItem(
        'klk_auth_token'
      ) ||
      null
    );
  }


  getCompanyId(): string | null {
    const session =
      this.getSession();

    const companyId =
      session?.company_id ??
      this.getRawResponse()?.user
        ?.company_id ??
      this.getRawResponse()?.data
        ?.user?.company_id;

    if (
      companyId === null ||
      companyId === undefined
    ) {
      return null;
    }

    const normalized =
      String(companyId).trim();

    return normalized
      ? normalized
      : null;
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem(
        'klk_user_session'
      );

      sessionStorage.removeItem(
        'klk_raw_login_response'
      );

      localStorage.removeItem(
        'klk_user_session'
      );

      localStorage.removeItem(
        'klk_raw_login_response'
      );

      localStorage.removeItem(
        'klk_auth_token'
      );
    } catch (e) {
      console.error(
        'Failed to clear session:',
        e
      );
    }
  }
}

export const authService =
  new AuthService();

export default authService;