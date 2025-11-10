import { SubjectMark } from '@/store/studentStore';

/**
 * Kiểm tra xem môn học có được tính vào GPA không
 */
export const shouldCountInGPA = (mark: SubjectMark): boolean => {
  // Không tính nếu isCounted === false
  if (mark.isCounted === false) {
    return false;
  }
  
  // Không tính nếu result có giá trị và !== 1
  if (mark.result !== undefined && mark.result !== null && mark.result !== 1) {
    return false;
  }
  
  // Không tính nếu letterGrade === 'F'
  if (mark.letterGrade === 'F' || mark.letterGrade === 'f') {
    return false;
  }
  
  // Phải có điểm hợp lệ (mark4 hoặc totalMark)
  const hasValidMark = (mark.mark4 !== undefined && mark.mark4 !== null) ||
                      (mark.totalMark !== undefined && mark.totalMark !== null);
  
  if (!hasValidMark) {
    return false;
  }
  
  // Phải có tín chỉ > 0
  if (!mark.credits || mark.credits <= 0) {
    return false;
  }
  
  return true;
};

/**
 * Tính GPA từ danh sách môn học (chỉ tính các môn được tính vào GPA)
 */
export const calculateGPA = (marks: SubjectMark[]): number => {
  let totalPoints = 0;
  let totalCredits = 0;
  const calculationDetails: Array<{ subject: string; mark4: number | undefined; credits: number; points: number }> = [];

  marks.forEach((mark) => {
    // Chỉ tính các môn được tính vào GPA
    if (!shouldCountInGPA(mark)) {
      return;
    }

    if (mark.credits && mark.credits > 0) {
      // Ưu tiên dùng mark4 (điểm thang 4) nếu có
      let gradePoint: number | null = null;
      if (mark.mark4 !== undefined && mark.mark4 !== null) {
        gradePoint = mark.mark4;
      } else if (mark.totalMark !== undefined && mark.totalMark !== null) {
        // Fallback: quy đổi từ thang 10 sang thang 4
        gradePoint = mark.totalMark / 2.5;
      }
      
      // Tính vào GPA (kể cả điểm > 0, vì điểm D (1.0) vẫn được tính)
      if (gradePoint !== null) {
        const points = gradePoint * mark.credits;
        totalPoints += points;
        totalCredits += mark.credits;
        calculationDetails.push({
          subject: mark.subjectName || '-',
          mark4: mark.mark4,
          credits: mark.credits,
          points: points,
        });
      }
    }
  });

  if (totalCredits === 0) return 0;
  const gpa = totalPoints / totalCredits;
  
  // Debug log
  console.log('=== GPA CALCULATION DETAILS ===');
  console.log('Total points:', totalPoints);
  console.log('Total credits:', totalCredits);
  console.log('GPA:', gpa);
  console.log('Details:', calculationDetails);
  
  return gpa;
};

/**
 * Extract năm học từ semester code (ví dụ: "2_2022_2023" -> "2022-2023")
 */
export const extractSchoolYear = (
  semesterCode: string | undefined,
  semesterName: string | undefined
): string | null => {
  const code = semesterCode || semesterName;
  if (!code) return null;
  
  // Format: "2_2022_2023" hoặc "2022-2023"
  const match = code.match(/(\d{4})[_-](\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  // Nếu không match, thử tìm 4 số liên tiếp
  const yearMatch = code.match(/(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return `${year}-${year + 1}`;
  }
  
  return null;
};

export interface SemesterGPA {
  semester: string;
  gpa: number;
  credits: number;
}

export interface YearGPA {
  year: string;
  semesters: SemesterGPA[];
  yearGPA: number;
  yearCredits: number;
}

/**
 * Tính GPA theo từng năm học, trong mỗi năm có các kỳ
 */
export const calculateGPAByYear = (marks: SubjectMark[]): YearGPA[] => {
  // Bước 1: Nhóm theo năm học
  const yearMap = new Map<string, SubjectMark[]>();

  marks.forEach((mark) => {
    // Extract năm học từ semester
    const schoolYear = extractSchoolYear(mark.semesterCode, mark.semesterName);
    if (!schoolYear) {
      return; // Bỏ qua môn không có thông tin năm học
    }
    
    if (!yearMap.has(schoolYear)) {
      yearMap.set(schoolYear, []);
    }
    yearMap.get(schoolYear)!.push(mark);
  });

  const yearData: Array<{ 
    year: string; 
    sortKey: number;
    semesters: SemesterGPA[];
    yearGPA: number;
    yearCredits: number;
  }> = [];

  yearMap.forEach((yearMarks, schoolYear) => {
    // Bước 2: Trong mỗi năm học, nhóm theo kỳ
    const semesterMap = new Map<string, SubjectMark[]>();
    
    yearMarks.forEach((mark) => {
      const semesterKey = mark.semesterCode || mark.semesterName;
      if (!semesterKey) {
        return;
      }
      
      if (!semesterMap.has(semesterKey)) {
        semesterMap.set(semesterKey, []);
      }
      semesterMap.get(semesterKey)!.push(mark);
    });

    // Bước 3: Tính GPA cho từng kỳ trong năm học này
    const semesterGPAs: Array<{ semester: string; gpa: number; credits: number; sortKey: number }> = [];
    
    semesterMap.forEach((semesterMarks, semesterKey) => {
      const gpa = calculateGPA(semesterMarks);
      const credits = semesterMarks
        .filter(mark => shouldCountInGPA(mark))
        .reduce((sum, mark) => sum + (mark.credits || 0), 0);
      
      // Extract số kỳ để sắp xếp (ví dụ: "1_2022_2023" -> 1, "2_2022_2023" -> 2)
      const semesterMatch = semesterKey.match(/^(\d+)[_-]/);
      const semesterNumber = semesterMatch ? parseInt(semesterMatch[1]) : 0;
      
      semesterGPAs.push({
        semester: semesterKey,
        gpa,
        credits,
        sortKey: semesterNumber,
      });
    });

    // Sắp xếp các kỳ trong năm học (kỳ 1 trước, kỳ 2 sau)
    semesterGPAs.sort((a, b) => a.sortKey - b.sortKey);

    // Tính GPA trung bình năm học (tất cả môn trong năm)
    const yearGPA = calculateGPA(yearMarks);
    const yearCredits = yearMarks
      .filter(mark => shouldCountInGPA(mark))
      .reduce((sum, mark) => sum + (mark.credits || 0), 0);
    
    // Extract năm bắt đầu để sắp xếp năm học (ví dụ: "2022-2023" -> 2022)
    const startYear = parseInt(schoolYear.split('-')[0]) || 0;
    
    yearData.push({
      year: schoolYear,
      sortKey: startYear,
      semesters: semesterGPAs.map(({ semester, gpa, credits }) => ({ semester, gpa, credits })),
      yearGPA,
      yearCredits,
    });
  });

  // Sắp xếp theo năm học từ quá khứ đến hiện tại (năm cũ trước, năm mới sau)
  yearData.sort((a, b) => a.sortKey - b.sortKey);

  return yearData.map(({ year, semesters, yearGPA, yearCredits }) => ({ 
    year, 
    semesters,
    yearGPA,
    yearCredits,
  }));
};

