'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    studentData,
    loading,
    error,
    fetchStudentData,
  } = useStudentStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    // Chỉ gọi API nếu đã đăng nhập, chưa có data và không đang loading
    if (isAuthenticated && !studentData && !loading) {
      fetchStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated]);

  // Chờ đến khi component mount trên client để tránh hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loading && (
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

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && !studentData && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Chưa có dữ liệu sinh viên. Vui lòng thử lại sau.
          </div>
        )}

        {studentData && !loading && (
          <div className="space-y-6">
            {/* Thông tin cá nhân */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
                {studentData.firstName && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Tên:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.firstName}
                    </span>
                  </div>
                )}
                {studentData.lastName && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Họ:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.lastName}
                    </span>
                  </div>
                )}
                {studentData.email && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Email:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.email}
                    </span>
                  </div>
                )}
                {studentData.phoneNumber && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Số điện thoại:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.phoneNumber}
                    </span>
                  </div>
                )}
                {studentData.birthDateString && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Ngày sinh:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.birthDateString}
                    </span>
                  </div>
                )}
                {studentData.birthPlace && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Nơi sinh:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.birthPlace}
                    </span>
                  </div>
                )}
                {studentData.gender && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Giới tính:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.gender}
                    </span>
                  </div>
                )}
                {studentData.idNumber && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      CMND/CCCD:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.idNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin học tập */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Thông tin học tập
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
                {studentData.classCode && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Mã lớp:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.classCode}
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
                {studentData.specialityName && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Chuyên ngành:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.specialityName}
                    </span>
                  </div>
                )}
                {studentData.courseYear && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Khóa học:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.courseYear}
                    </span>
                  </div>
                )}
                {studentData.educationTypeName && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Hệ đào tạo:
                    </span>{' '}
                    <span className="text-foreground">
                      {studentData.educationTypeName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kết quả học tập */}
            {(studentData.gpa !== undefined ||
              studentData.averageMark !== undefined ||
              studentData.totalCredits !== undefined ||
              studentData.completedCredits !== undefined) && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Kết quả học tập
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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

            {/* Danh sách điểm môn học */}
            {studentData.summaryMarks &&
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
        )}
      </div>
    </DashboardLayout>
  );
}

