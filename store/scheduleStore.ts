import { create } from 'zustand';
import type { Dayjs } from 'dayjs';
import { fetchAndProcessSchedule } from '@/lib/services/scheduleService';
import { saveScheduleToIDB, getScheduleFromIDB } from '@/lib/services/scheduleIdbService';
import { getErrorMessage } from '@/lib/error-handler';
import { toast } from 'sonner';

export interface ScheduleItem {
  subjectName: string;
  subjectCode?: string;
  room: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  weekIndex: number;
  dates: string[];
}

export interface ScheduleByDate {
  date: string;
  dateObj: Dayjs;
  items: ScheduleItem[];
}

interface ScheduleState {
  scheduleByDate: ScheduleByDate[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  scheduleFetched: boolean;
  hasScheduleInIDB: boolean;
  fetchSchedule: () => Promise<void>;
  loadScheduleFromIDB: () => Promise<void>;
  useCurrentSchedule: () => Promise<void>;
  clearSchedule: () => void;
}

const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleByDate: [],
  scheduleLoading: false,
  scheduleError: null,
  scheduleFetched: false,
  hasScheduleInIDB: false,
  fetchSchedule: async () => {
    // Tránh gọi API nếu đang loading
    if (get().scheduleLoading) {
      return;
    }

    set({ scheduleLoading: true, scheduleError: null });
    
    try {
      const scheduleByDate = await fetchAndProcessSchedule();
      // Lưu vào IDB
      await saveScheduleToIDB(scheduleByDate);
      set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: true });
      toast.success('Tải lịch học thành công!');
    } catch (error) {
      console.error('Error fetching schedule:', error);
      
      // Kiểm tra nếu là lỗi 401 (hết phiên đăng nhập)
      const is401Error = error && typeof error === 'object' && 'isAxiosError' in error && 
                         (error as any).response?.status === 401;
      
      if (is401Error) {
        // Tự động load lại lịch từ IDB khi hết phiên đăng nhập
        try {
          const scheduleByDate = await getScheduleFromIDB();
          if (scheduleByDate) {
            set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: true, scheduleError: null });
          } else {
            set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false, scheduleError: null });
          }
        } catch (idbError) {
          console.error('Error loading schedule from IDB:', idbError);
          set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false, scheduleError: null });
        }
      } else {
        // Các lỗi khác vẫn hiển thị thông báo
        const errorMessage = getErrorMessage(error) || 'Không thể tải lịch học. Vui lòng thử lại.';
        set({ scheduleError: errorMessage, scheduleLoading: false, scheduleFetched: true });
      }
    }
  },
  loadScheduleFromIDB: async () => {
    if (get().scheduleFetched) {
      return;
    }

    set({ scheduleLoading: true, scheduleError: null });
    
    try {
      const scheduleByDate = await getScheduleFromIDB();
      if (scheduleByDate) {
        set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: true });
      } else {
        set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false });
      }
    } catch (error) {
      console.error('Error loading schedule from IDB:', error);
      set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false });
    }
  },
  useCurrentSchedule: async () => {
    set({ scheduleError: null, scheduleLoading: true });
    
    try {
      const scheduleByDate = await getScheduleFromIDB();
      if (scheduleByDate) {
        set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: true });
      } else {
        set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false });
      }
    } catch (error) {
      console.error('Error loading schedule from IDB:', error);
      set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true, hasScheduleInIDB: false });
    }
  },
  clearSchedule: () =>
    set({
      scheduleByDate: [],
      scheduleLoading: false,
      scheduleError: null,
      scheduleFetched: false,
      hasScheduleInIDB: false,
    }),
}));

export default useScheduleStore;

