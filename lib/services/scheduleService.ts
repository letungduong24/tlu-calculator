import dayjs from 'dayjs';
import apiClient from '@/lib/axios';
import { ScheduleItem, ScheduleByDate } from '@/store/scheduleStore';

interface Timetable {
  id: number;
  startHour: {
    id: number;
    name: string;
    indexNumber: number;
    startString: string;
  } | null;
  endHour: {
    id: number;
    name: string;
    indexNumber: number;
    endString: string;
  } | null;
  room: {
    name: string;
    code: string;
  } | null;
  weekIndex: number;
  startDate: number;
  endDate: number;
  fromWeek: number;
  toWeek: number;
}

interface CourseSubject {
  id: number;
  subjectName: string;
  subjectCode?: string;
  courseSubject: {
    timetables: Timetable[];
  };
}

/**
 * Tính toán các ngày có lịch học dựa trên startDate, endDate và weekIndex
 */
export const calculateClassDates = (
  startDate: number,
  endDate: number,
  weekIndex: number
): string[] => {
  const dates: string[] = [];
  
  // Parse timestamp - timestamp từ API có thể là UTC
  // Lấy ngày tháng năm trực tiếp từ Date object để tránh timezone issues
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  // Lấy năm, tháng, ngày từ Date object (UTC)
  const startYear = startDateObj.getUTCFullYear();
  const startMonth = startDateObj.getUTCMonth(); // 0-11
  const startDay = startDateObj.getUTCDate();
  
  const endYear = endDateObj.getUTCFullYear();
  const endMonth = endDateObj.getUTCMonth(); // 0-11
  const endDay = endDateObj.getUTCDate();
  
  // Tạo dayjs object từ năm, tháng, ngày (không qua timestamp để tránh timezone)
  const start = dayjs(`${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`);
  const end = dayjs(`${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`);
  
  // Convert weekIndex từ API sang dayjs day
  // API: 2=Thứ2, 3=Thứ3, 4=Thứ4, 5=Thứ5, 6=Thứ6, 7=Thứ7, 0 hoặc 8=Chủ nhật
  // dayjs: 0=Chủ nhật, 1=Thứ2, 2=Thứ3, 3=Thứ4, 4=Thứ5, 5=Thứ6, 6=Thứ7
  let dayjsDay: number;
  if (weekIndex === 0 || weekIndex === 8) {
    // Chủ nhật
    dayjsDay = 0;
  } else if (weekIndex >= 2 && weekIndex <= 7) {
    // Thứ 2 đến Thứ 7: weekIndex - 1
    dayjsDay = weekIndex - 1;
  } else {
    // weekIndex không hợp lệ
    return dates;
  }
  
  let current = start;
  
  // Tìm ngày đầu tiên trong khoảng có weekIndex tương ứng
  while (current.isBefore(end) || current.isSame(end)) {
    if (current.day() === dayjsDay) {
      break;
    }
    current = current.add(1, 'day');
  }
  
  // Nếu không tìm thấy ngày nào có weekIndex đúng trong khoảng, trả về rỗng
  if (current.day() !== dayjsDay || current.isAfter(end)) {
    return dates;
  }
  
  // Lấy tất cả các ngày có cùng weekIndex trong khoảng thời gian
  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.format('DD/MM/YYYY'));
    current = current.add(7, 'day');
  }
  
  return dates;
};

/**
 * Tìm kỳ học có dữ liệu lịch học
 */
export const findLatestSemesterWithSchedule = async (): Promise<CourseSubject[]> => {
  let latestSemester = 0;
  let scheduleResponse: CourseSubject[] = [];
  
  // Tìm kỳ học có dữ liệu, bắt đầu từ 1
  for (let semester = 1; semester <= 50; semester++) {
    try {
      const response = await apiClient.get<CourseSubject[]>(
        `/api/StudentCourseSubject/studentLoginUser/${semester}`
      );
      
      // Kiểm tra nếu có dữ liệu
      if (
        Array.isArray(response.data) &&
        response.data.length > 0 &&
        response.data.some(
          (item) =>
            item.courseSubject?.timetables &&
            item.courseSubject.timetables.length > 0
        )
      ) {
        latestSemester = semester;
        scheduleResponse = response.data;
      } else {
        if (latestSemester > 0) {
          break;
        }
        continue;
      }
    } catch (error: any) {
      if (error.response?.status === 404 && latestSemester > 0) {
        break;
      }
      if (error.response?.status === 404 && latestSemester === 0) {
        continue;
      }
      throw error;
    }
  }
  
  return scheduleResponse;
};

