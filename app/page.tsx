'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import useScheduleStore from '@/store/scheduleStore';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
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
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

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
                  onClick={() => router.push('/login')}
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
                    onClick={() => setActiveTab('today')}
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
                    onClick={() => setActiveTab('all')}
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
                </div>

                {scheduleLoading && (
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
                )}
                {scheduleError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {scheduleError}
                  </div>
                )}
                {!scheduleLoading && !scheduleError && (() => {
                  const today = dayjs().startOf('day');
                  const todaySchedule = scheduleByDate.filter((item) =>
                    item.dateObj.isSame(today)
                  );
                  const displaySchedule = activeTab === 'today' ? todaySchedule : scheduleByDate;
                  
                  if (displaySchedule.length === 0) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                        {activeTab === 'today' ? 'Hôm nay không có lịch học.' : 'Chưa có lịch học.'}
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {displaySchedule.map((dateGroup, dateIndex) => {
                        const dayNames = [
                          'Chủ nhật',
                          'Thứ 2',
                          'Thứ 3',
                          'Thứ 4',
                          'Thứ 5',
                          'Thứ 6',
                          'Thứ 7',
                        ];
                        const dayOfWeek = dateGroup.dateObj.day();
                        const dayName = dayNames[dayOfWeek] || 'Chưa xác định';
                        
                        return (
                          <div
                            key={dateIndex}
                            className="rounded-lg border border-border bg-card p-4"
                          >
                            <div className="mb-3 border-b border-border pb-2">
                              <h4 className="text-lg font-semibold text-foreground">
                                {dayName}, {dateGroup.date}
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {dateGroup.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="rounded-lg border border-border bg-muted p-3"
                                >
                                  <div className="mb-2">
                                    <h5 className="text-base font-semibold text-foreground">
                                      {item.subjectName}
                                    </h5>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                    <div className="flex items-center text-muted-foreground">
                                      <span className="font-medium">Thời gian:</span>
                                      <span className="ml-2 text-foreground">
                                        {item.startTime} - {item.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <span className="font-medium">Tiết:</span>
                                      <span className="ml-2 text-foreground">
                                        Tiết {item.startPeriod} - Tiết {item.endPeriod}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <span className="font-medium">Phòng:</span>
                                      <span className="ml-2 text-foreground">
                                        {item.room}
                                      </span>
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
                })()}
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
