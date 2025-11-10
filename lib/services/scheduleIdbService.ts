import dayjs from 'dayjs';
import { ScheduleByDate } from '@/store/scheduleStore';

const DB_NAME = 'aim-tli-db';
const DB_VERSION = 1;
const STORE_NAME = 'schedule';
const SCHEDULE_KEY = 'schedule';

/**
 * Mở kết nối IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB chỉ hoạt động trên client'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Không thể mở IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Lưu lịch học vào IndexedDB
 */
export const saveScheduleToIDB = async (schedule: ScheduleByDate[]): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Xóa dữ liệu cũ
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Lưu dữ liệu mới
    // Convert dayjs objects thành plain objects để lưu vào IDB
    const scheduleToSave = schedule.map((item) => ({
      date: item.date,
      dateObj: item.dateObj.format('YYYY-MM-DD'),
      items: item.items,
    }));

    // Lưu toàn bộ mảng schedule như một object
    await new Promise<void>((resolve, reject) => {
      const putRequest = store.put({
        id: SCHEDULE_KEY,
        schedule: scheduleToSave,
        lastUpdated: new Date().toISOString(),
      });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });

    db.close();
  } catch (error) {
    console.error('Error saving schedule to IDB:', error);
    throw error;
  }
};

/**
 * Lấy lịch học từ IndexedDB
 */
export const getScheduleFromIDB = async (): Promise<ScheduleByDate[] | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<ScheduleByDate[] | null>((resolve, reject) => {
      const request = store.get(SCHEDULE_KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (!result || !result.schedule || result.schedule.length === 0) {
          db.close();
          resolve(null);
          return;
        }

        // Convert lại từ plain object thành dayjs objects
        const schedule: ScheduleByDate[] = result.schedule.map((item: any) => ({
          date: item.date,
          dateObj: dayjs(item.dateObj),
          items: item.items,
        }));

        // Sắp xếp lại theo ngày
        schedule.sort((a, b) => {
          if (a.dateObj.isBefore(b.dateObj)) return -1;
          if (a.dateObj.isAfter(b.dateObj)) return 1;
          return 0;
        });

        db.close();
        resolve(schedule);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting schedule from IDB:', error);
    return null;
  }
};

/**
 * Xóa lịch học khỏi IndexedDB
 */
export const clearScheduleFromIDB = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const deleteRequest = store.delete('schedule');
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });

    db.close();
  } catch (error) {
    console.error('Error clearing schedule from IDB:', error);
    throw error;
  }
};

