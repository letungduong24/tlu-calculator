'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import useScheduleStore from '@/store/scheduleStore';
import useLoginDialogStore from '@/store/loginDialogStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleList } from '@/components/schedule-list';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { openLoginDialog } = useLoginDialogStore();
  const {
    studentData,
    loading,
    error,
    fetchStudentData,
  } = useStudentStore();
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
    
    // Chỉ gọi API nếu đã đăng nhập, chưa có data và không đang loading
    if (isAuthenticated && !studentData && !loading) {
      fetchStudentData();
    }
    // Load lịch học từ IDB (không cần đăng nhập)
    if (!scheduleFetched && !scheduleLoading) {
      loadScheduleFromIDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated]);


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

          {isAuthenticated && loading && (
            <div className="space-y-6">
              {/* Skeleton cho thông tin sinh viên */}
              <div className="rounded-lg border border-border bg-card p-6">
                <Skeleton className="mb-4 h-6 w-48" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {isAuthenticated && !loading && !error && !studentData && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Chưa có dữ liệu sinh viên. Vui lòng thử lại sau.
            </div>
          )}

          {isAuthenticated && studentData && !loading && (
            <div className="space-y-6">
              {/* Thông tin sinh viên */}
              {(studentData.studentCode || studentData.fullName || studentData.studentName || studentData.className || studentData.departmentName) && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Thông tin sinh viên
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {studentData.studentCode && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Mã sinh viên:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.studentCode}
                        </span>
                      </div>
                    )}
                    {(studentData.fullName || studentData.studentName) && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Họ tên:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.fullName || studentData.studentName}
                        </span>
                      </div>
                    )}
                    {studentData.className && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Lớp:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.className}
                        </span>
                      </div>
                    )}
                    {studentData.departmentName && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Khoa:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.departmentName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin điểm số */}
              {(studentData.gpa !== undefined ||
                studentData.averageMark !== undefined ||
                studentData.totalCredits !== undefined ||
                studentData.completedCredits !== undefined) && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Kết quả học tập
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {studentData.gpa !== undefined && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          GPA:
                        </span>{' '}
                        <span className="text-lg font-semibold text-foreground">
                          {studentData.gpa.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {studentData.averageMark !== undefined && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Điểm trung bình:
                        </span>{' '}
                        <span className="text-lg font-semibold text-foreground">
                          {studentData.averageMark.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {studentData.totalCredits !== undefined && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Tổng số tín chỉ:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.totalCredits}
                        </span>
                      </div>
                    )}
                    {studentData.completedCredits !== undefined && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Số tín chỉ đã tích lũy:
                        </span>{' '}
                        <span className="text-foreground">
                          {studentData.completedCredits}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Lịch học - Hiển thị cho tất cả người dùng */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
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
                  Đăng nhập để tải lịch học mới nhất
                </span>
              )}
            </div>
                
                {/* Tabs */}
                <div className="mb-4 flex gap-2 border-b border-border">
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
                    Tất cả các ngày
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
                    Tìm theo ngày
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

          {/* Danh sách điểm môn học - Chỉ hiển thị khi đã đăng nhập */}
          {isAuthenticated && studentData && studentData.summaryMarks &&
            studentData.summaryMarks.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Điểm chi tiết các môn học
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Mã môn
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Tên môn học
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Tín chỉ
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Điểm
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Điểm chữ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.summaryMarks.map((mark, index) => (
                        <tr
                          key={index}
                          className="border-b border-border"
                        >
                          <td className="px-4 py-2 text-foreground">
                            {mark.subjectCode || '-'}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {mark.subjectName || '-'}
                          </td>
                          <td className="px-4 py-2 text-center text-foreground">
                            {mark.credit !== undefined ? mark.credit : '-'}
                          </td>
                          <td className="px-4 py-2 text-center text-foreground">
                            {mark.mark !== undefined
                              ? mark.mark.toFixed(2)
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-center text-foreground">
                            {mark.grade || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
      </div>
    </DashboardLayout>
  );
}
