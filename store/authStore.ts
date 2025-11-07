import { create } from 'zustand';
import apiClient from '@/lib/axios';

interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresIn: number | null;
  scope: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Lấy token từ localStorage khi khởi tạo
const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem('accessToken');
  const tokenType = localStorage.getItem('tokenType');
  return accessToken && tokenType ? { accessToken, tokenType } : null;
};

const useAuthStore = create<AuthState>((set) => {
  // Khởi tạo từ localStorage nếu có
  const stored = getStoredToken();
  return {
    accessToken: stored?.accessToken || null,
    refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
    tokenType: stored?.tokenType || null,
    expiresIn: typeof window !== 'undefined' ? Number(localStorage.getItem('expiresIn')) || null : null,
    scope: typeof window !== 'undefined' ? localStorage.getItem('scope') : null,
    isAuthenticated: !!stored,
    loading: false,
    error: null,
    login: async (username: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const formData = new URLSearchParams();
        formData.append('client_id', 'education_client');
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);
        formData.append('client_secret', 'password');

        const response = await apiClient.post<AuthResponse>('/oauth/token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        // Lưu token vào localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', response.data.access_token);
          localStorage.setItem('refreshToken', response.data.refresh_token);
          localStorage.setItem('tokenType', response.data.token_type);
          localStorage.setItem('expiresIn', response.data.expires_in.toString());
          localStorage.setItem('scope', response.data.scope);
        }

        set({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          tokenType: response.data.token_type,
          expiresIn: response.data.expires_in,
          scope: response.data.scope,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error: any) {
        let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        if (error?.response?.data?.error_description) {
          errorMessage = error.response.data.error_description;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        set({ error: errorMessage, loading: false });
        throw error;
      }
    },
    logout: () => {
      // Xóa token khỏi localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('expiresIn');
        localStorage.removeItem('scope');
      }
      set({
        accessToken: null,
        refreshToken: null,
        tokenType: null,
        expiresIn: null,
        scope: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    },
  };
});

export default useAuthStore;
