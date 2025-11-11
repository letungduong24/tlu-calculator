import { EducationBlock, ProgramSubject, SubjectMark, StudentSubjectMark } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA, processRetakeSubjects } from './gradeService';

export interface IncompleteSubject {
  name: string;
  blockType: number;
  displayName?: string;
  credits?: number;
}

export interface LetterGrade {
  grade: string;
  mark4: number;
}

export interface StrategySubject {
  name: string;
  credits: number;
  grade: string;
  mark4: number;
}

export interface Strategy {
  description: string;
  gradeCounts: { [key: string]: number };
  gpa: number;
  subjectDetails: StrategySubject[];
}

export interface OptimalStrategyItem {
  subjectName: string;
  credits: number;
  requiredGrade: string;
  requiredMark4: number;
}

export interface AimCalculationResult {
  targetGpa: number;
  currentGpa: number;
  currentCredits: number;
  remainingCredits: number;
  requiredAverage: number;
  minLetterGrade: string;
  minLetterGradeMark4: number;
  isAchievable: boolean;
  maxPossibleGpa: number;
  strategies: Strategy[];
  optimalStrategy: OptimalStrategyItem[];
  finalGpaWithOptimal: number;
}

export interface CreditsCalculationResult {
  totalCredits: number;
  passedCredits: number;
  incompleteSubjects: IncompleteSubject[];
  gpa: number;
  aimCalculation: AimCalculationResult | null;
}

/**
 * Kiểm tra xem block có phải là block cần loại trừ không
 * Loại trừ: chuẩn đầu ra, quốc phòng an ninh, thể chất, và môn học điều kiện
 */
export const isExcludedBlock = (block: EducationBlock): boolean => {
  const displayName = block.displayName?.toLowerCase() || '';
  const blockName = (block as any).blockName?.toLowerCase() || '';
  const combinedName = `${displayName} ${blockName}`;
  
  const isNationalDefenseBlock = combinedName.includes('giáo dục quốc phòng') ||
                                  combinedName.includes('quốc phòng an ninh') ||
                                  combinedName.includes('quốc phòng');
  const isPhysicalEducationBlock = combinedName.includes('giáo dục thể chất') ||
                                   combinedName.includes('thể chất');
  const isConditionalOutputBlock = combinedName.includes('chuẩn đầu ra');
  const isConditionalSubjectBlock = combinedName.includes('môn học điều kiện');
  
  return isConditionalOutputBlock || isNationalDefenseBlock || isPhysicalEducationBlock || isConditionalSubjectBlock;
};

/**
 * Kiểm tra môn quốc phòng an ninh
 */
export const isNationalDefenseSubject = (subject: ProgramSubject): boolean => {
  const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
  const subjectName = subject.displaySubjectName?.toLowerCase() || 
                     subject.subject?.subjectName?.toLowerCase() || '';
  return subjectCode.startsWith('GDQP') || 
         subjectName.includes('quốc phòng') || 
         subjectName.includes('an ninh') ||
         subjectName.includes('quân sự') ||
         subjectName.includes('chiến đấu');
};

/**
 * Kiểm tra môn thể chất
 */
export const isPhysicalEducationSubject = (subject: ProgramSubject): boolean => {
  const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
  const subjectName = subject.displaySubjectName?.toLowerCase() || 
                     subject.subject?.subjectName?.toLowerCase() || '';
  return subjectCode.startsWith('TDTC') ||
         (subjectCode.startsWith('TATC') && subjectName.includes('thể chất')) ||
         subjectName.includes('thể chất') ||
         subjectName.includes('giáo dục thể chất') ||
         subjectName.includes('physical education');
};

/**
 * Kiểm tra môn có phải là môn cần loại trừ không
 */
