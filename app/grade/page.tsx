'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore, { SubjectMark } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA, calculateGPAByYear } from '@/lib/services/gradeService';

type SortField = 'subjectName' | 'credits' | 'processMark' | 'examMark' | 'totalMark' | 'letterGrade';
type SortDirection = 'asc' | 'desc';

export default function GradePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { 
    subjectMarks,
    marksLoading,
    marksError,
    fetchSubjectMarks,
  } = useStudentStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Fetch subject marks when component mounts
    if (subjectMarks.length === 0 && !marksLoading) {
      fetchSubjectMarks();
    }
  }, [mounted, isAuthenticated]);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State cho modal hiển thị môn học theo kỳ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemesterMarks, setSelectedSemesterMarks] = useState<SubjectMark[]>([]);
  const [selectedSemesterName, setSelectedSemesterName] = useState<string>('');


  // Tính GPA trung bình toàn khóa và theo từng năm học
  const { overallGPA, yearGPAs } = useMemo(() => {
    // Debug: Log các môn không được tính vào GPA
    const excludedMarks = subjectMarks.filter(mark => !shouldCountInGPA(mark));
    if (excludedMarks.length > 0) {
      console.log('=== MARKS EXCLUDED FROM GPA ===', excludedMarks.length);
      excludedMarks.forEach(mark => {
        console.log('Excluded:', {
          subject: mark.subjectName,
          letterGrade: mark.letterGrade,
          mark4: mark.mark4,
          totalMark: mark.totalMark,
          isCounted: mark.isCounted,
          result: mark.result,
        });
      });
    }
    
    // Debug: Log các môn được tính vào GPA
    const includedMarks = subjectMarks.filter(mark => shouldCountInGPA(mark));
    console.log('=== MARKS INCLUDED IN GPA ===', includedMarks.length);
    console.log('Total credits:', includedMarks.reduce((sum, mark) => sum + (mark.credits || 0), 0));
    
    const overall = calculateGPA(subjectMarks);
    const byYear = calculateGPAByYear(subjectMarks);
    
    console.log('=== GPA CALCULATION ===');
    console.log('Overall GPA:', overall);
    console.log('Year GPAs:', byYear);
    
    return { overallGPA: overall, yearGPAs: byYear };
  }, [subjectMarks]);

  // Component để render bảng điểm
  const MarksTable = ({ 
    marks, 
    sortField: tableSortField, 
    setSortField: setTableSortField, 
    sortDirection: tableSortDirection, 
    setSortDirection: setTableSortDirection 
  }: { 
    marks: SubjectMark[];
    sortField: SortField | null;
    setSortField: (field: SortField | null) => void;
    sortDirection: SortDirection;
    setSortDirection: (dir: SortDirection) => void;
  }) => {
    const handleSort = (field: SortField) => {
      if (tableSortField === field) {
        setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setTableSortField(field);
        setTableSortDirection('asc');
      }
    };

    const sortedMarks = [...marks].sort((a, b) => {
      if (!tableSortField) return 0;

      let aValue: any = a[tableSortField];
      let bValue: any = b[tableSortField];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return tableSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (tableSortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    const getSortIcon = (field: SortField) => {
      if (tableSortField !== field) {
        return '↕️';
      }
      return tableSortDirection === 'asc' ? '↑' : '↓';
    };

    if (marks.length === 0) {
      return null;
    }

    return (
      <div className="mb-8 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-600">
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                  STT
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('subjectName')}
                >
                  <div className="flex items-center gap-2">
                    Tên môn học
                    <span className="text-xs">{getSortIcon('subjectName')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('credits')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tín chỉ
                    <span className="text-xs">{getSortIcon('credits')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('processMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Điểm quá trình
                    <span className="text-xs">{getSortIcon('processMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('examMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Điểm thi
                    <span className="text-xs">{getSortIcon('examMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('totalMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tổng điểm
                    <span className="text-xs">{getSortIcon('totalMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => handleSort('letterGrade')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Điểm chữ
                    <span className="text-xs">{getSortIcon('letterGrade')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMarks.map((mark, index) => (
                <tr
                  key={index}
                  className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                >
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {mark.subjectName || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50">
                    {mark.credits !== undefined ? mark.credits : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50">
                    {mark.processMark !== undefined 
                      ? mark.processMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50">
                    {mark.examMark !== undefined 
                      ? mark.examMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50 font-semibold">
                    {mark.totalMark !== undefined 
                      ? mark.totalMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-50 font-semibold">
                    {mark.letterGrade || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
              Xem điểm
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
          {marksLoading && (
            <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              Đang tải điểm môn học...
            </div>
          )}

          {marksError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {marksError}
            </div>
          )}

          {!marksLoading && !marksError && subjectMarks.length === 0 && (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
              Chưa có dữ liệu điểm môn học. Vui lòng thử lại sau.
            </div>
          )}

          {/* Phần tính GPA */}
          {!marksLoading && !marksError && subjectMarks.length > 0 && (
            <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Kết quả học tập
              </h2>
              
              {/* GPA trung bình toàn khóa */}
              <div className="mb-6">
                <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                      GPA trung bình toàn khóa:
                    </span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {overallGPA.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Tổng số tín chỉ: {subjectMarks.filter(mark => shouldCountInGPA(mark)).reduce((sum, mark) => sum + (mark.credits || 0), 0)}
                  </div>
                </div>
              </div>

              {/* GPA theo từng năm học */}
              {yearGPAs.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    GPA theo từng năm học
                  </h3>
                  <div className="space-y-6">
                    {yearGPAs.map((yearData, yearIndex) => (
                      <div
                        key={yearIndex}
                        className="rounded-lg bg-white p-5 shadow-sm dark:bg-zinc-800"
                      >
                        <h4 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
                          Năm học {yearData.year}
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {yearData.semesters.map((semester, semesterIndex) => {
                            // Lấy danh sách môn học của kỳ này
                            const semesterMarks = subjectMarks.filter(
                              mark => (mark.semesterCode || mark.semesterName) === semester.semester
                            );
                            
                            return (
                              <div
                                key={semesterIndex}
                                className="cursor-pointer rounded-lg bg-zinc-50 p-4 transition-colors hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                                onClick={() => {
                                  setSelectedSemesterMarks(semesterMarks);
                                  setSelectedSemesterName(semester.semester);
                                  setIsModalOpen(true);
                                }}
                              >
                                <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  {semester.semester}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                    GPA:
                                  </span>
                                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {semester.gpa.toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  {semester.credits} tín chỉ
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bảng điểm */}
          {!marksLoading && !marksError && subjectMarks.length > 0 && (
            <MarksTable
              marks={subjectMarks}
              sortField={sortField}
              setSortField={setSortField}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
            />
          )}
        </div>
      </main>

      {/* Modal hiển thị môn học theo kỳ */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Môn học kỳ {selectedSemesterName}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {selectedSemesterMarks.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Không có môn học nào trong kỳ này
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSemesterMarks.map((mark, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900 dark:text-zinc-50">
                          {mark.subjectName || `Môn học ${index + 1}`}
                        </div>
                        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {mark.credits !== undefined ? `${mark.credits} tín chỉ` : ''}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {mark.letterGrade || '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

