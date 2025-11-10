'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore, { SubjectMark } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA, calculateGPAByYear } from '@/lib/services/gradeService';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground">
                  STT
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('subjectName')}
                >
                  <div className="flex items-center gap-2">
                    Tên môn học
                    <span className="text-xs">{getSortIcon('subjectName')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('credits')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tín chỉ
                    <span className="text-xs">{getSortIcon('credits')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('processMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Điểm quá trình
                    <span className="text-xs">{getSortIcon('processMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('examMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Điểm thi
                    <span className="text-xs">{getSortIcon('examMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('totalMark')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tổng điểm
                    <span className="text-xs">{getSortIcon('totalMark')}</span>
                  </div>
                </th>
                <th 
                  className="whitespace-nowrap px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
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
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-foreground">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {mark.subjectName || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {mark.credits !== undefined ? mark.credits : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {mark.processMark !== undefined 
                      ? mark.processMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {mark.examMark !== undefined 
                      ? mark.examMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground font-semibold">
                    {mark.totalMark !== undefined 
                      ? mark.totalMark.toFixed(2) 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground font-semibold">
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
    <DashboardLayout>
      <div className="space-y-6">
          {marksLoading && (
            <div className="space-y-6">
              {/* Skeleton cho GPA */}
              <div className="rounded-lg border border-border bg-card p-6">
                <Skeleton className="mb-4 h-7 w-48" />
                <div className="mb-6">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-56" />
                      <Skeleton className="h-9 w-16" />
                    </div>
                    <Skeleton className="mt-2 h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="mb-4 h-6 w-48" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted p-4">
                      <Skeleton className="mb-2 h-4 w-24" />
                      <Skeleton className="mb-1 h-6 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Skeleton cho bảng điểm */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3"><Skeleton className="h-4 w-8" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-24" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {marksError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {marksError}
            </div>
          )}

          {!marksLoading && !marksError && subjectMarks.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Chưa có dữ liệu điểm môn học. Vui lòng thử lại sau.
            </div>
          )}

          {/* Phần tính GPA */}
          {!marksLoading && !marksError && subjectMarks.length > 0 && (
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Kết quả học tập
              </h2>
              
              {/* GPA trung bình toàn khóa */}
              <div className="mb-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-muted-foreground">
                      GPA trung bình toàn khóa:
                    </span>
                    <span className="text-3xl font-bold text-primary">
                      {overallGPA.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Tổng số tín chỉ: {subjectMarks.filter(mark => shouldCountInGPA(mark)).reduce((sum, mark) => sum + (mark.credits || 0), 0)}
                  </div>
                </div>
              </div>

              {/* GPA theo từng năm học */}
              {yearGPAs.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    GPA theo từng năm học
                  </h3>
                  <div className="space-y-6">
                    {yearGPAs.map((yearData, yearIndex) => (
                      <div
                        key={yearIndex}
                        className="rounded-lg border border-border bg-card p-5"
                      >
                        <h4 className="mb-4 text-base font-semibold text-foreground">
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
                                className="cursor-pointer rounded-lg border border-border bg-muted p-4 transition-colors hover:bg-muted/80"
                                onClick={() => {
                                  setSelectedSemesterMarks(semesterMarks);
                                  setSelectedSemesterName(semester.semester);
                                  setIsModalOpen(true);
                                }}
                              >
                                <div className="mb-2 text-sm font-medium text-foreground">
                                  {semester.semester}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    GPA:
                                  </span>
                                  <span className="text-xl font-bold text-primary">
                                    {semester.gpa.toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
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

      {/* Modal hiển thị môn học theo kỳ */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  Môn học kỳ {selectedSemesterName}
                </h3>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {selectedSemesterMarks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Không có môn học nào trong kỳ này
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSemesterMarks.map((mark, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {mark.subjectName || `Môn học ${index + 1}`}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {mark.credits !== undefined ? `${mark.credits} tín chỉ` : ''}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-semibold text-primary">
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
    </DashboardLayout>
  );
}