export const isExcludedSubject = (subject: ProgramSubject): boolean => {
  const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
  const subjectName = subject.displaySubjectName?.toLowerCase() || 
                     subject.subject?.subjectName?.toLowerCase() || '';
  
  // Loại trừ: chuẩn đầu ra, quốc phòng an ninh, thể chất, và môn học điều kiện
  if (subjectCode.startsWith('CDR') ||
      subjectCode.startsWith('OTCDR') ||
      subjectName.includes('chuẩn đầu ra') ||
      subjectName.includes('ôn thi chuẩn đầu ra')) {
    return true;
  }
  
  if (isNationalDefenseSubject(subject)) {
    return true;
  }
  
  if (isPhysicalEducationSubject(subject)) {
    return true;
  }
  
  // Loại trừ môn học điều kiện (TATC - Tiếng Anh tăng cường)
  if (subjectCode.startsWith('TATC') ||
      subjectName.includes('tiếng anh tăng cường') ||
      subjectName.includes('tieng anh tang cuong') ||
      subjectName.includes('tăng cường')) {
    return true;
  }
  
  return false;
};

/**
 * So sánh hai semester để xác định cái nào mới hơn (cho StudentSubjectMark)
 */
const compareSemesterForStudentMark = (a: StudentSubjectMark, b: StudentSubjectMark): number => {
  // Ưu tiên so sánh theo semesterId (id lớn hơn = mới hơn)
  const aSemesterId = (a as any).semester?.id;
  const bSemesterId = (b as any).semester?.id;
  
  if (aSemesterId !== undefined && bSemesterId !== undefined) {
    return bSemesterId - aSemesterId;
  }
  
  // Nếu không có semesterId, so sánh theo semesterCode
  const aCode = (a as any).semester?.semesterCode || (a as any).semester?.semesterName || '';
  const bCode = (b as any).semester?.semesterCode || (b as any).semester?.semesterName || '';
  
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
 * Xử lý môn học cải thiện từ listStudentSubjectMark: với môn học cải thiện (không phải trượt),
 * chỉ lấy lần học mới nhất và chỉ tính tín chỉ một lần
 */
const processRetakeStudentMarks = (marks: StudentSubjectMark[]): StudentSubjectMark[] => {
  if (!marks || marks.length === 0) return [];
  
  // Nhóm các môn học theo subjectCode
  const subjectMap = new Map<string, StudentSubjectMark[]>();
  
  marks.forEach((mark) => {
    const subjectCode = mark.subject?.subjectCode;
    // Nếu không có subjectCode, không thể nhóm, giữ nguyên
    if (!subjectCode) {
      return;
    }
    
    if (!subjectMap.has(subjectCode)) {
      subjectMap.set(subjectCode, []);
    }
    subjectMap.get(subjectCode)!.push(mark);
  });
  
  const processedMarks: StudentSubjectMark[] = [];
  const marksWithoutCode: StudentSubjectMark[] = [];
  
  // Xử lý từng nhóm môn học
  subjectMap.forEach((groupMarks, subjectCode) => {
    // Nếu chỉ có 1 môn, giữ nguyên
    if (groupMarks.length === 1) {
      processedMarks.push(groupMarks[0]);
      return;
    }
    
    // Kiểm tra xem có môn nào trượt không (charMark === 'F')
    const failedMarks = groupMarks.filter(m => 
      m.charMark?.toUpperCase() === 'F'
    );
    
    // Nếu có môn trượt, giữ tất cả (cả trượt và cải thiện)
    if (failedMarks.length > 0) {
      processedMarks.push(...groupMarks);
      return;
    }
    
    // Nếu không có môn trượt, tất cả đều là cải thiện
    // Chỉ lấy môn mới nhất (sắp xếp và lấy phần tử đầu tiên)
    const sortedMarks = [...groupMarks].sort(compareSemesterForStudentMark);
    processedMarks.push(sortedMarks[0]);
  });
  
  // Thêm các môn không có subjectCode (không thể nhóm)
  marks.forEach((mark) => {
    if (!mark.subject?.subjectCode) {
      marksWithoutCode.push(mark);
    }
  });
  
  return [...processedMarks, ...marksWithoutCode];
};

/**
 * Tính passedCredits từ listStudentSubjectMark (đã xử lý môn học cải thiện)
 */
const calculatePassedCreditsFromStudentMarks = (marks: StudentSubjectMark[]): number => {
  if (!marks || marks.length === 0) return 0;
  
  // Xử lý môn học cải thiện trước
  const processedMarks = processRetakeStudentMarks(marks);
  
  // Tính tổng tín chỉ từ các môn đã qua (result === 1 và không phải F)
  return processedMarks.reduce((sum, mark) => {
    // Chỉ tính các môn đã qua (result === 1) và không phải F
    const isPassed = mark.result === 1 && 
                     mark.charMark?.toUpperCase() !== 'F' &&
                     mark.isCounted !== false;
    
    if (isPassed && mark.subject?.numberOfCredit) {
      return sum + mark.subject.numberOfCredit;
    }
    return sum;
  }, 0);
};

/**
 * Tính tổng tín chỉ và tín chỉ đã học từ blocks
 */
export const calculateCreditsFromBlocks = (
  blocks: EducationBlock[],
  isTopLevel: boolean = true
): { totalCredits: number; passedCredits: number } => {
  let totalCredits = 0;
  let passedCredits = 0;
  
  // Thu thập tất cả listStudentSubjectMark từ tất cả các blocks (để xử lý môn học cải thiện toàn cục)
  const allStudentMarks: StudentSubjectMark[] = [];
  
  const collectAllStudentMarks = (blocks: EducationBlock[]) => {
    blocks.forEach((block) => {
      if (isExcludedBlock(block)) {
        return;
      }
      
      // Thu thập từ block này
      if (block.listStudentSubjectMark && block.listStudentSubjectMark.length > 0) {
        allStudentMarks.push(...block.listStudentSubjectMark);
      }
      
      // Thu thập từ children
      if (block.children && block.children.length > 0) {
        collectAllStudentMarks(block.children);
      }
    });
  };
  
  collectAllStudentMarks(blocks);
  
  // Xử lý môn học cải thiện toàn cục
  const processedAllMarks = processRetakeStudentMarks(allStudentMarks);
  
  // Tạo Set để track các môn đã tính (theo subjectCode)
  const countedSubjects = new Set<string>();
  
  blocks.forEach((block) => {
    if (isExcludedBlock(block)) {
      return;
    }
    
    const hasChildren = block.children && block.children.length > 0;
    const isLeafBlock = !hasChildren;
    
    // totalCredits: CHỈ tính từ leaf blocks để tránh double counting
    if (isLeafBlock) {
      if (block.blockType === 2) {
        // Block tự chọn: chỉ tính minNumberCredit
        const electiveCredits = block.minNumberCredit !== null && block.minNumberCredit !== undefined && block.minNumberCredit > 0
          ? block.minNumberCredit
          : 3;
        totalCredits += electiveCredits;
      } else {
        // Block khác: tính từ listProgramSubject (bỏ qua các môn bị loại trừ)
        if (block.listProgramSubject && block.listProgramSubject.length > 0) {
          block.listProgramSubject.forEach((subject) => {
            if (!isExcludedSubject(subject)) {
              const subjectCredits = subject.subject?.numberOfCredit || 0;
              if (subjectCredits > 0) {
                totalCredits += subjectCredits;
              }
            }
          });
        } else {
          // Nếu không có listProgramSubject, dùng minNumberCredit/totalCredit
          const blockCredits = block.minNumberCredit !== null && block.minNumberCredit !== undefined && block.minNumberCredit > 0
            ? block.minNumberCredit
            : (block.totalCredit !== null && block.totalCredit !== undefined && block.totalCredit > 0
              ? block.totalCredit
              : 0);
          if (blockCredits > 0) {
            totalCredits += blockCredits;
          }
        }
      }
    }
    
    // Duyệt children để tính leaf blocks
    if (hasChildren) {
      const childCredits = calculateCreditsFromBlocks(block.children, false);
      totalCredits += childCredits.totalCredits;
    }
  });
  
  // Tính passedCredits từ tất cả các môn đã xử lý (chỉ tính một lần cho mỗi môn)
  processedAllMarks.forEach((mark) => {
    const subjectCode = mark.subject?.subjectCode;
    if (!subjectCode) return;
    
    // Chỉ tính các môn đã qua (result === 1) và không phải F
    const isPassed = mark.result === 1 && 
                     mark.charMark?.toUpperCase() !== 'F' &&
                     mark.isCounted !== false;
    
    if (isPassed && mark.subject?.numberOfCredit && !countedSubjects.has(subjectCode)) {
      passedCredits += mark.subject.numberOfCredit;
      countedSubjects.add(subjectCode);
    }
  });
  
  return { totalCredits, passedCredits };
};

/**
 * Tìm các môn học chưa hoàn thành
 */
export const findIncompleteSubjects = (
  blocks: EducationBlock[]
): IncompleteSubject[] => {
  const incomplete: IncompleteSubject[] = [];
  const electiveNumbers = new Set<number>();
  
  const traverseBlock = (block: EducationBlock) => {
    if (isExcludedBlock(block)) {
      return;
    }
    
    if (!block.isComplete) {
      if (block.blockType === 2) {
        // Block tự chọn: thu thập số từ displayName
        const match = block.displayName?.match(/(\d+)/);
        if (match) {
          electiveNumbers.add(parseInt(match[1], 10));
        }
        
        if (block.children && block.children.length > 0) {
          block.children.forEach((child) => {
            if (!child.isComplete && child.blockType === 2) {
              const childMatch = child.displayName?.match(/(\d+)/);
              if (childMatch) {
                electiveNumbers.add(parseInt(childMatch[1], 10));
              }
            }
          });
        }
      } else {
        // Kiểm tra các môn học chưa hoàn thành từ listProgramSubject
        if (block.listProgramSubject && block.listProgramSubject.length > 0) {
          block.listProgramSubject.forEach((subject) => {
            if (isExcludedSubject(subject)) {
              return;
            }
            
            const isIncomplete = subject.result !== 1;
            
            if (isIncomplete && subject.displaySubjectName) {
              incomplete.push({
                name: subject.displaySubjectName,
                blockType: block.blockType,
                displayName: block.displayName,
                credits: subject.subject?.numberOfCredit || 0,
              });
            }
          });
        }
      }
    }
    
    if (block.children && block.children.length > 0) {
      block.children.forEach(child => traverseBlock(child));
    }
  };
  
  blocks.forEach(block => traverseBlock(block));
  
  // Thêm môn tự chọn vào danh sách nếu có
  if (electiveNumbers.size > 0) {
    const sortedNumbers = Array.from(electiveNumbers).sort((a, b) => a - b);
    
    const findElectiveBlocks = (
      blocks: EducationBlock[],
      foundBlocks: Array<{ name: string; credits: number; number: number }> = []
    ) => {
      for (const block of blocks) {
        if (block.blockType === 2 && !block.isComplete) {
          const match = block.displayName?.match(/(\d+)/);
          if (match) {
            const electiveNumber = parseInt(match[1], 10);
            if (sortedNumbers.includes(electiveNumber)) {
              const alreadyAdded = foundBlocks.some(b => b.number === electiveNumber);
              if (!alreadyAdded) {
                const electiveCredits = block.minNumberCredit && block.minNumberCredit > 0
                  ? block.minNumberCredit
                  : 3;
                
                foundBlocks.push({
                  name: block.displayName || `Tự chọn ngành ${electiveNumber}`,
                  credits: electiveCredits,
                  number: electiveNumber
                });
              }
            }
          }
        }
        if (block.children && block.children.length > 0) {
          findElectiveBlocks(block.children, foundBlocks);
        }
      }
      return foundBlocks;
    };
    
    const foundElectiveBlocks = findElectiveBlocks(blocks);
    foundElectiveBlocks.sort((a, b) => a.number - b.number);
    foundElectiveBlocks.forEach(electiveBlock => {
      incomplete.push({
        name: electiveBlock.name,
        blockType: 2,
        displayName: electiveBlock.name,
        credits: electiveBlock.credits,
      });
    });
  }
  
  return incomplete;
};

/**
 * Quy đổi điểm số sang điểm chữ (không có thang +)
 */
export const getLetterGrade = (mark4: number): LetterGrade => {
  if (mark4 >= 3.5) return { grade: 'A', mark4: 4.0 };
  if (mark4 >= 2.5) return { grade: 'B', mark4: 3.0 };
  if (mark4 >= 1.5) return { grade: 'C', mark4: 2.0 };
  if (mark4 >= 0.5) return { grade: 'D', mark4: 1.0 };
  return { grade: 'F', mark4: 0.0 };
};

/**
 * Tính các chiến lược để đạt mục tiêu GPA
 */
export const calculateStrategies = (
  currentPoints: number,
  passedCreditsForGpa: number,
  totalIncompleteCredits: number,
  incompleteSubjects: IncompleteSubject[],
  targetGpa: number,
  requiredAverage: number,
  minLetterGrade: LetterGrade
): Strategy[] => {
  const strategies: Strategy[] = [];
  const gradeValues: { [key: string]: number } = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
  };
  
  // Chiến lược 1: Tất cả đều B
  const ifAllBPoints = currentPoints + (3.0 * totalIncompleteCredits);
  const ifAllBGpa = ifAllBPoints / (passedCreditsForGpa + totalIncompleteCredits);
  
  if (ifAllBGpa >= targetGpa) {
    strategies.push({
      description: `Tất cả môn còn lại đều đạt B (3.0)`,
      gradeCounts: { B: incompleteSubjects.length },
      gpa: ifAllBGpa,
      subjectDetails: incompleteSubjects.map(subj => ({
        name: subj.name,
        credits: subj.credits || 0,
        grade: 'B',
        mark4: 3.0
      }))
    });
  }
  
  // Chiến lược 2: Tất cả đều điểm chữ tối thiểu (chỉ thêm nếu không phải A hoặc B)
  const ifAllMinGradePoints = currentPoints + (minLetterGrade.mark4 * totalIncompleteCredits);
  const ifAllMinGradeGpa = ifAllMinGradePoints / (passedCreditsForGpa + totalIncompleteCredits);
  
  if (ifAllMinGradeGpa >= targetGpa && minLetterGrade.grade !== 'A' && minLetterGrade.grade !== 'B') {
    strategies.push({
      description: `Tất cả môn còn lại đều đạt ${minLetterGrade.grade}`,
      gradeCounts: { [minLetterGrade.grade]: incompleteSubjects.length },
      gpa: ifAllMinGradeGpa,
      subjectDetails: incompleteSubjects.map(subj => ({
        name: subj.name,
        credits: subj.credits || 0,
        grade: minLetterGrade.grade,
        mark4: minLetterGrade.mark4
      }))
    });
  }
  
  // Tính các chiến lược kết hợp (A + B, A + B + C, v.v.)
  const validSubjects = incompleteSubjects.filter(subj => (subj.credits || 0) > 0);
  const validNumSubjects = validSubjects.length;
  
  if (validNumSubjects > 0) {
    // Chiến lược: từ 0 đến numSubjects môn A, phần còn lại là B
    for (let numA = 0; numA <= validNumSubjects; numA++) {
      const numB = validNumSubjects - numA;
      
      if (numA === validNumSubjects && numB === 0) continue;
      if (numA === 0 && numB === validNumSubjects) continue;
      
      let strategyPoints = currentPoints;
      let totalCreditsUsed = 0;
      const sortedSubjects = [...validSubjects].sort((a, b) => (b.credits || 0) - (a.credits || 0));
      
      for (let i = 0; i < sortedSubjects.length; i++) {
        const credits = sortedSubjects[i].credits || 0;
        if (credits <= 0) continue;
        
        if (i < numA) {
          strategyPoints += gradeValues['A'] * credits;
        } else {
          strategyPoints += gradeValues['B'] * credits;
        }
        totalCreditsUsed += credits;
      }
      
      if (totalCreditsUsed === 0) continue;
      
      const strategyGpa = strategyPoints / (passedCreditsForGpa + totalCreditsUsed);
      
      if (strategyGpa >= targetGpa) {
        const gradeCounts: { [key: string]: number } = {};
        if (numA > 0) gradeCounts['A'] = numA;
        if (numB > 0) gradeCounts['B'] = numB;
        
        const subjectDetails = sortedSubjects.map((subj, idx) => ({
          name: subj.name,
          credits: subj.credits || 0,
          grade: idx < numA ? 'A' : 'B',
          mark4: idx < numA ? 4.0 : 3.0
        }));
        
        strategies.push({
          description: `${numA > 0 ? `${numA} môn A` : ''}${numA > 0 && numB > 0 ? ' + ' : ''}${numB > 0 ? `${numB} môn B` : ''}`,
          gradeCounts,
          gpa: strategyGpa,
          subjectDetails
        });
        
        if (strategies.length >= 8) break;
      }
    }
    
    // Chiến lược: Tất cả đều A
    const ifAllAPoints = currentPoints + (4.0 * totalIncompleteCredits);
    const ifAllAGpa = ifAllAPoints / (passedCreditsForGpa + totalIncompleteCredits);
    
    if (ifAllAGpa >= targetGpa) {
      strategies.push({
        description: `Tất cả môn còn lại đều đạt A`,
        gradeCounts: { A: incompleteSubjects.length },
        gpa: ifAllAGpa,
        subjectDetails: incompleteSubjects.map(subj => ({
          name: subj.name,
          credits: subj.credits || 0,
          grade: 'A',
          mark4: 4.0
        }))
      });
    }
    
    // Chiến lược: một số môn A, một số môn B, một số môn C
    for (let numA = 0; numA <= Math.min(3, validNumSubjects); numA++) {
      for (let numB = 0; numB <= Math.min(5, validNumSubjects - numA); numB++) {
        const numC = validNumSubjects - numA - numB;
        if (numC < 0) continue;
        
        let strategyPoints = currentPoints;
        let totalCreditsUsed = 0;
        const sortedSubjects = [...validSubjects].sort((a, b) => (b.credits || 0) - (a.credits || 0));
        
        for (let i = 0; i < sortedSubjects.length; i++) {
          const credits = sortedSubjects[i].credits || 0;
          if (credits <= 0) continue;
          
          if (i < numA) {
            strategyPoints += gradeValues['A'] * credits;
          } else if (i < numA + numB) {
            strategyPoints += gradeValues['B'] * credits;
          } else {
            strategyPoints += gradeValues['C'] * credits;
          }
          totalCreditsUsed += credits;
        }
        
        if (totalCreditsUsed === 0) continue;
        
        const strategyGpa = strategyPoints / (passedCreditsForGpa + totalCreditsUsed);
        
        if (strategyGpa >= targetGpa && strategyGpa <= targetGpa + 0.1) {
          const gradeCounts: { [key: string]: number } = {};
          if (numA > 0) gradeCounts['A'] = numA;
          if (numB > 0) gradeCounts['B'] = numB;
          if (numC > 0) gradeCounts['C'] = numC;
          
          const subjectDetails = sortedSubjects.map((subj, idx) => ({
            name: subj.name,
            credits: subj.credits || 0,
            grade: idx < numA ? 'A' : (idx < numA + numB ? 'B' : 'C'),
            mark4: idx < numA ? 4.0 : (idx < numA + numB ? 3.0 : 2.0)
          }));
          
          strategies.push({
            description: `${numA > 0 ? `${numA} môn A` : ''}${numA > 0 && (numB > 0 || numC > 0) ? ' + ' : ''}${numB > 0 ? `${numB} môn B` : ''}${numB > 0 && numC > 0 ? ' + ' : ''}${numC > 0 ? `${numC} môn C` : ''}`,
            gradeCounts,
            gpa: strategyGpa,
            subjectDetails
          });
          
          if (strategies.length >= 12) break;
        }
      }
      if (strategies.length >= 12) break;
    }
  }
  
  // Sắp xếp theo GPA (từ thấp đến cao)
  strategies.sort((a, b) => a.gpa - b.gpa);
  
  // Loại bỏ trùng lặp
  const uniqueStrategies = strategies.filter((strategy, index, self) =>
    index === self.findIndex(s => s.description === strategy.description)
  );
  
  return uniqueStrategies.slice(0, 10);
};