/**
 * Transform dữ liệu từ API thành ScheduleItem[]
 */
export const transformScheduleData = (
  scheduleResponse: CourseSubject[]
): ScheduleItem[] => {
  const scheduleItems: ScheduleItem[] = [];
  
  scheduleResponse.forEach((course) => {
    if (!course.courseSubject?.timetables) return;
    
    course.courseSubject.timetables.forEach((timetable) => {
      if (!timetable.startHour || !timetable.endHour) return;
      
      const dates = calculateClassDates(
        timetable.startDate,
        timetable.endDate,
        timetable.weekIndex
      );
      
      if (dates.length === 0) return;
      
      scheduleItems.push({
        subjectName: course.subjectName,
        subjectCode: course.subjectCode,
        room: timetable.room?.name || timetable.room?.code || 'Chưa xác định',
        startPeriod: timetable.startHour.indexNumber,
        endPeriod: timetable.endHour.indexNumber,
        startTime: timetable.startHour.startString || '',
        endTime: timetable.endHour.endString || '',
        weekIndex: timetable.weekIndex,
        dates: dates,
      });
    });
  });
  
  return scheduleItems;
};

/**
 * Nhóm lịch học theo ngày và sắp xếp
 */
export const groupScheduleByDate = (
  scheduleItems: ScheduleItem[]
): ScheduleByDate[] => {
  // Nhóm theo ngày
  const scheduleByDateMap = new Map<string, ScheduleItem[]>();
  
  scheduleItems.forEach((item) => {
    item.dates.forEach((date) => {
      if (!scheduleByDateMap.has(date)) {
        scheduleByDateMap.set(date, []);
      }
      scheduleByDateMap.get(date)!.push(item);
    });
  });
  
  // Lấy ngày hiện tại (bắt đầu của ngày hôm nay)
  const today = dayjs().startOf('day');
  
  // Chuyển đổi Map thành mảng và sắp xếp theo ngày
  const scheduleByDate: ScheduleByDate[] = Array.from(scheduleByDateMap.entries())
    .map(([date, items]) => {
      // Parse date từ DD/MM/YYYY thành dayjs object để sắp xếp
      const [day, month, year] = date.split('/');
      const dateObj = dayjs(`${year}-${month}-${day}`).startOf('day');
      
      // Sắp xếp các môn trong cùng một ngày theo thời gian
      items.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      return {
        date,
        dateObj,
        items,
      };
    })
    .filter((item) => {
      // Lọc bỏ các ngày đã qua (chỉ giữ ngày >= hôm nay)
      return item.dateObj.isSame(today) || item.dateObj.isAfter(today);
    })
    .sort((a, b) => {
      // Sắp xếp theo ngày
      if (a.dateObj.isBefore(b.dateObj)) return -1;
      if (a.dateObj.isAfter(b.dateObj)) return 1;
      return 0;
    });
  
  return scheduleByDate;
};

/**
 * Fetch và xử lý lịch học từ API
 */
export const fetchAndProcessSchedule = async (): Promise<ScheduleByDate[]> => {
  // Tìm kỳ học có dữ liệu
  const scheduleResponse = await findLatestSemesterWithSchedule();
  
  if (scheduleResponse.length === 0) {
    return [];
  }
  
  // Transform dữ liệu
  const scheduleItems = transformScheduleData(scheduleResponse);
  
  // Nhóm theo ngày
  const scheduleByDate = groupScheduleByDate(scheduleItems);
  
  return scheduleByDate;
};

