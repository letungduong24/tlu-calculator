import { AxiosError } from 'axios';

/**
 * Chuyển đổi lỗi API thành thông báo tiếng Việt thân thiện
 */
export function getErrorMessage(error: unknown): string {
  // Nếu là AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;

    // Lỗi 401 - Unauthorized (Token hết hạn)
    if (axiosError.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    // Lỗi 403 - Forbidden
    if (axiosError.response?.status === 403) {
      return 'Bạn không có quyền truy cập tài nguyên này.';
    }

    // Lỗi 404 - Not Found
    if (axiosError.response?.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    }

    // Lỗi server (500, 502, 503, 504) - có thể do server đóng
    if (axiosError.response?.status === 500 || 
        axiosError.response?.status === 502 || 
        axiosError.response?.status === 503 || 
        axiosError.response?.status === 504) {
      return 'Server lỗi hoặc không thể kết nối';
    }

    // Lỗi mạng (có thể do server đóng)
    if (axiosError.code === 'NETWORK_ERROR' || axiosError.message === 'Network Error' || axiosError.code === 'ERR_NETWORK') {
      // Kiểm tra xem có phải lỗi từ API của trường không
      const config = axiosError.config;
      if (config?.baseURL?.includes('sinhvien1.tlu.edu.vn') || 
          config?.url?.includes('/api/') ||
          config?.url?.includes('/oauth/')) {
        return 'Server của trường đóng sau 12h đêm, hiện tại không thể lấy dữ liệu';
      }
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    }

    // Lỗi timeout
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
    }

    // Lỗi từ response data
    const responseData = axiosError.response?.data as any;
    if (responseData) {
      // Kiểm tra các trường thông báo lỗi phổ biến
      if (responseData.error_description) {
        return responseData.error_description;
      }
      if (responseData.message) {
        return responseData.message;
      }
      if (responseData.error) {
        // Chuyển đổi một số lỗi phổ biến
        const error = responseData.error;
        if (error === 'invalid_grant') {
          return 'Tên đăng nhập hoặc mật khẩu không đúng.';
        }
        if (error === 'invalid_client') {
          return 'Thông tin xác thực không hợp lệ.';
        }
        return error;
      }
    }

    // Lỗi status code khác
    if (axiosError.response?.status) {
      return `Lỗi kết nối (${axiosError.response.status}). Vui lòng thử lại.`;
    }
  }

  // Nếu là Error object
  if (error instanceof Error) {
    // Ẩn các thông báo lỗi kỹ thuật
    if (error.message.includes('Request failed with status code')) {
      const statusMatch = error.message.match(/status code (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        if (status === 401) {
          return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        }
        return `Lỗi kết nối (${status}). Vui lòng thử lại.`;
      }
    }
    return error.message;
  }

  // Lỗi không xác định
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}

/**
 * Kiểm tra xem lỗi có phải từ API của dự án không
 */
export function isApiError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const config = axiosError.config;
    
    // Kiểm tra xem request có phải từ API của dự án không
    if (config?.baseURL?.includes('sinhvien1.tlu.edu.vn') || 
        config?.url?.includes('/api/') ||
        config?.url?.includes('/oauth/')) {
      return true;
    }
  }
  return false;
}