/**
 * Tính chiến lược tối ưu cho từng môn cụ thể
 */
export const calculateOptimalStrategy = (
  currentPoints: number,
  passedCreditsForGpa: number,
  totalIncompleteCredits: number,
  incompleteSubjects: IncompleteSubject[],
  targetGpa: number,
  remainingPoints: number
): OptimalStrategyItem[] => {
  const optimalStrategy: OptimalStrategyItem[] = [];
  const requiredAverage = remainingPoints / totalIncompleteCredits;
  
  if (requiredAverage >= 0 && requiredAverage <= 4.0) {
    const sortedSubjects = [...incompleteSubjects]
      .filter(s => (s.credits || 0) > 0)
      .sort((a, b) => (b.credits || 0) - (a.credits || 0));
    
    for (let i = 0; i < sortedSubjects.length; i++) {
      const subject = sortedSubjects[i];
      const credits = subject.credits || 0;
      
      if (credits === 0) continue;
      
      const remainingCredits = sortedSubjects.slice(i + 1).reduce((sum, s) => sum + (s.credits || 0), 0);
      const totalNeededPoints = targetGpa * (passedCreditsForGpa + totalIncompleteCredits);
      const pointsUsedSoFar = currentPoints + optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0);
      const pointsLeftForAllRemaining = totalNeededPoints - pointsUsedSoFar;
      
      if (i === sortedSubjects.length - 1) {
        // Môn cuối cùng
        const requiredMark4ForThis = pointsLeftForAllRemaining / credits;
        const requiredGrade = getLetterGrade(requiredMark4ForThis);
        
        const finalPointsWithThis = currentPoints + optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0) + (requiredGrade.mark4 * credits);
        const finalGpaWithThis = finalPointsWithThis / (passedCreditsForGpa + totalIncompleteCredits);
        
        let finalGradeToUse = requiredGrade;
        if (finalGpaWithThis < targetGpa) {
          if (requiredGrade.grade === 'F') finalGradeToUse = { grade: 'D', mark4: 1.0 };
          else if (requiredGrade.grade === 'D') finalGradeToUse = { grade: 'C', mark4: 2.0 };
          else if (requiredGrade.grade === 'C') finalGradeToUse = { grade: 'B', mark4: 3.0 };
          else if (requiredGrade.grade === 'B') finalGradeToUse = { grade: 'A', mark4: 4.0 };
        }
        
        optimalStrategy.push({
          subjectName: subject.name,
          credits: credits,
          requiredGrade: finalGradeToUse.grade,
          requiredMark4: finalGradeToUse.mark4
        });
      } else {
        const totalRemainingCredits = credits + remainingCredits;
        const avgMarkForRemaining = totalRemainingCredits > 0 
          ? pointsLeftForAllRemaining / totalRemainingCredits
          : 0;
        
        const minAvgForOthers = 2.5;
        const maxPointsForThis = pointsLeftForAllRemaining - (remainingCredits * minAvgForOthers);
        
        let gradeToUse: LetterGrade;
        
        if (avgMarkForRemaining >= 3.5 && maxPointsForThis >= credits * 4.0) {
          gradeToUse = { grade: 'A', mark4: 4.0 };
        } else if (avgMarkForRemaining >= 2.5 && maxPointsForThis >= credits * 3.0) {
          gradeToUse = { grade: 'B', mark4: 3.0 };
        } else if (avgMarkForRemaining >= 1.5 && maxPointsForThis >= credits * 2.0) {
          gradeToUse = { grade: 'C', mark4: 2.0 };
        } else if (avgMarkForRemaining >= 0.5 && maxPointsForThis >= credits * 1.0) {
          gradeToUse = { grade: 'D', mark4: 1.0 };
        } else {
          gradeToUse = getLetterGrade(avgMarkForRemaining);
        }
        
        optimalStrategy.push({
          subjectName: subject.name,
          credits: credits,
          requiredGrade: gradeToUse.grade,
          requiredMark4: gradeToUse.mark4
        });
      }
    }
  }
  
  return optimalStrategy;
};

