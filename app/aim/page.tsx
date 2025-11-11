'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import { calculateAimPageData } from '@/lib/services/aimService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function AimPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { 
    subjectMarks, 
    fetchSubjectMarks, 
    marksLoading,
    educationProgram,
    educationProgramLoading,
    educationProgramError,
    fetchEducationProgram
  } = useStudentStore();
  const [mounted, setMounted] = useState(false);
  const [inputTargetGpa, setInputTargetGpa] = useState<string>('');
  const [calculatedTargetGpa, setCalculatedTargetGpa] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Fetch subject marks nếu chưa có (giống trang /grade)
    if (subjectMarks.length === 0 && !marksLoading) {
      fetchSubjectMarks();
    }
    
    // Luôn fetch education program khi vào trang này (đảm bảo API được gọi khi navigate)
    fetchEducationProgram();
  }, [mounted, isAuthenticated, pathname]);

  // Tính tổng tín chỉ và tín chỉ đã học
  const { totalCredits, passedCredits, incompleteSubjects, gpa, aimCalculation } = useMemo(() => {
    return calculateAimPageData(
      educationProgram,
      subjectMarks,
      calculatedTargetGpa
    );
  }, [educationProgram, subjectMarks, calculatedTargetGpa]);

  // Hàm xử lý tính toán GPA
  const handleCalculate = () => {
    const targetValue = parseFloat(inputTargetGpa);
    // Validation
    if (!inputTargetGpa || isNaN(targetValue)) {
      setValidationError('Vui lòng nhập mục tiêu GPA hợp lệ');
      return;
    }
    if (targetValue < 0 || targetValue > 4) {
      setValidationError('GPA phải nằm trong khoảng 0 - 4.0');
      return;
    }
    // So sánh với độ chính xác 2 chữ số thập phân để tránh lỗi floating point
    const currentGpaRounded = Math.round(gpa * 100) / 100;
    const targetValueRounded = Math.round(targetValue * 100) / 100;
    if (targetValueRounded <= currentGpaRounded) {
      setValidationError(`Mục tiêu GPA phải lớn hơn GPA hiện tại (${gpa.toFixed(2)})`);
      return;
    }
    // Nếu hợp lệ, tính toán
    setCalculatedTargetGpa(inputTargetGpa);
    setValidationError('');
  };

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
          {educationProgramLoading && (
            <div className="space-y-6">
              {/* Skeleton cho tổng quan */}
              <div className="rounded-lg border border-border bg-card p-6">
                <Skeleton className="mb-4 h-7 w-32" />
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-9 w-16" />
                    </div>
                    <Skeleton className="mt-2 h-4 w-56" />
                  </div>
                  
                  <div className="rounded-lg border border-border bg-card p-4">
                    <Skeleton className="mb-2 h-4 w-32" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-9 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {educationProgramError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {educationProgramError}
            </div>
          )}

          {!educationProgramLoading && !educationProgramError && (
            <>
              {/* Hiển thị số tín chỉ */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-medium text-foreground">
                    Tín chỉ đã học / Tổng số tín chỉ
                  </span>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {passedCredits} / {totalCredits}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiến độ hoàn thành</span>
                    <Badge variant="secondary" className="text-sm px-2.5 py-1">
                      {totalCredits > 0 
                        ? ((passedCredits / totalCredits) * 100).toFixed(1)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${totalCredits > 0 ? (passedCredits / totalCredits) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-medium text-foreground">
                    GPA toàn khóa hiện tại
                  </span>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {gpa.toFixed(2)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Tính từ các môn đã hoàn thành (thang điểm 4.0)
                </div>
              </div>
              
              {/* Input để đặt aim GPA */}
              <div className="rounded-lg border border-border bg-card p-4">
                <Label className="mb-2 text-lg font-medium text-foreground">
                  Đặt mục tiêu GPA:
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    step="0.1"
                    value={inputTargetGpa}
                    onChange={(e) => {
                      setInputTargetGpa(e.target.value);
                      setValidationError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCalculate();
                      }
                    }}
                    placeholder="VD: 3.5"
                    className="w-32"
                  />
                  <Button
                    onClick={handleCalculate}
                    size="sm"
                  >
                    Tính
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    (thang điểm 4.0)
                  </span>
                </div>
                {validationError && (
                  <div className="mt-2 text-sm text-destructive">
                    {validationError}
                  </div>
                )}
              </div>
              
              {/* Hiển thị kết quả tính toán aim */}
              {aimCalculation && (
                <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 text-lg font-semibold text-foreground">
                        Kết quả tính toán
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GPA hiện tại:</span>
                          <span className="font-medium text-foreground">
                            {aimCalculation.currentGpa.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mục tiêu GPA:</span>
                          <span className="font-medium text-foreground">
                            {aimCalculation.targetGpa.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tín chỉ đã học:</span>
                          <span className="font-medium text-foreground">
                            {aimCalculation.currentCredits}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tín chỉ còn lại:</span>
                          <span className="font-medium text-foreground">
                            {aimCalculation.remainingCredits}
                          </span>
                        </div>
                        
                        {/* Hiển thị thông báo nếu không thể đạt được mục tiêu */}
                        {!aimCalculation.isAchievable && (
                          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="mb-2 text-lg font-semibold text-destructive">
                                  Không thể đạt được mục tiêu này
                                </div>
                                <div className="space-y-2 text-sm text-foreground">
                                  <p>
                                    Mục tiêu GPA <span className="font-semibold">{aimCalculation.targetGpa.toFixed(2)}</span> vượt quá khả năng có thể đạt được.
                                  </p>
                                  <div className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="text-muted-foreground">GPA tối đa có thể đạt được</span>
                                      <Badge variant="default" className="text-base px-3 py-1">
                                        {aimCalculation.maxPossibleGpa?.toFixed(2) || 'N/A'}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      (Khi tất cả các môn còn lại đều đạt điểm A)
                                    </div>
                                  </div>
                                  <p className="mt-2">
                                    Để đạt được mục tiêu này, bạn cần có điểm trung bình{' '}
                                    <span className="font-semibold">{aimCalculation.requiredAverage.toFixed(2)}</span> cho các môn còn lại, 
                                    nhưng điểm tối đa chỉ có thể là 4.0.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Hiển thị chiến lược tối ưu cho từng môn */}
                        {aimCalculation.optimalStrategy && aimCalculation.optimalStrategy.length > 0 && (
                          <div className="mt-3 rounded-lg border border-border bg-card p-4">
                            <div className="mb-3 text-sm font-semibold text-foreground">
                                Chiến lược tối ưu:
                            </div>
                            <div className="space-y-2">
                              {aimCalculation.optimalStrategy.map((item, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg bg-muted p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">
                                        {item.subjectName}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-sm px-2.5 py-1">
                                        {item.credits} tín chỉ
                                      </Badge>
                                      <Badge
                                        variant="default"
                                        className={`text-sm px-2.5 py-1 ${
                                          item.requiredMark4 >= 3.5
                                            ? 'bg-green-600 text-white dark:bg-green-500'
                                            : item.requiredMark4 >= 2.5
                                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                                            : item.requiredMark4 >= 1.5
                                            ? 'bg-orange-600 text-white dark:bg-orange-500'
                                            : 'bg-red-600 text-white dark:bg-red-500'
                                        }`}
                                      >
                                        {item.requiredGrade}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Hiển thị GPA cuối cùng sau khi áp dụng chiến lược */}
                            {aimCalculation.finalGpaWithOptimal > 0 && (
                              <div className="mt-4 rounded-lg border border-border bg-muted p-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-foreground">
                                    GPA cuối cùng (sau khi áp dụng chiến lược):
                                  </div>
                                  <Badge
                                    variant="default"
                                    className={`text-base px-3 py-1 ${
                                      aimCalculation.finalGpaWithOptimal >= aimCalculation.targetGpa
                                        ? 'bg-green-600 text-white dark:bg-green-500'
                                        : 'bg-orange-600 text-white dark:bg-orange-500'
                                    }`}
                                  >
                                    {aimCalculation.finalGpaWithOptimal.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hiển thị các chiến lược khác */}
                        {aimCalculation.strategies && aimCalculation.strategies.length > 0 && (
                          <div className="mt-3 rounded-lg border border-border bg-card p-4">
                            <div className="mb-3 text-sm font-semibold text-foreground">
                              Các chiến lược khác:
                            </div>
                            <div className="space-y-3">
                              {aimCalculation.strategies.map((strategy, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg bg-muted p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="font-medium text-foreground">
                                      {strategy.description}
                                    </div>
                                    <Badge
                                      variant="default"
                                      className={`text-sm px-2.5 py-1 ${
                                        strategy.gpa >= aimCalculation.targetGpa
                                          ? 'bg-green-600 text-white dark:bg-green-500'
                                          : 'bg-orange-600 text-white dark:bg-orange-500'
                                      }`}
                                    >
                                      {strategy.gpa.toFixed(2)}
                                    </Badge>
                                  </div>
                                  
                                  {/* Hiển thị chi tiết từng môn */}
                                  {strategy.subjectDetails && strategy.subjectDetails.length > 0 && (
                                    <div className="mt-2 space-y-2 pt-2 border-t border-border">
                                      {strategy.subjectDetails.map((subject, subjIndex) => (
                                        <div
                                          key={subjIndex}
                                          className="flex items-center justify-between gap-2"
                                        >
                                          <span className="text-xs text-muted-foreground">
                                            {subject.name}
                                          </span>
                                          <Badge
                                            variant="default"
                                            className={`text-xs px-2 py-0.5 ${
                                              subject.mark4 >= 3.5
                                                ? 'bg-green-600 text-white dark:bg-green-500'
                                                : subject.mark4 >= 2.5
                                                ? 'bg-blue-600 text-white dark:bg-blue-500'
                                                : subject.mark4 >= 1.5
                                                ? 'bg-orange-600 text-white dark:bg-orange-500'
                                                : 'bg-red-600 text-white dark:bg-red-500'
                                            }`}
                                          >
                                            {subject.grade}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

              {!educationProgramLoading && !educationProgramError && incompleteSubjects.length === 0 && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center text-green-600 dark:text-green-400">
                  🎉 Chúc mừng! Bạn đã hoàn thành tất cả các môn học trong chương trình.
                </div>
              )}
            </>
          )}
      </div>
    </DashboardLayout>
  );
}

