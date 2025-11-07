'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useStudentStore, { EducationBlock, ProgramSubject } from '@/store/studentStore';
import { shouldCountInGPA, calculateGPA } from '@/lib/services/gradeService';

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
    // Tính GPA từ subjectMarks trong store (giống trang /grade)
    const calculatedGpa = calculateGPA(subjectMarks);
    
    // Tính số tín chỉ đã học (từ các môn được tính vào GPA)
    const passedCreditsForGpa = subjectMarks
      .filter(mark => shouldCountInGPA(mark))
      .reduce((sum, mark) => sum + (mark.credits || 0), 0);
    
    let total = 0;
    let passed = 0;
    const incomplete: Array<{ name: string; blockType: number; displayName?: string; credits?: number }> = [];
    const electiveNumbers = new Set<number>(); // Lưu số của các môn tự chọn chưa hoàn thành
    
    // Tính tổng tín chỉ từ minNumberCredit của tất cả blocks (không bị loại trừ)
    // Tính passedCredits từ passedCredits của tất cả blocks (không bị loại trừ)
    const calculateCreditsFromBlocks = (blocks: EducationBlock[], isTopLevel: boolean = true) => {
      let totalCredits = 0;
      let passedCredits = 0;
      
      blocks.forEach((block) => {
        if (isExcludedBlock(block)) {
          return; // Bỏ qua block bị loại trừ (chuẩn đầu ra, quốc phòng, thể chất)
        }
        
        const hasChildren = block.children && block.children.length > 0;
        const isLeafBlock = !hasChildren;
        
        // totalCredits: CHỈ tính từ leaf blocks (blocks không có children) để tránh double counting
        // Tính từ listProgramSubject để đảm bảo chính xác
        if (isLeafBlock) {
          if (block.blockType === 2) {
            // Block tự chọn: chỉ tính minNumberCredit
            const electiveCredits = block.minNumberCredit !== null && block.minNumberCredit !== undefined && block.minNumberCredit > 0
              ? block.minNumberCredit
              : 3; // Mặc định 3 tín chỉ nếu không có minNumberCredit
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
        
        // passedCredits: CHỈ tính từ top-level blocks (có hoặc không có children)
        // Vì passedCredits của parent = tổng passedCredits của children
        if (isTopLevel) {
          let blockPassedCredits = block.passedCredits || 0;
          // Nếu có children, trừ đi passedCredits của children bị loại trừ
          if (hasChildren) {
            block.children.forEach((child) => {
              if (isExcludedBlock(child)) {
                blockPassedCredits -= (child.passedCredits || 0);
              }
            });
          }
          passedCredits += Math.max(0, blockPassedCredits);
        }
        
        // Duyệt children để tính leaf blocks (chỉ tính totalCredits)
        if (hasChildren) {
          const childCredits = calculateCreditsFromBlocks(block.children, false);
          totalCredits += childCredits.totalCredits;
          // KHÔNG cộng passedCredits từ children vì đã tính từ top-level parent
        }
      });
      
      return { totalCredits, passedCredits };
    };
    
    // Tính GPA: sử dụng cùng dữ liệu từ store như trang /grade
    // Không cần chuyển đổi từ listStudentSubjectMark nữa

    // Hàm kiểm tra xem block/môn có phải là các môn cần loại trừ không
    // Loại trừ: chuẩn đầu ra, quốc phòng an ninh, và thể chất
    // KHÔNG loại trừ: môn học điều kiện (tính vào tổng tín chỉ)
    const isExcludedBlock = (block: EducationBlock): boolean => {
      const displayName = block.displayName?.toLowerCase() || '';
      // Kiểm tra cả blockName nếu có (một số block có blockName thay vì displayName)
      const blockName = (block as any).blockName?.toLowerCase() || '';
      const combinedName = `${displayName} ${blockName}`;
      
      // Kiểm tra các từ khóa để loại trừ block quốc phòng và thể chất
      const isNationalDefenseBlock = combinedName.includes('giáo dục quốc phòng') ||
                                      combinedName.includes('quốc phòng an ninh') ||
                                      combinedName.includes('quốc phòng');
      const isPhysicalEducationBlock = combinedName.includes('giáo dục thể chất') ||
                                       combinedName.includes('thể chất');
      const isConditionalOutputBlock = combinedName.includes('chuẩn đầu ra');
      
      return isConditionalOutputBlock || isNationalDefenseBlock || isPhysicalEducationBlock;
    };

    // Hàm kiểm tra môn quốc phòng an ninh
    const isNationalDefenseSubject = (subject: ProgramSubject): boolean => {
      const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
      const subjectName = subject.displaySubjectName?.toLowerCase() || 
                         subject.subject?.subjectName?.toLowerCase() || '';
      return subjectCode.startsWith('GDQP') || 
             subjectName.includes('quốc phòng') || 
             subjectName.includes('an ninh') ||
             subjectName.includes('quân sự') ||
             subjectName.includes('chiến đấu');
    };

    // Hàm kiểm tra môn thể chất
    const isPhysicalEducationSubject = (subject: ProgramSubject): boolean => {
      const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
      const subjectName = subject.displaySubjectName?.toLowerCase() || 
                         subject.subject?.subjectName?.toLowerCase() || '';
      return subjectCode.startsWith('TDTC') ||
             subjectCode.startsWith('TATC') && subjectName.includes('thể chất') ||
             subjectName.includes('thể chất') ||
             subjectName.includes('giáo dục thể chất') ||
             subjectName.includes('physical education');
    };

    const isExcludedSubject = (subject: ProgramSubject): boolean => {
      const subjectCode = subject.subject?.subjectCode?.toUpperCase() || '';
      const subjectName = subject.displaySubjectName?.toLowerCase() || 
                         subject.subject?.subjectName?.toLowerCase() || '';
      // Loại trừ: chuẩn đầu ra, quốc phòng an ninh, và thể chất
      // KHÔNG loại trừ: môn học điều kiện (TATC không phải thể chất)
      if (subjectCode.startsWith('CDR') ||
          subjectCode.startsWith('OTCDR') ||
          subjectName.includes('chuẩn đầu ra') ||
          subjectName.includes('ôn thi chuẩn đầu ra')) {
        return true;
      }
      // Loại trừ quốc phòng an ninh
      if (isNationalDefenseSubject(subject)) {
        return true;
      }
      // Loại trừ thể chất
      if (isPhysicalEducationSubject(subject)) {
        return true;
      }
      return false;
    };

    const traverseBlock = (block: EducationBlock, isTopLevel: boolean = false) => {
      // Bỏ qua block chuẩn đầu ra, quốc phòng, và thể chất
      // KHÔNG bỏ qua môn học điều kiện
      if (isExcludedBlock(block)) {
        return;
      }

      // passedCredits đã được tính trong calculateCreditsFromBlocks
      // Không cần tính lại ở đây

      // Kiểm tra block chưa hoàn thành
      if (!block.isComplete) {
        // Nếu là blockType: 2 (tự chọn), thu thập số từ displayName hoặc children
        if (block.blockType === 2) {
          // Trích xuất số từ displayName của block này (ví dụ: "Tự chọn ngành 1" -> 1)
          const match = block.displayName?.match(/(\d+)/);
          if (match) {
            electiveNumbers.add(parseInt(match[1], 10));
          }
          
          // Duyệt children để tìm số của các môn tự chọn chưa hoàn thành
          if (block.children && block.children.length > 0) {
            block.children.forEach((child) => {
              if (!child.isComplete && child.blockType === 2) {
                // Trích xuất số từ displayName (ví dụ: "Tự chọn ngành 1" -> 1)
                const childMatch = child.displayName?.match(/(\d+)/);
                if (childMatch) {
                  electiveNumbers.add(parseInt(childMatch[1], 10));
                }
              }
            });
          }
        } else {
          // Không cần thu thập từ listStudentSubjectMark nữa
          // Sẽ dùng subjectMarks từ store (giống trang /grade)

          // Kiểm tra các môn học chưa hoàn thành từ listProgramSubject
          if (block.listProgramSubject && block.listProgramSubject.length > 0) {
            block.listProgramSubject.forEach((subject) => {
              // Bỏ qua môn học điều kiện, chuẩn đầu ra, quốc phòng, và thể chất
              if (isExcludedSubject(subject)) {
                return;
              }

              // Môn chưa hoàn thành nếu:
              // - result !== 1 (chưa pass hoặc chưa có điểm)
              // LƯU Ý: result: 1 nghĩa là đã pass, KHÔNG tính vào incomplete
              // result: null, 0, hoặc undefined nghĩa là chưa pass
              const isIncomplete = subject.result !== 1;

              if (isIncomplete && subject.displaySubjectName) {
                incomplete.push({
                  name: subject.displaySubjectName,
                  blockType: block.blockType,
                  displayName: block.displayName,
                  credits: subject.subject?.numberOfCredit || 0, // Lưu số tín chỉ của môn
                });
              }
            });
          }
        }
      }

      // Duyệt các children
      if (block.children && block.children.length > 0) {
        block.children.forEach(child => traverseBlock(child, false));
      }
    };

    // Tính tổng tín chỉ và passedCredits từ blocks
    // Chỉ tính từ leaf blocks để tránh double counting
    const creditsResult = calculateCreditsFromBlocks(educationProgram, true);
    total = creditsResult.totalCredits;
    passed = creditsResult.passedCredits;
    
    // Duyệt blocks để tính môn chưa hoàn thành
    educationProgram.forEach(block => traverseBlock(block, true));

    // Thêm môn tự chọn vào danh sách nếu có
    // Cần tìm minNumberCredit của các block tự chọn chưa hoàn thành
    if (electiveNumbers.size > 0) {
      const sortedNumbers = Array.from(electiveNumbers).sort((a, b) => a - b);
      // Tìm minNumberCredit của block tự chọn đầu tiên để hiển thị
      let electiveCredits = 0;
      const findElectiveBlock = (blocks: EducationBlock[]) => {
        for (const block of blocks) {
          if (block.blockType === 2 && !block.isComplete) {
            const match = block.displayName?.match(/(\d+)/);
            if (match && sortedNumbers.includes(parseInt(match[1], 10))) {
              if (block.minNumberCredit && block.minNumberCredit > 0) {
                electiveCredits = block.minNumberCredit;
                return;
              }
            }
          }
          if (block.children && block.children.length > 0) {
            findElectiveBlock(block.children);
          }
        }
      };
      findElectiveBlock(educationProgram);
      
      incomplete.push({
        name: `Tự chọn ${sortedNumbers.join('/')}`,
        blockType: 2,
        displayName: 'Môn tự chọn',
        credits: electiveCredits || 3, // Mặc định 3 nếu không tìm thấy
      });
    }

    // Hàm quy đổi điểm số sang điểm chữ (không có thang +)
    const getLetterGrade = (mark4: number): { grade: string; mark4: number } => {
      if (mark4 >= 3.5) return { grade: 'A', mark4: 4.0 };
      if (mark4 >= 2.5) return { grade: 'B', mark4: 3.0 };
      if (mark4 >= 1.5) return { grade: 'C', mark4: 2.0 };
      if (mark4 >= 0.5) return { grade: 'D', mark4: 1.0 };
      return { grade: 'F', mark4: 0.0 };
    };

    // Tính toán aim: nếu có calculatedTargetGpa, tính điểm tối thiểu cần đạt cho các môn còn lại
    let aimResult = null;
    if (calculatedTargetGpa && !isNaN(parseFloat(calculatedTargetGpa))) {
      const target = parseFloat(calculatedTargetGpa);
      const totalIncompleteCredits = incomplete.reduce((sum, subj) => sum + (subj.credits || 0), 0);
      
      if (totalIncompleteCredits > 0) {
        // GPA chỉ tính từ các môn được tính vào GPA (không tính môn học điều kiện)
        // Vậy tất cả tính toán phải dựa trên passedCreditsForGpa, không phải passed
        // Tổng điểm cần có = targetGpa * (tổng tín chỉ đã học được tính vào GPA + tổng tín chỉ chưa học)
        const totalNeededPoints = target * (passedCreditsForGpa + totalIncompleteCredits);
        
        // Điểm đã có = GPA hiện tại * số tín chỉ đã học được tính vào GPA
        const currentPoints = calculatedGpa * passedCreditsForGpa;
        
        // Tính GPA tối đa có thể đạt được (nếu tất cả môn còn lại đều đạt A - 4.0)
        const maxPossiblePoints = currentPoints + (4.0 * totalIncompleteCredits);
        const maxPossibleGpa = maxPossiblePoints / (passedCreditsForGpa + totalIncompleteCredits);
        
        // Kiểm tra xem có thể đạt được target hay không
        const isAchievable = maxPossibleGpa >= target;
        
        // Điểm còn thiếu
        const remainingPoints = totalNeededPoints - currentPoints;
        
        // Điểm trung bình cần đạt cho các môn còn lại
        const requiredAverage = remainingPoints / totalIncompleteCredits;
        
        // Quy đổi sang điểm chữ tối thiểu
        const minLetterGrade = getLetterGrade(requiredAverage);
        
        // Nếu không thể đạt được, chỉ trả về thông tin và không tính chiến lược
        if (!isAchievable) {
          aimResult = {
            targetGpa: target,
            currentGpa: calculatedGpa,
            currentCredits: passed, // Hiển thị passed từ educationProgram để đồng bộ với phần đầu
            remainingCredits: total - passed, // Tín chỉ còn lại = tổng - đã học
            requiredAverage: requiredAverage,
            minLetterGrade: minLetterGrade.grade,
            minLetterGradeMark4: minLetterGrade.mark4,
            isAchievable: false,
            maxPossibleGpa: maxPossibleGpa,
            strategies: [],
            optimalStrategy: [],
            finalGpaWithOptimal: 0
          };
        } else {
          // Tính các chiến lược khác nhau để đạt aim
          const strategies: Array<{
            description: string;
            gradeCounts: { [key: string]: number };
            gpa: number;
            subjectDetails: Array<{ name: string; credits: number; grade: string; mark4: number }>;
          }> = [];
          
          // Chiến lược 1: Tất cả đều B
          const ifAllBPoints = currentPoints + (3.0 * totalIncompleteCredits);
          const ifAllBGpa = ifAllBPoints / (passedCreditsForGpa + totalIncompleteCredits);
          if (ifAllBGpa >= target) {
            strategies.push({
              description: `Tất cả môn còn lại đều đạt B (3.0)`,
              gradeCounts: { B: incomplete.length },
              gpa: ifAllBGpa,
              subjectDetails: incomplete.map(subj => ({
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
        if (ifAllMinGradeGpa >= target && minLetterGrade.grade !== 'A' && minLetterGrade.grade !== 'B') {
          strategies.push({
            description: `Tất cả môn còn lại đều đạt ${minLetterGrade.grade}`,
            gradeCounts: { [minLetterGrade.grade]: incomplete.length },
            gpa: ifAllMinGradeGpa,
            subjectDetails: incomplete.map(subj => ({
              name: subj.name,
              credits: subj.credits || 0,
              grade: minLetterGrade.grade,
              mark4: minLetterGrade.mark4
            }))
          });
        }
        
        // Tính các chiến lược kết hợp (A + B, A + B + C, v.v.)
        const gradeValues: { [key: string]: number } = {
          'A': 4.0,
          'B': 3.0,
          'C': 2.0,
          'D': 1.0,
          'F': 0.0
        };
        
        const numSubjects = incomplete.length;
        
        // Tính các chiến lược: từ 0 đến numSubjects môn A, phần còn lại là B
        // Sử dụng số tín chỉ thực tế từ response
        // Lọc bỏ các môn không có số tín chỉ hợp lệ
        const validSubjects = incomplete.filter(subj => (subj.credits || 0) > 0);
        const validNumSubjects = validSubjects.length;
        
        if (validNumSubjects > 0) {
          for (let numA = 0; numA <= validNumSubjects; numA++) {
            const numB = validNumSubjects - numA;
            
            // Bỏ qua trường hợp tất cả đều A (sẽ được thêm riêng nếu cần)
            if (numA === validNumSubjects && numB === 0) {
              continue;
            }
            
            // Bỏ qua trường hợp tất cả đều B (đã có ở chiến lược 1)
            if (numA === 0 && numB === validNumSubjects) {
              continue;
            }
            
            // Tính điểm dựa trên số tín chỉ thực tế từ response
            let strategyPoints = currentPoints;
            let totalCreditsUsed = 0;
            
            // Sắp xếp môn theo số tín chỉ (từ cao xuống thấp) để tối ưu
            const sortedSubjects = [...validSubjects].sort((a, b) => (b.credits || 0) - (a.credits || 0));
            
            for (let i = 0; i < sortedSubjects.length; i++) {
              const credits = sortedSubjects[i].credits || 0;
              if (credits <= 0) continue; // Bỏ qua môn không có tín chỉ
              
              if (i < numA) {
                strategyPoints += gradeValues['A'] * credits;
              } else {
                strategyPoints += gradeValues['B'] * credits;
              }
              totalCreditsUsed += credits;
            }
            
            if (totalCreditsUsed === 0) continue; // Bỏ qua nếu không có tín chỉ hợp lệ
            
            const strategyGpa = strategyPoints / (passedCreditsForGpa + totalCreditsUsed);
            
          // Chỉ thêm chiến lược nếu đạt hoặc vượt mục tiêu
          if (strategyGpa >= target) {
            const gradeCounts: { [key: string]: number } = {};
            if (numA > 0) gradeCounts['A'] = numA;
            if (numB > 0) gradeCounts['B'] = numB;
            
            // Tạo chi tiết từng môn
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
            
            // Chỉ lấy một vài chiến lược đầu tiên để không quá nhiều
            if (strategies.length >= 8) break;
          }
          }
        }
        
        // Thêm chiến lược: Tất cả đều A (nếu đạt aim)
        if (validNumSubjects > 0) {
          const ifAllAPoints = currentPoints + (4.0 * totalIncompleteCredits);
          const ifAllAGpa = ifAllAPoints / (passedCreditsForGpa + totalIncompleteCredits);
          if (ifAllAGpa >= target) {
            strategies.push({
              description: `Tất cả môn còn lại đều đạt A`,
              gradeCounts: { A: incomplete.length },
              gpa: ifAllAGpa,
              subjectDetails: incomplete.map(subj => ({
                name: subj.name,
                credits: subj.credits || 0,
                grade: 'A',
                mark4: 4.0
              }))
            });
          }
        }
        
        // Tính chiến lược: một số môn A, một số môn B, một số môn C
        // Sử dụng số tín chỉ thực tế từ response
        if (validNumSubjects > 0) {
          for (let numA = 0; numA <= Math.min(3, validNumSubjects); numA++) {
            for (let numB = 0; numB <= Math.min(5, validNumSubjects - numA); numB++) {
              const numC = validNumSubjects - numA - numB;
              if (numC < 0) continue;
              
              // Tính điểm dựa trên số tín chỉ thực tế từ response
              let strategyPoints = currentPoints;
              let totalCreditsUsed = 0;
              const sortedSubjects = [...validSubjects].sort((a, b) => (b.credits || 0) - (a.credits || 0));
              
              for (let i = 0; i < sortedSubjects.length; i++) {
                const credits = sortedSubjects[i].credits || 0;
                if (credits <= 0) continue; // Bỏ qua môn không có tín chỉ
                
                if (i < numA) {
                  strategyPoints += gradeValues['A'] * credits;
                } else if (i < numA + numB) {
                  strategyPoints += gradeValues['B'] * credits;
                } else {
                  strategyPoints += gradeValues['C'] * credits;
                }
                totalCreditsUsed += credits;
              }
              
              if (totalCreditsUsed === 0) continue; // Bỏ qua nếu không có tín chỉ hợp lệ
              
              const strategyGpa = strategyPoints / (passedCreditsForGpa + totalCreditsUsed);
              
            if (strategyGpa >= target && strategyGpa <= target + 0.1) {
              const gradeCounts: { [key: string]: number } = {};
              if (numA > 0) gradeCounts['A'] = numA;
              if (numB > 0) gradeCounts['B'] = numB;
              if (numC > 0) gradeCounts['C'] = numC;
              
              // Tạo chi tiết từng môn
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
        
        // Tính chiến lược tối ưu cho từng môn cụ thể
        // Sử dụng thuật toán greedy: ưu tiên môn nhiều tín chỉ đạt điểm cao
        const optimalStrategy: Array<{
          subjectName: string;
          credits: number;
          requiredGrade: string;
          requiredMark4: number;
        }> = [];
        
        if (requiredAverage >= 0 && requiredAverage <= 4.0) {
          // Sắp xếp môn theo số tín chỉ (từ cao xuống thấp) để ưu tiên môn nhiều tín chỉ
          const sortedSubjects = [...incomplete].filter(s => (s.credits || 0) > 0).sort((a, b) => (b.credits || 0) - (a.credits || 0));
          
          // Tính điểm còn thiếu
          let remainingPointsNeeded = remainingPoints;
          
          // Phân bổ điểm cho từng môn (greedy algorithm)
          // Mục tiêu: phân bổ điểm sao cho đạt được targetGPA chính xác
          for (let i = 0; i < sortedSubjects.length; i++) {
            const subject = sortedSubjects[i];
            const credits = subject.credits || 0;
            
            if (credits === 0) continue;
            
            // Tính số tín chỉ còn lại sau môn này
            const remainingCredits = sortedSubjects.slice(i + 1).reduce((sum, s) => sum + (s.credits || 0), 0);
            
            // Tính điểm cần cho môn này
            // Tính lại điểm còn thiếu dựa trên targetGPA chính xác
            const totalNeededPoints = target * (passedCreditsForGpa + totalIncompleteCredits);
            const pointsUsedSoFar = currentPoints + optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0);
            const pointsLeftForAllRemaining = totalNeededPoints - pointsUsedSoFar;
            
            if (i === sortedSubjects.length - 1) {
              // Môn cuối cùng: phải đảm bảo GPA cuối cùng >= aim
              // Tính điểm chính xác cần để đạt >= aim
              const requiredMark4ForThis = pointsLeftForAllRemaining / credits;
              
              // Phải đảm bảo >= aim, không được làm tròn xuống
              // Nếu điểm cần > điểm chữ hiện tại, phải dùng điểm chữ cao hơn
              const requiredGrade = getLetterGrade(requiredMark4ForThis);
              
              // Kiểm tra xem điểm chữ này có đảm bảo >= aim không
              const finalPointsWithThis = currentPoints + optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0) + (requiredGrade.mark4 * credits);
              const finalGpaWithThis = finalPointsWithThis / (passedCreditsForGpa + totalIncompleteCredits);
              
              // Nếu chưa đạt aim, phải tăng điểm chữ lên
              let finalGradeToUse = requiredGrade;
              if (finalGpaWithThis < target) {
                // Tăng điểm chữ lên một bậc
                if (requiredGrade.grade === 'F') finalGradeToUse = { grade: 'D', mark4: 1.0 };
                else if (requiredGrade.grade === 'D') finalGradeToUse = { grade: 'C', mark4: 2.0 };
                else if (requiredGrade.grade === 'C') finalGradeToUse = { grade: 'B', mark4: 3.0 };
                else if (requiredGrade.grade === 'B') finalGradeToUse = { grade: 'A', mark4: 4.0 };
                // Nếu đã là A mà vẫn chưa đạt thì không thể đạt được
              }
              
              optimalStrategy.push({
                subjectName: subject.name,
                credits: credits,
                requiredGrade: finalGradeToUse.grade,
                requiredMark4: finalGradeToUse.mark4
              });
            } else {
              // Với các môn khác: tính điểm tối ưu
              // Ưu tiên môn nhiều tín chỉ đạt điểm cao hơn
              // Tính điểm trung bình cần cho các môn còn lại (bao gồm môn này)
              const totalRemainingCredits = credits + remainingCredits;
              const avgMarkForRemaining = totalRemainingCredits > 0 
                ? pointsLeftForAllRemaining / totalRemainingCredits
                : 0;
              
              // Nếu điểm trung bình >= 3.5, cho môn này đạt A (ưu tiên môn nhiều tín chỉ)
              // Nếu điểm trung bình >= 2.5, cho môn này đạt B
              // v.v.
              let gradeToUse: { grade: string; mark4: number };
              
              // Tính điểm tối đa có thể dùng cho môn này (để các môn còn lại có thể đạt điểm tối thiểu)
              // Nhưng vẫn đảm bảo đạt targetGPA
              const minAvgForOthers = 2.5; // Tối thiểu B cho các môn còn lại
              const maxPointsForThis = pointsLeftForAllRemaining - (remainingCredits * minAvgForOthers);
              
              if (avgMarkForRemaining >= 3.5 && maxPointsForThis >= credits * 4.0) {
                // Đủ điểm để đạt A
                gradeToUse = { grade: 'A', mark4: 4.0 };
              } else if (avgMarkForRemaining >= 2.5 && maxPointsForThis >= credits * 3.0) {
                // Đủ điểm để đạt B
                gradeToUse = { grade: 'B', mark4: 3.0 };
              } else if (avgMarkForRemaining >= 1.5 && maxPointsForThis >= credits * 2.0) {
                // Đủ điểm để đạt C
                gradeToUse = { grade: 'C', mark4: 2.0 };
              } else if (avgMarkForRemaining >= 0.5 && maxPointsForThis >= credits * 1.0) {
                // Đủ điểm để đạt D
                gradeToUse = { grade: 'D', mark4: 1.0 };
              } else {
                // Tính chính xác điểm cần để đạt targetGPA
                // Phân bổ điểm còn lại theo tỷ lệ tín chỉ
                const requiredMark4ForThis = avgMarkForRemaining;
                gradeToUse = getLetterGrade(requiredMark4ForThis);
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
        
        // Tính GPA cuối cùng nếu áp dụng chiến lược tối ưu
        let finalGpaWithOptimal = 0;
        if (optimalStrategy.length > 0) {
          const totalPointsFromOptimal = optimalStrategy.reduce((sum, item) => sum + (item.requiredMark4 * item.credits), 0);
          const totalPointsFinal = currentPoints + totalPointsFromOptimal;
          const totalCreditsFinal = passedCreditsForGpa + totalIncompleteCredits;
          finalGpaWithOptimal = totalCreditsFinal > 0 ? totalPointsFinal / totalCreditsFinal : 0;
        }
        
        aimResult = {
          targetGpa: target,
          currentGpa: calculatedGpa,
          currentCredits: passed, // Hiển thị passed từ educationProgram để đồng bộ với phần đầu
          remainingCredits: total - passed, // Tín chỉ còn lại = tổng - đã học
          requiredAverage: requiredAverage,
          minLetterGrade: minLetterGrade.grade,
          minLetterGradeMark4: minLetterGrade.mark4,
          isAchievable: true,
          maxPossibleGpa: maxPossibleGpa,
          strategies: uniqueStrategies.slice(0, 10), // Chỉ lấy 10 chiến lược đầu tiên
          optimalStrategy: optimalStrategy,
          finalGpaWithOptimal: finalGpaWithOptimal
        };
        }
      } else {
        // Nếu không còn môn nào cần học
        const maxPossibleGpa = calculatedGpa;
        aimResult = {
          targetGpa: target,
          currentGpa: calculatedGpa,
          currentCredits: passed, // Hiển thị passed từ educationProgram để đồng bộ với phần đầu
          remainingCredits: total - passed, // Tín chỉ còn lại = tổng - đã học
          requiredAverage: 0,
          minLetterGrade: '-',
          minLetterGradeMark4: 0,
          isAchievable: calculatedGpa >= target,
          maxPossibleGpa: maxPossibleGpa,
          strategies: [],
          optimalStrategy: [],
          finalGpaWithOptimal: calculatedGpa
        };
      }
    }

    // Tính tổng tín chỉ từ blocks (bao gồm cả môn học điều kiện)
    // total đã được tính từ calculateTotalCreditsFromSubjects
    // passed đã được tính từ traverseBlock
    
    return { 
      totalCredits: total, // Sử dụng tổng từ blocks (bao gồm môn học điều kiện)
      passedCredits: passed, // Sử dụng từ blocks (bao gồm môn học điều kiện)
      incompleteSubjects: incomplete,
      gpa: calculatedGpa,
      aimCalculation: aimResult
    };
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

