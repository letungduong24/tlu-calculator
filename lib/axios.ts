import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Tạo axios instance với baseURL
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://sinhvien1.tlu.edu.vn/education',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    // Nếu token hết hạn hoặc không hợp lệ, xóa token và redirect
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('expiresIn');
        localStorage.removeItem('scope');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

