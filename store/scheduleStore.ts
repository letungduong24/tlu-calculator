import { create } from 'zustand';
import type { Dayjs } from 'dayjs';
import { fetchAndProcessSchedule } from '@/lib/services/scheduleService';
import { saveScheduleToIDB, getScheduleFromIDB } from '@/lib/services/scheduleIdbService';

export interface ScheduleItem {
  subjectName: string;
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
  fetchSchedule: () => Promise<void>;
  loadScheduleFromIDB: () => Promise<void>;
  clearSchedule: () => void;
}

const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleByDate: [],
  scheduleLoading: false,
  scheduleError: null,
  scheduleFetched: false,
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
      set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể tải lịch học. Vui lòng thử lại.';
      set({ scheduleError: errorMessage, scheduleLoading: false, scheduleFetched: true });
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
        set({ scheduleByDate, scheduleLoading: false, scheduleFetched: true });
      } else {
        set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true });
      }
    } catch (error) {
      console.error('Error loading schedule from IDB:', error);
      set({ scheduleByDate: [], scheduleLoading: false, scheduleFetched: true });
    }
  },
  clearSchedule: () =>
    set({
      scheduleByDate: [],
      scheduleLoading: false,
      scheduleError: null,
      scheduleFetched: false,
    }),
}));

export default useScheduleStore;