/**
 * Tính toán aim GPA
 */
export const calculateAimGPA = (
  targetGpa: number,
  currentGpa: number,
  passedCreditsForGpa: number,
  totalIncompleteCredits: number,
  incompleteSubjects: IncompleteSubject[],
  passedCredits: number,
  totalCredits: number
): AimCalculationResult | null => {
  if (totalIncompleteCredits > 0) {
    const totalNeededPoints = targetGpa * (passedCreditsForGpa + totalIncompleteCredits);
    const currentPoints = currentGpa * passedCreditsForGpa;
    const maxPossiblePoints = currentPoints + (4.0 * totalIncompleteCredits);
    const maxPossibleGpa = maxPossiblePoints / (passedCreditsForGpa + totalIncompleteCredits);
    const isAchievable = maxPossibleGpa >= targetGpa;
    const remainingPoints = totalNeededPoints - currentPoints;
    const requiredAverage = remainingPoints / totalIncompleteCredits;
    const minLetterGrade = getLetterGrade(requiredAverage);
    
    if (!isAchievable) {
      return {
        targetGpa,
        currentGpa,
        currentCredits: passedCredits,
        remainingCredits: totalIncompleteCredits,
        requiredAverage,
        minLetterGrade: minLetterGrade.grade,
        minLetterGradeMark4: minLetterGrade.mark4,
        isAchievable: false,
        maxPossibleGpa,
        strategies: [],
        optimalStrategy: [],
        finalGpaWithOptimal: 0
      };
    }
    
    const strategies = calculateStrategies(
      currentPoints,
      passedCreditsForGpa,
      totalIncompleteCredits,
      incompleteSubjects,
      targetGpa,
      requiredAverage,
      minLetterGrade
    );
    
    const optimalStrategy = calculateOptimalStrategy(
      currentPoints,
      passedCreditsForGpa,
      totalIncompleteCredits,
      incompleteSubjects,
      targetGpa,
      remainingPoints
    );
    
    let finalGpaWithOptimal = 0;
    if (optimalStrategy.length > 0) {
      const totalPointsFromOptimal = optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0);
      const totalPointsFinal = currentPoints + totalPointsFromOptimal;
      const totalCreditsFinal = passedCreditsForGpa + totalIncompleteCredits;
      finalGpaWithOptimal = totalCreditsFinal > 0 ? totalPointsFinal / totalCreditsFinal : 0;
    }
    
    return {
      targetGpa,
      currentGpa,
      currentCredits: passedCredits,
      remainingCredits: totalIncompleteCredits,
      requiredAverage,
      minLetterGrade: minLetterGrade.grade,
      minLetterGradeMark4: minLetterGrade.mark4,
      isAchievable: true,
      maxPossibleGpa,
      strategies,
      optimalStrategy,
      finalGpaWithOptimal
    };
  } else {
    return {
      targetGpa,
      currentGpa,
      currentCredits: passedCredits,
      remainingCredits: 0,
      requiredAverage: 0,
      minLetterGrade: '-',
      minLetterGradeMark4: 0,
      isAchievable: currentGpa >= targetGpa,
      maxPossibleGpa: currentGpa,
      strategies: [],
      optimalStrategy: [],
      finalGpaWithOptimal: currentGpa
    };
  }
};

