'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useScheduleStore from '@/store/scheduleStore';
import useLoginDialogStore from '@/store/loginDialogStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ScheduleList } from '@/components/schedule-list';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { openLoginDialog } = useLoginDialogStore();
  const {
    scheduleByDate,
    scheduleLoading,
    scheduleError,
    scheduleFetched,
    fetchSchedule,
    loadScheduleFromIDB,
  } = useScheduleStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'date'>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Load lịch học từ IDB (không cần đăng nhập)
    if (!scheduleFetched && !scheduleLoading) {
      loadScheduleFromIDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);


  // Chờ đến khi component mount trên client để tránh hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
          {/* Hiển thị trạng thái đăng nhập */}
          {!isAuthenticated && (
            <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin sinh viên và điểm số.</span>
                <Button
                  onClick={openLoginDialog}
                  className="ml-4"
                >
                  Đăng nhập
                </Button>
              </div>
            </div>
          )}

          {/* Lịch học - Hiển thị cho tất cả người dùng */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className=" font-semibold text-foreground">
                Lịch học
              </h3>
              {isAuthenticated && (
                <Button
                  onClick={fetchSchedule}
                  disabled={scheduleLoading}
                  size="sm"
                >
                  {scheduleLoading ? 'Đang tải...' : 'Tải lịch học'}
                </Button>
              )}
              {!isAuthenticated && (
                <span className="text-sm text-muted-foreground">
                  Đăng nhập để tải lịch học
                </span>
              )}
            </div>
                
                {/* Tabs */}
                <div className="mb-4 flex flex-wrap gap-2 border-b border-border">
                  <Button
                    onClick={() => {
                      setActiveTab('today');
                      setSelectedDate(undefined);
                    }}
                    variant="ghost"
                    size="sm"
                    className={`rounded-none border-b-2 -mb-px ${
                      activeTab === 'today' 
                        ? 'border-primary text-foreground font-medium' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab('all');
                      setSelectedDate(undefined);
                    }}
                    variant="ghost"
                    size="sm"
                    className={`rounded-none border-b-2 -mb-px ${
                      activeTab === 'all' 
                        ? 'border-primary text-foreground font-medium' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    Tất cả
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab('date');
                      setSelectedDate(new Date());
                    }}
                    variant="ghost"
                    size="sm"
                    className={`rounded-none border-b-2 -mb-px ${
                      activeTab === 'date' 
                        ? 'border-primary text-foreground font-medium' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    Theo ngày
                  </Button>
                </div>

                {activeTab === 'date' && (
                  <div className="mb-6 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) => {
                        setSelectedDate(date);
                      }}
                      className="rounded-md border"
                    />
                  </div>
                )}

                <ScheduleList
                  scheduleByDate={scheduleByDate}
                  scheduleLoading={scheduleLoading}
                  scheduleError={scheduleError}
                  activeTab={activeTab}
                  selectedDate={selectedDate}
                />
          </div>
      </div>
    </DashboardLayout>
  );
}
