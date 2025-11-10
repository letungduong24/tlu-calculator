import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { isApiError } from './error-handler';

// Tạo axios instance với baseURL
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://sinhvien1.tlu.edu.vn/education',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Biến để tránh hiển thị nhiều dialog cùng lúc
let isHandling401 = false;

// Request interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const tokenType = localStorage.getItem('tokenType');
      if (accessToken && tokenType) {
        config.headers.Authorization = `${tokenType} ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Chỉ xử lý lỗi 401 từ API của dự án
    if (error.response?.status === 401 && 
        typeof window !== 'undefined' && 
        isApiError(error)) {
      // Chỉ xử lý một lần để tránh hiển thị nhiều dialog
      if (!isHandling401) {
        isHandling401 = true;

        // Import động để tránh circular dependency
        const { default: useAuthStore } = await import('@/store/authStore');
        const { default: useSessionExpiredDialogStore } = await import('@/store/sessionExpiredDialogStore');

        // Logout user
        useAuthStore.getState().logout();

        // Hiển thị dialog thông báo
        useSessionExpiredDialogStore.getState().openSessionExpiredDialog();

        // Reset flag sau 1 giây
        setTimeout(() => {
          isHandling401 = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
