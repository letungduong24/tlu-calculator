import { SubjectMark } from '@/store/studentStore';

/**
 * So sánh hai semester để xác định cái nào mới hơn
 * Trả về số dương nếu a mới hơn b, số âm nếu a cũ hơn b
 */
const compareSemester = (a: SubjectMark, b: SubjectMark): number => {
  // Ưu tiên so sánh theo semesterId (id lớn hơn = mới hơn)
  if (a.semesterId !== undefined && b.semesterId !== undefined) {
    return b.semesterId - a.semesterId;
  }
  
  // Nếu không có semesterId, so sánh theo semesterCode
  const aCode = a.semesterCode || a.semesterName || '';
  const bCode = b.semesterCode || b.semesterName || '';
  
  // Extract năm và kỳ từ code (ví dụ: "2_2024_2025" -> kỳ 2, năm 2024)
  const aMatch = aCode.match(/^(\d+)[_-](\d{4})/);
  const bMatch = bCode.match(/^(\d+)[_-](\d{4})/);
  
  if (aMatch && bMatch) {
    const aYear = parseInt(aMatch[2]);
    const bYear = parseInt(bMatch[2]);
    const aSem = parseInt(aMatch[1]);
    const bSem = parseInt(bMatch[1]);
    
    // So sánh năm trước, sau đó so sánh kỳ
    if (aYear !== bYear) {
      return bYear - aYear;
    }
    return bSem - aSem;
  }
  
  // Nếu không parse được, so sánh string
  return bCode.localeCompare(aCode);
};

/**
 * Xử lý môn học cải thiện: với môn học cải thiện (không phải trượt),
 * chỉ lấy lần học mới nhất và chỉ tính tín chỉ một lần
 */
export const processRetakeSubjects = (marks: SubjectMark[]): SubjectMark[] => {
  // Nhóm các môn học theo subjectCode
  const subjectMap = new Map<string, SubjectMark[]>();
  
  marks.forEach((mark) => {
    const subjectCode = mark.subjectCode;
    // Nếu không có subjectCode, không thể nhóm, giữ nguyên
    if (!subjectCode) {
      return;
    }
    
    if (!subjectMap.has(subjectCode)) {
      subjectMap.set(subjectCode, []);
    }
    subjectMap.get(subjectCode)!.push(mark);
  });
  
  const processedMarks: SubjectMark[] = [];
  const marksWithoutCode: SubjectMark[] = [];
  
  // Xử lý từng nhóm môn học
  subjectMap.forEach((groupMarks, subjectCode) => {
    // Nếu chỉ có 1 môn, giữ nguyên
    if (groupMarks.length === 1) {
      processedMarks.push(groupMarks[0]);
      return;
    }
    
    // Kiểm tra xem có môn nào trượt không (letterGrade === 'F')
    const failedMarks = groupMarks.filter(m => 
      m.letterGrade?.toUpperCase() === 'F'
    );
    
    // Nếu có môn trượt, giữ tất cả (cả trượt và cải thiện)
    if (failedMarks.length > 0) {
      processedMarks.push(...groupMarks);
      return;
    }
    
    // Nếu không có môn trượt, tất cả đều là cải thiện
    // Chỉ lấy môn mới nhất (sắp xếp và lấy phần tử đầu tiên)
    const sortedMarks = [...groupMarks].sort(compareSemester);
    processedMarks.push(sortedMarks[0]);
  });
  
  // Thêm các môn không có subjectCode (không thể nhóm)
  marks.forEach((mark) => {
    if (!mark.subjectCode) {
      marksWithoutCode.push(mark);
    }
  });
  
  return [...processedMarks, ...marksWithoutCode];
};

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
 * Đã xử lý môn học cải thiện: chỉ tính một lần cho mỗi môn học cải thiện
 */
export const calculateGPA = (marks: SubjectMark[]): number => {
  // Xử lý môn học cải thiện trước khi tính GPA
  const processedMarks = processRetakeSubjects(marks);
  
  let totalPoints = 0;
  let totalCredits = 0;
  const calculationDetails: Array<{ subject: string; mark4: number | undefined; credits: number; points: number }> = [];

  processedMarks.forEach((mark) => {
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
 * Đã xử lý môn học cải thiện: chỉ tính một lần cho mỗi môn học cải thiện
 */
export const calculateGPAByYear = (marks: SubjectMark[]): YearGPA[] => {
  // Xử lý môn học cải thiện trước khi tính GPA
  const processedMarks = processRetakeSubjects(marks);
  
  // Bước 1: Nhóm theo năm học
  const yearMap = new Map<string, SubjectMark[]>();

  processedMarks.forEach((mark) => {
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

