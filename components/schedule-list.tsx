'use client';

import dayjs from 'dayjs';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleByDate } from '@/store/scheduleStore';
import useScheduleStore from '@/store/scheduleStore';

interface ScheduleListProps {
  scheduleByDate: ScheduleByDate[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  activeTab: 'today' | 'all' | 'date';
  selectedDate?: Date;
}

export function ScheduleList({
  scheduleByDate,
  scheduleLoading,
  scheduleError,
  activeTab,
  selectedDate,
}: ScheduleListProps) {
  const { useCurrentSchedule } = useScheduleStore();
  if (scheduleLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="mb-3 h-5 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="mb-3 text-sm text-destructive">
          {scheduleError}
        </div>
        <Button
          onClick={useCurrentSchedule}
          disabled={scheduleLoading}
          variant="outline"
          size="sm"
        >
          {scheduleLoading ? 'Đang tải...' : 'Dùng lịch hiện tại'}
        </Button>
      </div>
    );
  }

  // Nếu đang ở tab "Tìm theo ngày" nhưng chưa chọn ngày, không hiển thị lịch
  if (activeTab === 'date' && !selectedDate) {
    return null;
  }

  const today = dayjs().startOf('day');
  let displaySchedule: ScheduleByDate[];

  if (activeTab === 'today') {
    displaySchedule = scheduleByDate.filter((item) =>
      item.dateObj.isSame(today)
    );
  } else if (activeTab === 'date' && selectedDate) {
    const selectedDay = dayjs(selectedDate).startOf('day');
    displaySchedule = scheduleByDate.filter((item) =>
      item.dateObj.isSame(selectedDay)
    );
  } else {
    displaySchedule = scheduleByDate;
  }

  if (displaySchedule.length === 0) {
    let message = 'Chưa có lịch học.';
    if (activeTab === 'today') {
      message = 'Hôm nay không có lịch học.';
    } else if (activeTab === 'date' && selectedDate) {
      message = `Ngày ${dayjs(selectedDate).format('DD/MM/YYYY')} không có lịch học.`;
    }
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {message}
      </div>
    );
  }

  const dayNames = [
    'Chủ nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ];

  return (
    <div className="space-y-4">
      {displaySchedule.map((dateGroup, dateIndex) => {
        const dayOfWeek = dateGroup.dateObj.day();
        const dayName = dayNames[dayOfWeek] || 'Chưa xác định';

        return (
          <div className='space-y-3 border-b border-border pb-3' key={dateIndex}>
            <h5 className="text-base font-semibold text-foreground">{dayName}, {dateGroup.date}</h5>
            <div className='space-y-3'>
                {dateGroup.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-muted rounded-xl p-4">
                    <div className="p-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="font-bold border-red-500 text-red-600 dark:text-red-400 bg-transparent hover:bg-transparent">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.startTime} - {item.endTime}
                        </Badge>
                        <Badge variant="outline" className="bg-transparent hover:bg-transparent">
                          Tiết {item.startPeriod} - {item.endPeriod}
                        </Badge>
                        <Badge variant="outline" className="bg-transparent hover:bg-transparent">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.room}
                        </Badge>
                      </div>
                       <div>
                         <h5 className="text-base font-semibold text-foreground">
                           {item.subjectCode || item.subjectName}
                         </h5>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );
      })}
    </div>
  );
}

