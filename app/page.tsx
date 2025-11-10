'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import useScheduleStore from '@/store/scheduleStore';
import dayjs from 'dayjs';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const {
    studentData,
    loading,
    error,
    fetchStudentData,
    clearStudentData,
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
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Chỉ gọi API nếu chưa có data và không đang loading
    if (!studentData && !loading) {
      fetchStudentData();
    }
    // Load lịch học từ IDB
    if (!scheduleFetched && !scheduleLoading) {
      loadScheduleFromIDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated]);

  const handleLogout = () => {
    clearStudentData();
    logout();
    router.push('/login');
  };

  // Chờ đến khi component mount trên client để tránh hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full min-h-screen bg-white dark:bg-black">
        <div className="w-full border-b border-zinc-200 bg-white px-8 py-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Trang chủ
          </h1>
        </div>
        
        <div className="w-full px-8 py-6 pb-24">
          {loading && (
            <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              Đang tải thông tin...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && !studentData && (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
              Chưa có dữ liệu sinh viên. Vui lòng thử lại sau.
            </div>
          )}

          {studentData && !loading && (
            <div className="space-y-6">
              {/* Thông tin sinh viên */}
              {(studentData.studentCode || studentData.fullName || studentData.studentName || studentData.className || studentData.departmentName) && (
                <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800">
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Thông tin sinh viên
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {studentData.studentCode && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Mã sinh viên:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
                          {studentData.studentCode}
                        </span>
                      </div>
                    )}
                    {(studentData.fullName || studentData.studentName) && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Họ tên:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
                          {studentData.fullName || studentData.studentName}
                        </span>
                      </div>
                    )}
                    {studentData.className && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Lớp:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
                          {studentData.className}
                        </span>
                      </div>
                    )}
                    {studentData.departmentName && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Khoa:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
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
                <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800">
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Kết quả học tập
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {studentData.gpa !== undefined && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          GPA:
                        </span>{' '}
                        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {studentData.gpa.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {studentData.averageMark !== undefined && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Điểm trung bình:
                        </span>{' '}
                        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {studentData.averageMark.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {studentData.totalCredits !== undefined && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Tổng số tín chỉ:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
                          {studentData.totalCredits}
                        </span>
                      </div>
                    )}
                    {studentData.completedCredits !== undefined && (
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Số tín chỉ đã tích lũy:
                        </span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-50">
                          {studentData.completedCredits}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lịch học */}
              <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Lịch học
                  </h3>
                  <button
                    onClick={fetchSchedule}
                    disabled={scheduleLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {scheduleLoading ? 'Đang tải...' : 'Tải lịch học'}
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="mb-4 flex gap-2 border-b border-zinc-300 dark:border-zinc-700">
                  <button
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'today'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'all'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    Tất cả các ngày
                  </button>
                </div>

                {scheduleLoading && (
                  <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    Đang tải lịch học...
                  </div>
                )}
                {scheduleError && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
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
                      <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
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
                            className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <div className="mb-3 border-b border-zinc-200 pb-2 dark:border-zinc-700">
                              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                {dayName}, {dateGroup.date}
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {dateGroup.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                  <div className="mb-2">
                                    <h5 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                                      {item.subjectName}
                                    </h5>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                    <div className="flex items-center text-zinc-700 dark:text-zinc-300">
                                      <span className="font-medium">Thời gian:</span>
                                      <span className="ml-2 text-zinc-900 dark:text-zinc-50">
                                        {item.startTime} - {item.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-zinc-700 dark:text-zinc-300">
                                      <span className="font-medium">Tiết:</span>
                                      <span className="ml-2 text-zinc-900 dark:text-zinc-50">
                                        Tiết {item.startPeriod} - Tiết {item.endPeriod}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-zinc-700 dark:text-zinc-300">
                                      <span className="font-medium">Phòng:</span>
                                      <span className="ml-2 text-zinc-900 dark:text-zinc-50">
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

              {/* Danh sách điểm môn học */}
              {studentData.summaryMarks &&
                studentData.summaryMarks.length > 0 && (
                  <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800">
                    <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Điểm chi tiết các môn học
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-300 dark:border-zinc-600">
                            <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                              Mã môn
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                              Tên môn học
                            </th>
                            <th className="px-4 py-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                              Tín chỉ
                            </th>
                            <th className="px-4 py-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                              Điểm
                            </th>
                            <th className="px-4 py-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                              Điểm chữ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentData.summaryMarks.map((mark, index) => (
                            <tr
                              key={index}
                              className="border-b border-zinc-200 dark:border-zinc-700"
                            >
                              <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">
                                {mark.subjectCode || '-'}
                              </td>
                              <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">
                                {mark.subjectName || '-'}
                              </td>
                              <td className="px-4 py-2 text-center text-zinc-900 dark:text-zinc-50">
                                {mark.credit !== undefined ? mark.credit : '-'}
                              </td>
                              <td className="px-4 py-2 text-center text-zinc-900 dark:text-zinc-50">
                                {mark.mark !== undefined
                                  ? mark.mark.toFixed(2)
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-center text-zinc-900 dark:text-zinc-50">
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
          )}
        </div>

        {/* Menu ở dưới */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-4">
            <button
              onClick={() => {
                router.push('/grade');
              }}
              className="flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Xem điểm
            </button>
            <button
              onClick={() => {
                router.push('/aim');
              }}
              className="flex h-12 items-center justify-center rounded-lg bg-green-600 px-6 text-base font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Tính GPA mục tiêu
            </button>
            <button
              onClick={handleLogout}
              className="flex h-12 items-center justify-center rounded-lg bg-red-600 px-6 text-base font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Đăng xuất
            </button>
        </div>
        </div>
      </main>
    </div>
  );
}