/**
 * Tính toán tổng hợp cho trang aim
 */
export const calculateAimPageData = (
  educationProgram: EducationBlock[],
  subjectMarks: SubjectMark[],
  targetGpa: string | null
): CreditsCalculationResult => {
  // Tính GPA từ subjectMarks
  const calculatedGpa = calculateGPA(subjectMarks);
  
  // Tính số tín chỉ đã học (từ các môn được tính vào GPA)
  const passedCreditsForGpa = subjectMarks
    .filter(mark => shouldCountInGPA(mark))
    .reduce((sum, mark) => sum + (mark.credits || 0), 0);
  
  // Tính tổng tín chỉ và passedCredits từ blocks
  const creditsResult = calculateCreditsFromBlocks(educationProgram, true);
  const totalCredits = creditsResult.totalCredits;
  const passedCredits = creditsResult.passedCredits;
  
  // Tìm các môn chưa hoàn thành
  const incompleteSubjects = findIncompleteSubjects(educationProgram);
  
  // Tính aim calculation nếu có targetGpa
  let aimCalculation: AimCalculationResult | null = null;
  if (targetGpa && !isNaN(parseFloat(targetGpa))) {
    const target = parseFloat(targetGpa);
    const totalIncompleteCredits = incompleteSubjects.reduce((sum, subj) => sum + (subj.credits || 0), 0);
    
    aimCalculation = calculateAimGPA(
      target,
      calculatedGpa,
      passedCreditsForGpa,
      totalIncompleteCredits,
      incompleteSubjects,
      passedCredits,
      totalCredits
    );
  }
  
  return {
    totalCredits,
    passedCredits,
    incompleteSubjects,
    gpa: calculatedGpa,
    aimCalculation
  };
};

