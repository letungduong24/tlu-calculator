'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore, { SubjectMark } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA, calculateGPAByYear, processRetakeSubjects } from '@/lib/services/gradeService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, LayoutGrid, Table as TableIcon, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

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
      router.push('/');
      return;
    }
    
    // Fetch subject marks when component mounts
    if (subjectMarks.length === 0 && !marksLoading) {
      fetchSubjectMarks();
    }
  }, [mounted, isAuthenticated]);

  // State cho dialog hiển thị môn học theo kỳ
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSemesterMarks, setSelectedSemesterMarks] = useState<SubjectMark[]>([]);
  const [selectedSemesterName, setSelectedSemesterName] = useState<string>('');

  // State cho view mode (table hoặc card)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

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
      header: 'Tên môn học',
      cell: ({ row }) => {
        const subjectName = row.getValue('subjectName') as string | undefined;
        return (
          <div className="max-w-[200px] truncate" title={subjectName}>
            {subjectName || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'credits',
      header: () => <div className="text-center">Tín chỉ</div>,
      cell: ({ row }) => {
        const credits = row.getValue('credits') as number | undefined;
        return <div className="text-center">{credits !== undefined ? credits : '-'}</div>;
      },
    },
    {
      accessorKey: 'isCounted',
      header: () => <div className="text-center">Môn tính điểm</div>,
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
      header: () => <div className="text-center">Điểm quá trình</div>,
      cell: ({ row }) => {
        const mark = row.getValue('processMark') as number | undefined;
        return <div className="text-center">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'examMark',
      header: () => <div className="text-center">Điểm thi</div>,
      cell: ({ row }) => {
        const mark = row.getValue('examMark') as number | undefined;
        return <div className="text-center">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'totalMark',
      header: () => <div className="text-center">Tổng điểm</div>,
      cell: ({ row }) => {
        const mark = row.getValue('totalMark') as number | undefined;
        return <div className="text-center font-semibold">{mark !== undefined ? mark.toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'letterGrade',
      header: () => <div className="text-center">Điểm chữ</div>,
      cell: ({ row }) => {
        const grade = row.getValue('letterGrade') as string | undefined;
        return <div className="text-center font-semibold">{grade || '-'}</div>;
      },
    },
  ], []);

  // Lọc dữ liệu
  const filteredAndSortedMarks = useMemo(() => {
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

      // Filter theo search query
      if (marksSearchQuery) {
        const search = marksSearchQuery.toLowerCase().trim();
        const subjectName = String(mark.subjectName || '').toLowerCase();
        const letterGrade = String(mark.letterGrade || '').toLowerCase();
        const semesterCode = String(mark.semesterCode || '').toLowerCase();
        const semesterName = String(mark.semesterName || '').toLowerCase();
        const credits = String(mark.credits || '').toLowerCase();
        const totalMark = String(mark.totalMark || '').toLowerCase();
        
        if (
          !subjectName.includes(search) &&
          !letterGrade.includes(search) &&
          !semesterCode.includes(search) &&
          !semesterName.includes(search) &&
          !credits.includes(search) &&
          !totalMark.includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [subjectMarks, marksFilters, marksSearchQuery]);

  // Tính GPA trung bình toàn khóa và theo từng năm học
  const { overallGPA, yearGPAs, processedMarksForCredits } = useMemo(() => {
    // Xử lý môn học cải thiện: chỉ tính một lần cho mỗi môn học cải thiện
    const processedMarks = processRetakeSubjects(subjectMarks);
    
    // Debug: Log các môn không được tính vào GPA
    const excludedMarks = processedMarks.filter(mark => !shouldCountInGPA(mark));
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
    const includedMarks = processedMarks.filter(mark => shouldCountInGPA(mark));
    console.log('=== MARKS INCLUDED IN GPA ===', includedMarks.length);
    console.log('Total credits:', includedMarks.reduce((sum, mark) => sum + (mark.credits || 0), 0));
    
    const overall = calculateGPA(subjectMarks);
    const byYear = calculateGPAByYear(subjectMarks);
    
    console.log('=== GPA CALCULATION ===');
    console.log('Overall GPA:', overall);
    console.log('Year GPAs:', byYear);
    
    return { overallGPA: overall, yearGPAs: byYear, processedMarksForCredits: processedMarks };
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
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto mx-4" align="start">
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
      <div className="space-y-6">
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
                <Skeleton className="mb-4 h-7 w-48" />
                <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-full" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-8" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                GPA
              </h2>
              
              <div className="w-full">
                {/* GPA toàn khóa - không có accordion, chỉ hiển thị badges */}
                <div className="border-b border-border py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <h4 className="text-base font-semibold text-foreground text-left">
                      GPA toàn khóa
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className="text-sm px-2.5 py-1 whitespace-nowrap">
                        GPA: {overallGPA.toFixed(2)}
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-2.5 py-1 whitespace-nowrap">
                        Tổng số tín chỉ: {processedMarksForCredits.filter(mark => shouldCountInGPA(mark)).reduce((sum, mark) => sum + (mark.credits || 0), 0)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* GPA theo từng năm học */}
                <Accordion type="single" collapsible className="w-full">
                  {yearGPAs.map((yearData, yearIndex) => (
                    <AccordionItem
                      key={yearIndex}
                      value={`year-${yearIndex}`}
                      className="border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <h4 className="text-base font-semibold text-foreground text-left">
                            Năm học {yearData.year}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default" className="text-sm px-2.5 py-1 whitespace-nowrap">
                              GPA: {yearData.yearGPA.toFixed(2)}
                            </Badge>
                            <Badge variant="secondary" className="text-sm px-2.5 py-1 whitespace-nowrap">
                              {yearData.yearCredits} tín chỉ
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3 pt-2">
                          {yearData.semesters.map((semester, semesterIndex) => {
                            // Lấy danh sách môn học của kỳ này
                            const semesterMarks = subjectMarks.filter(
                              mark => (mark.semesterCode || mark.semesterName) === semester.semester
                            );
                            
                            return (
                              <div
                                key={semesterIndex}
                                className="cursor-pointer rounded-2xl border border-border bg-muted p-3 transition-colors hover:bg-muted/80 w-full"
                                onClick={() => {
                                  setSelectedSemesterMarks(semesterMarks);
                                  setSelectedSemesterName(semester.semester);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-foreground">
                                      {semester.semester}
                                    </div>
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                      Click để xem
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="text-sm px-2.5 py-1 whitespace-nowrap">
                                      GPA: {semester.gpa.toFixed(2)}
                                    </Badge>
                                    <Badge variant="outline" className="text-sm px-2.5 py-1 whitespace-nowrap">
                                      {semester.credits} tín chỉ
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}

          {!marksLoading && !marksError && subjectMarks.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Bảng điểm môn học
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    aria-label="Hiển thị dạng bảng"
                  >
                    <TableIcon className="h-4 w-4 mr-2" />
                    Bảng
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    aria-label="Hiển thị dạng thẻ"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Thẻ
                  </Button>
                </div>
              </div>
              <div className="mb-4 flex flex-row items-center gap-2">
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
              
              {filteredAndSortedMarks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {marksSearchQuery ? "Không tìm thấy kết quả." : "Không có dữ liệu."}
                </div>
              ) : (
                <>
                  {viewMode === 'table' ? (
                    <div className="w-full overflow-x-auto">
                      <DataTable 
                        columns={columns} 
                        data={filteredAndSortedMarks}
                        searchQuery={marksSearchQuery}
                        onSearchChange={setMarksSearchQuery}
                        getRowClassName={(row) => {
                          const grade = row.letterGrade?.toUpperCase();
                          return grade === 'F' ? 'bg-red-500/10 dark:bg-red-500/20' : '';
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        {filteredAndSortedMarks.length} môn học
                        {marksSearchQuery && ` (trong tổng số ${subjectMarks.length} môn học)`}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAndSortedMarks.map((mark, index) => {
                          const grade = mark.letterGrade?.toUpperCase();
                          const isFailed = grade === 'F';
                          
                          return (
                            <Card
                              key={index}
                              className={`transition-all hover:shadow-md ${
                                isFailed ? 'border-red-500/50 bg-red-500/5 dark:bg-red-500/10' : ''
                              }`}
                            >
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base line-clamp-2">
                                  {mark.subjectName || `Môn học ${index + 1}`}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Tín chỉ:</span>
                                  <span className="font-medium">{mark.credits !== undefined ? mark.credits : '-'}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Môn tính điểm:</span>
                                  <Checkbox
                                    checked={mark.isCounted === true}
                                    disabled
                                    aria-label={mark.isCounted === true ? 'Môn tính điểm' : 'Môn không tính điểm'}
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Điểm quá trình:</span>
                                  <span className="font-medium">
                                    {mark.processMark !== undefined ? mark.processMark.toFixed(2) : '-'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Điểm thi:</span>
                                  <span className="font-medium">
                                    {mark.examMark !== undefined ? mark.examMark.toFixed(2) : '-'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-sm font-medium">Tổng điểm:</span>
                                  <span className="text-lg font-semibold">
                                    {mark.totalMark !== undefined ? mark.totalMark.toFixed(2) : '-'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-sm font-medium">Điểm chữ:</span>
                                  <Badge 
                                    variant={isFailed ? 'destructive' : 'default'}
                                    className="text-base px-3 py-1"
                                  >
                                    {mark.letterGrade || '-'}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
      </div>

      {/* Dialog hiển thị môn học theo kỳ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Môn học kỳ {selectedSemesterName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {selectedSemesterMarks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Không có môn học nào trong kỳ này
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSemesterMarks.map((mark, index) => {
                  const grade = mark.letterGrade?.toUpperCase();
                  const isFailed = grade === 'F';
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground break-words">
                          {mark.subjectName || `Môn học ${index + 1}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {mark.credits !== undefined && (
                          <Badge variant="secondary" className="text-sm px-2.5 py-1 whitespace-nowrap">
                            {mark.credits} tín chỉ
                          </Badge>
                        )}
                        <Badge 
                          variant={isFailed ? 'destructive' : 'default'}
                          className="text-sm px-2.5 py-1 whitespace-nowrap"
                        >
                          {mark.letterGrade || '-'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

