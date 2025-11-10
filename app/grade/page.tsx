'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore, { SubjectMark } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA, calculateGPAByYear } from '@/lib/services/gradeService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, ArrowUpDown, Filter, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';

export default function GradePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { 
    subjectMarks,
    marksLoading,
    marksError,
    marksSearchQuery,
    setMarksSearchQuery,
    marksFilters,
    setMarksFilters,
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

  // State cho modal hiển thị môn học theo kỳ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemesterMarks, setSelectedSemesterMarks] = useState<SubjectMark[]>([]);
  const [selectedSemesterName, setSelectedSemesterName] = useState<string>('');

  // Định nghĩa columns cho data table
  const columns: ColumnDef<SubjectMark>[] = useMemo(() => [
    {
      accessorKey: 'index',
      header: 'STT',
      cell: ({ row }) => {
        return <div className="text-center">{row.index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: 'subjectName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 hover:bg-transparent"
          >
            Tên môn học
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div>{row.getValue('subjectName') || '-'}</div>;
      },
    },
    {
      accessorKey: 'credits',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Tín chỉ
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const credits = row.getValue('credits') as number | undefined;
        return <div className="text-center">{credits !== undefined ? credits : '-'}</div>;
      },
    },
    {
      accessorKey: 'isCounted',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Môn tính điểm
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const isCounted = row.getValue('isCounted') as boolean | undefined;
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isCounted === true}
              disabled
              aria-label={isCounted === true ? 'Môn tính điểm' : 'Môn không tính điểm'}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'processMark',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Điểm quá trình
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const mark = row.getValue('processMark') as number | undefined;
        return <div className="text-center">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'examMark',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Điểm thi
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const mark = row.getValue('examMark') as number | undefined;
        return <div className="text-center">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'totalMark',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Tổng điểm
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const mark = row.getValue('totalMark') as number | undefined;
        return <div className="text-center font-semibold">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'letterGrade',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Điểm chữ
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const grade = row.getValue('letterGrade') as string | undefined;
        return <div className="text-center font-semibold">{grade || '-'}</div>;
      },
    },
  ], []);

  // Lọc dữ liệu theo filters
  const filteredMarks = useMemo(() => {
    return subjectMarks.filter((mark) => {
      // Filter theo pass status
      if (marksFilters.passStatus !== 'all') {
        const letterGrade = mark.letterGrade?.toUpperCase();
        // Đã qua: không phải F, I, hoặc có result === 1
        const isPassed = letterGrade && 
          letterGrade !== 'F' && 
          letterGrade !== 'I' &&
          (mark.result === 1 || (mark.result === undefined && letterGrade !== 'F'));
        
        if (marksFilters.passStatus === 'passed' && !isPassed) return false;
        if (marksFilters.passStatus === 'failed' && isPassed) return false;
      }

      // Filter theo letter grade
      if (marksFilters.letterGrade !== 'all') {
        const grade = mark.letterGrade?.toUpperCase();
        if (grade !== marksFilters.letterGrade) return false;
      }

      // Filter theo isCounted
      if (marksFilters.isCounted !== 'all') {
        if (marksFilters.isCounted === 'yes' && mark.isCounted !== true) return false;
        if (marksFilters.isCounted === 'no' && mark.isCounted !== false) return false;
      }

      // Filter theo credits
      if (marksFilters.credits !== 'all') {
        const credits = mark.credits || 0;
        switch (marksFilters.credits) {
          case '1':
            if (credits !== 1) return false;
            break;
          case '2':
            if (credits !== 2) return false;
            break;
          case '3':
            if (credits !== 3) return false;
            break;
          case 'above3':
            if (credits <= 3) return false;
            break;
        }
      }

      return true;
    });
  }, [subjectMarks, marksFilters]);

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

  // Component filter UI trong popover
  const FilterPopover = () => {
    const isLetterGradeDisabled = marksFilters.passStatus === 'failed';
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Lọc"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] max-w-96 max-h-[80vh] overflow-y-auto" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-4">Bộ lọc</h4>
            </div>
            
            {/* Pass Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trạng thái:</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={marksFilters.passStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMarksFilters({ passStatus: 'all' });
                    if (marksFilters.letterGrade !== 'all') {
                      setMarksFilters({ letterGrade: 'all' });
                    }
                  }}
                >
                  Tất cả
                </Button>
                <Button
                  variant={marksFilters.passStatus === 'passed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMarksFilters({ passStatus: 'passed' });
                    if (marksFilters.letterGrade !== 'all') {
                      setMarksFilters({ letterGrade: 'all' });
                    }
                  }}
                >
                  Đã qua
                </Button>
                <Button
                  variant={marksFilters.passStatus === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMarksFilters({ passStatus: 'failed', letterGrade: 'all' });
                  }}
                >
                  Trượt
                </Button>
              </div>
            </div>

            {/* Letter Grade Filter */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${isLetterGradeDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                Điểm chữ:
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={marksFilters.letterGrade === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ letterGrade: 'all' })}
                  disabled={isLetterGradeDisabled}
                >
                  Tất cả
                </Button>
                <Button
                  variant={marksFilters.letterGrade === 'A' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ letterGrade: 'A' })}
                  disabled={isLetterGradeDisabled}
                >
                  A
                </Button>
                <Button
                  variant={marksFilters.letterGrade === 'B' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ letterGrade: 'B' })}
                  disabled={isLetterGradeDisabled}
                >
                  B
                </Button>
                <Button
                  variant={marksFilters.letterGrade === 'C' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ letterGrade: 'C' })}
                  disabled={isLetterGradeDisabled}
                >
                  C
                </Button>
                <Button
                  variant={marksFilters.letterGrade === 'D' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ letterGrade: 'D' })}
                  disabled={isLetterGradeDisabled}
                >
                  D
                </Button>
              </div>
              {isLetterGradeDisabled && (
                <p className="text-xs text-muted-foreground">
                  Không thể chọn điểm chữ khi đã chọn "Trượt"
                </p>
              )}
            </div>

            {/* IsCounted Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Môn tính điểm:</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={marksFilters.isCounted === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ isCounted: 'all' })}
                >
                  Tất cả
                </Button>
                <Button
                  variant={marksFilters.isCounted === 'yes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ isCounted: 'yes' })}
                >
                  Có
                </Button>
                <Button
                  variant={marksFilters.isCounted === 'no' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ isCounted: 'no' })}
                >
                  Không
                </Button>
              </div>
            </div>

            {/* Credits Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số tín chỉ:</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={marksFilters.credits === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ credits: 'all' })}
                >
                  Tất cả
                </Button>
                <Button
                  variant={marksFilters.credits === '1' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ credits: '1' })}
                >
                  1 tín
                </Button>
                <Button
                  variant={marksFilters.credits === '2' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ credits: '2' })}
                >
                  2 tín
                </Button>
                <Button
                  variant={marksFilters.credits === '3' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ credits: '3' })}
                >
                  3 tín
                </Button>
                <Button
                  variant={marksFilters.credits === 'above3' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarksFilters({ credits: 'above3' })}
                >
                  Trên 3 tín
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
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
      <div className="space-y-6 overflow-x-hidden">
          {marksLoading && (
            <div className="space-y-6">
              {/* Skeleton cho GPA */}
              <div className="rounded-lg border border-border bg-card p-4 md:p-6">
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
              <div className="rounded-lg border border-border bg-card p-4 md:p-6">
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
            <div className="mb-6 rounded-lg border border-border bg-card p-4 md:p-6">
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
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-base font-semibold text-foreground">
                            Năm học {yearData.year}
                          </h4>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Điểm trung bình năm học:
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              {yearData.yearGPA.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {yearData.yearCredits} tín chỉ
                            </div>
                          </div>
                        </div>
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
            <div className="mb-8 rounded-lg border border-border bg-card p-4 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm môn học, điểm, kỳ học..."
                    value={marksSearchQuery ?? ""}
                    onChange={(e) => setMarksSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <FilterPopover />
              </div>
              <div className="overflow-x-auto">
                <DataTable 
                  columns={columns} 
                  data={filteredMarks}
                  searchQuery={marksSearchQuery}
                  onSearchChange={setMarksSearchQuery}
                  getRowClassName={(row) => {
                    const grade = row.letterGrade?.toUpperCase();
                    return grade === 'F' ? 'bg-red-500/10 dark:bg-red-500/20' : '';
                  }}
                />
              </div>
            </div>
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

