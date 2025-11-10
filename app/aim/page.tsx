'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import { calculateAimPageData } from '@/lib/services/aimService';

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Đặt mục tiêu GPA
            </h1>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
            >
              Về trang chủ
            </button>
          </div>
        </div>
        
        <div className="w-full px-8 py-6 pb-24">
          {educationProgramLoading && (
            <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              Đang tải thông tin chương trình học...
            </div>
          )}

          {educationProgramError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {educationProgramError}
            </div>
          )}

          {!educationProgramLoading && !educationProgramError && (
            <>
              {/* Hiển thị số tín chỉ */}
              <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
                <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Tổng quan
                </h2>
                
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                        Tín chỉ đã học / Tổng số tín chỉ:
                      </span>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {passedCredits} / {totalCredits}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                        <span>Tiến độ hoàn thành</span>
                        <span>
                          {totalCredits > 0 
                            ? ((passedCredits / totalCredits) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                          style={{
                            width: `${totalCredits > 0 ? (passedCredits / totalCredits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                        GPA (điểm trung bình):
                      </span>
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {gpa.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      Tính từ các môn đã hoàn thành (thang điểm 4.0)
                    </div>
                  </div>
                  
                  {/* Input để đặt aim GPA */}
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-800">
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Đặt mục tiêu GPA:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.1"
                        value={inputTargetGpa}
                        onChange={(e) => {
                          setInputTargetGpa(e.target.value);
                          setValidationError(''); // Xóa lỗi khi người dùng nhập lại
                        }}
                        placeholder="VD: 3.5"
                        className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:focus:border-blue-400"
                      />
                      <button
                        onClick={() => {
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
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Tính
                      </button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        (thang điểm 4.0)
                      </span>
                    </div>
                    {validationError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {validationError}
                      </div>
                    )}
                  </div>
                  
                  {/* Hiển thị kết quả tính toán aim */}
                  {aimCalculation && (
                    <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-sm dark:from-purple-900/20 dark:to-pink-900/20">
                      <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Kết quả tính toán
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">GPA hiện tại:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {aimCalculation.currentGpa.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Mục tiêu GPA:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {aimCalculation.targetGpa.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Tín chỉ đã học:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {aimCalculation.currentCredits}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Tín chỉ còn lại:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {aimCalculation.remainingCredits}
                          </span>
                        </div>
                        
                        {/* Hiển thị thông báo nếu không thể đạt được mục tiêu */}
                        {!aimCalculation.isAchievable && (
                          <div className="mt-4 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 p-4 dark:from-red-900/20 dark:to-orange-900/20">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">⚠️</div>
                              <div className="flex-1">
                                <div className="mb-2 text-lg font-semibold text-red-900 dark:text-red-300">
                                  Không thể đạt được mục tiêu này
                                </div>
                                <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                                  <p>
                                    Mục tiêu GPA <span className="font-semibold">{aimCalculation.targetGpa.toFixed(2)}</span> vượt quá khả năng có thể đạt được.
                                  </p>
                                  <div className="rounded-lg bg-white p-3 dark:bg-zinc-800">
                                    <div className="flex items-center justify-between">
                                      <span className="text-zinc-600 dark:text-zinc-400">GPA tối đa có thể đạt được:</span>
                                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {aimCalculation.maxPossibleGpa?.toFixed(2) || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
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
                          <div className="mt-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-900/20 dark:to-teal-900/20">
                            <div className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              ⭐ Chiến lược tối ưu (theo từng môn):
                            </div>
                            <div className="space-y-2">
                              {aimCalculation.optimalStrategy.map((item, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg bg-white p-3 dark:bg-zinc-800"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                        {item.subjectName}
                                      </div>
                                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {item.credits} tín chỉ
                                      </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Cần đạt:
                                      </div>
                                      <div
                                        className={`text-xl font-bold ${
                                          item.requiredMark4 >= 3.5
                                            ? 'text-green-600 dark:text-green-400'
                                            : item.requiredMark4 >= 2.5
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : item.requiredMark4 >= 1.5
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}
                                      >
                                        {item.requiredGrade}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Hiển thị GPA cuối cùng sau khi áp dụng chiến lược */}
                            {aimCalculation.finalGpaWithOptimal > 0 && (
                              <div className="mt-4 rounded-lg bg-white p-3 dark:bg-zinc-800">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                      GPA cuối cùng (sau khi áp dụng chiến lược):
                                    </div>
                                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                      Mục tiêu: {aimCalculation.targetGpa.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className={`text-2xl font-bold ${
                                        aimCalculation.finalGpaWithOptimal >= aimCalculation.targetGpa
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-orange-600 dark:text-orange-400'
                                      }`}
                                    >
                                      {aimCalculation.finalGpaWithOptimal.toFixed(2)}
                                    </div>
                                    {aimCalculation.finalGpaWithOptimal >= aimCalculation.targetGpa ? (
                                      <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ Đạt mục tiêu
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                        ⚠ Thiếu {(aimCalculation.targetGpa - aimCalculation.finalGpaWithOptimal).toFixed(2)} điểm
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hiển thị các chiến lược khác */}
                        {aimCalculation.strategies && aimCalculation.strategies.length > 0 && (
                          <div className="mt-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-indigo-900/20 dark:to-purple-900/20">
                            <div className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              Các chiến lược khác:
                            </div>
                            <div className="space-y-3">
                              {aimCalculation.strategies.map((strategy, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg bg-white p-3 dark:bg-zinc-800"
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                      {strategy.description}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        GPA cuối:
                                      </div>
                                      <div
                                        className={`text-lg font-bold ${
                                          strategy.gpa >= aimCalculation.targetGpa
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-orange-600 dark:text-orange-400'
                                        }`}
                                      >
                                        {strategy.gpa.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Hiển thị chi tiết từng môn */}
                                  {strategy.subjectDetails && strategy.subjectDetails.length > 0 && (
                                    <div className="mt-2 space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                                      {strategy.subjectDetails.map((subject, subjIndex) => (
                                        <div
                                          key={subjIndex}
                                          className="flex items-center justify-between text-xs"
                                        >
                                          <span className="text-zinc-600 dark:text-zinc-400">
                                            {subject.name}
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              subject.mark4 >= 3.5
                                                ? 'text-green-600 dark:text-green-400'
                                                : subject.mark4 >= 2.5
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : subject.mark4 >= 1.5
                                                ? 'text-orange-600 dark:text-orange-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}
                                          >
                                            {subject.grade}
                                          </span>
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
                </div>
              </div>

              {!educationProgramLoading && !educationProgramError && incompleteSubjects.length === 0 && (
                <div className="rounded-lg bg-green-50 p-4 text-center text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  🎉 Chúc mừng! Bạn đã hoàn thành tất cả các môn học trong chương trình.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

