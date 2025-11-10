'use client';

import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleByDate } from '@/store/scheduleStore';

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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {scheduleError}
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
            <div>
                {dateGroup.items.map((item, itemIndex) => (
                  <Card key={itemIndex} className="bg-muted p-3">
                    <CardContent className="p-0">
                      <div className="mb-3">
                        <h5 className="text-base font-semibold text-foreground">
                          {item.subjectName}
                        </h5>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                          {item.startTime} - {item.endTime}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white">
                          Tiết {item.startPeriod} - {item.endPeriod}
                        </Badge>
                        <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">
                          {item.room}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          </div>
        );
      })}
    </div>
  );
}

