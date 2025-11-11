import { create } from 'zustand';
import apiClient from '@/lib/axios';
import { getErrorMessage } from '@/lib/error-handler';

export interface StudentSummaryMark {
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  birthDateString?: string;
  birthPlace?: string;
  gender?: string;
  idNumber?: string;
  className?: string;
  classCode?: string;
  departmentName?: string;
  specialityName?: string;
  courseYear?: string;
  educationTypeName?: string;
  programId?: number;
  gpa?: number;
  averageMark?: number;
  totalCredits?: number;
  completedCredits?: number;
  summaryMarks?: Array<{
    subjectCode?: string;
    subjectName?: string;
    credit?: number;
    mark?: number;
    grade?: string;
  }>;
  [key: string]: any;
}

export interface SubjectMark {
  subjectCode?: string;
  subjectName?: string;
  credits?: number;
  processMark?: number;
  examMark?: number;
  totalMark?: number;
  letterGrade?: string;
  mark4?: number;
  semesterId?: number;
  semesterCode?: string;
  semesterName?: string;
  isCounted?: boolean;
  result?: number;
  id?: number;
  [key: string]: any;
}

export interface ProgramSubject {
  id: number;
  subject?: {
    subjectCode?: string;
    subjectName?: string;
    numberOfCredit?: number;
  };
  displaySubjectName?: string;
  hasMark?: boolean;
  result?: number | null;
  blockType?: number;
}

export interface StudentSubjectMark {
  id: number;
  subject?: {
    subjectCode?: string;
    subjectName?: string;
    numberOfCredit?: number;
  };
  mark4?: number | null;
  result?: number | null;
  isCounted?: boolean | null;
  charMark?: string | null;
}

export interface EducationBlock {
  id: number;
  blockType: number;
  displayName: string;
  passedCredits: number;
  totalCredit: number | null;
  isComplete: boolean;
  listProgramSubject: ProgramSubject[] | null;
  listStudentSubjectMark: StudentSubjectMark[] | null;
  children: EducationBlock[];
  minNumberCredit?: number;
}

interface StudentState {
  studentData: StudentSummaryMark | null;
  loading: boolean;
  error: string | null;
  fetchStudentData: () => Promise<void>;
  clearStudentData: () => void;
  subjectMarks: SubjectMark[];
  marksLoading: boolean;
  marksError: string | null;
  marksSearchQuery: string;
  setMarksSearchQuery: (query: string) => void;
  marksFilters: {
    passStatus: 'all' | 'passed' | 'failed';
    letterGrade: 'all' | 'A' | 'B' | 'C' | 'D';
    isCounted: 'all' | 'yes' | 'no';
    credits: 'all' | '1' | '2' | '3' | 'above3';
  };
  setMarksFilters: (filters: Partial<StudentState['marksFilters']>) => void;
  fetchSubjectMarks: () => Promise<void>;
  clearSubjectMarks: () => void;
  educationProgram: EducationBlock[];
  educationProgramLoading: boolean;
  educationProgramError: string | null;
  fetchEducationProgram: () => Promise<void>;
  clearEducationProgram: () => void;
}

const useStudentStore = create<StudentState>((set, get) => ({
  studentData: null,
  loading: false,
  error: null,
  fetchStudentData: async () => {
    // Tránh gọi API nếu đang loading
    if (get().loading) {
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const response = await apiClient.get<any>(
        '/api/studentsummarymark/getbystudent'
      );

      // Handle both array and single object responses
      const apiData = Array.isArray(response.data) ? response.data[0] : response.data;

      if (!apiData) {
        throw new Error('Không có dữ liệu sinh viên');
      }

      const student = apiData.student || {};

      // Lấy enrollmentClass từ nhiều nguồn có thể: student.enrollmentClass, apiData.enrollmentClassDto, apiData.enrollmentClass
      const enrollmentClass = student.enrollmentClass || apiData.enrollmentClassDto || apiData.enrollmentClass || {};

      // Lấy programId từ enrollmentClass.program.id hoặc student.programs[0].program.id
      const programId = enrollmentClass.program?.id || 
                       (student.programs && student.programs.length > 0 && student.programs[0].program?.id) ||
                       undefined;

      // Transform API response - lấy đúng từ enrollmentClass
      const transformedData: StudentSummaryMark = {
        studentId: student.id?.toString(),
        studentCode: student.studentCode,
        studentName: student.displayName || student.firstName,
        fullName: student.displayName ||
          (student.lastName && student.firstName
            ? `${student.lastName} ${student.firstName}`
            : undefined),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        birthDateString: student.birthDateString,
        birthPlace: student.birthPlace,
        gender: student.gender,
        idNumber: student.idNumber,
        // Class info - lấy từ enrollmentClass (ưu tiên student.enrollmentClass)
        className: enrollmentClass.className || undefined,
        classCode: enrollmentClass.classCode || undefined,
        departmentName: enrollmentClass.department?.name || undefined,
        specialityName: enrollmentClass.speciality?.name || undefined,
        courseYear: enrollmentClass.courseyear?.name || enrollmentClass.courseYear?.name || undefined,
        educationTypeName: enrollmentClass.courseyear?.educationType?.name ||
          enrollmentClass.educationType?.name ||
          enrollmentClass.program?.educationType?.name || undefined,
        // Program ID - dùng để gọi API education program
        programId: programId,
        // Academic info
        gpa: apiData.gpa,
        averageMark: apiData.averageMark,
        totalCredits: apiData.totalCredits,
        completedCredits: apiData.completedCredits,
        summaryMarks: apiData.summaryMarks || (Array.isArray(apiData.summaryMark) ? apiData.summaryMark : []),
      };

      set({ studentData: transformedData, loading: false });
    } catch (error) {
      console.error('Error fetching student data:', error);
      const errorMessage = getErrorMessage(error) || 'Không thể tải thông tin sinh viên. Vui lòng thử lại.';
      set({ error: errorMessage, loading: false });
    }
  },
  clearStudentData: () =>
    set({
      studentData: null,
      loading: false,
      error: null,
    }),
  subjectMarks: [],
  marksLoading: false,
  marksError: null,
  marksSearchQuery: '',
  setMarksSearchQuery: (query: string) => set({ marksSearchQuery: query }),
  marksFilters: {
    passStatus: 'all',
    letterGrade: 'all',
    isCounted: 'all',
    credits: 'all',
  },
  setMarksFilters: (filters: Partial<StudentState['marksFilters']>) => 
    set((state) => ({ 
      marksFilters: { ...state.marksFilters, ...filters } 
    })),
  fetchSubjectMarks: async () => {
    // Tránh gọi API nếu đang loading
    if (get().marksLoading) {
      return;
    }

    set({ marksLoading: true, marksError: null });
    
    try {
      const response = await apiClient.get<any>(
        '/api/studentsubjectmark/getListStudentMarkBySemesterByLoginUser/0'
      );

      console.log('=== RAW SUBJECT MARKS API RESPONSE ===', JSON.stringify(response.data, null, 2));

      // Handle both array and single object responses
      const apiData = Array.isArray(response.data) ? response.data : [response.data];

      if (!apiData || apiData.length === 0) {
        // Không throw error, chỉ set empty array vì có thể không có môn học
        set({ subjectMarks: [], marksLoading: false });
        return;
      }

      console.log('=== TOTAL ITEMS FROM API ===', apiData.length);

      // Transform API response - based on actual API structure
      const transformedMarks: SubjectMark[] = apiData.map((item: any, index: number) => {
        // Get subject name and credits - try multiple paths
        const subjectName = item.subject?.subjectName || 
                           item.subject?.name || 
                           item.subjectName || 
                           item.name || 
                           `Môn học ${index + 1}`;
        const credits = item.subject?.numberOfCredit || 
                       item.subject?.credit || 
                       item.numberOfCredit || 
                       item.credit || 
                       0;
        
        // Get total mark and letter grade from root level
        const totalMark = item.mark !== undefined && item.mark !== null ? item.mark : undefined;
        const letterGrade = item.charMark || item.letterGrade || item.grade || '-';
        
        // Get process mark and exam mark from details array
        let processMark: number | undefined = undefined;
        let examMark: number | undefined = undefined;
        
        if (Array.isArray(item.details)) {
          // Find DQT (Điểm quá trình) in details
          const dqtDetail = item.details.find((detail: any) => 
            detail.subjectExam?.code === 'DQT' || detail.code === 'DQT'
          );
          if (dqtDetail && dqtDetail.mark !== undefined && dqtDetail.mark !== null) {
            processMark = dqtDetail.mark;
          }
          
          // Find THI (Thi) in details
          const thiDetail = item.details.find((detail: any) => 
            detail.subjectExam?.code === 'THI' || detail.code === 'THI'
          );
          if (thiDetail && thiDetail.mark !== undefined && thiDetail.mark !== null) {
            examMark = thiDetail.mark;
          }
        }
        
        // Fallback: try markQT and markTHI from root level if details not found
        if (processMark === undefined && item.markQT !== undefined && item.markQT !== null) {
          processMark = item.markQT;
        }
        if (examMark === undefined && item.markTHI !== undefined && item.markTHI !== null) {
          examMark = item.markTHI;
        }
        
        return {
          id: item.id,
          subjectCode: item.subject?.subjectCode || item.subjectCode,
          subjectName,
          credits,
          processMark,
          examMark,
          totalMark,
          letterGrade,
          mark4: item.mark4 !== undefined && item.mark4 !== null ? item.mark4 : undefined,
          semesterId: item.semester?.id,
          semesterCode: item.semester?.semesterCode || item.semester?.code,
          semesterName: item.semester?.semesterName || item.semester?.name,
          isCounted: item.isCounted,
          result: item.result,
        };
      });

      console.log('=== TRANSFORMED MARKS COUNT ===', transformedMarks.length);
      console.log('=== TRANSFORMED MARKS ===', JSON.stringify(transformedMarks, null, 2));

      set({ subjectMarks: transformedMarks, marksLoading: false });
    } catch (error) {
      console.error('Error fetching subject marks:', error);
      const errorMessage = getErrorMessage(error) || 'Không thể tải thông tin điểm môn học. Vui lòng thử lại.';
      set({ marksError: errorMessage, marksLoading: false });
    }
  },
  clearSubjectMarks: () =>
    set({
      subjectMarks: [],
      marksLoading: false,
      marksError: null,
      marksSearchQuery: '',
      marksFilters: {
        passStatus: 'all',
        letterGrade: 'all',
        isCounted: 'all',
        credits: 'all',
      },
    }),
  educationProgram: [],
  educationProgramLoading: false,
  educationProgramError: null,
  fetchEducationProgram: async () => {
    // Tránh gọi API nếu đang loading
    if (get().educationProgramLoading) {
      return;
    }

    // Lấy programId từ studentData
    let studentData = get().studentData;
    let programId = studentData?.programId;

    // Set loading state ngay để hiển thị skeleton
    set({ educationProgramLoading: true, educationProgramError: null });

    // Nếu chưa có programId, cần fetch studentData trước
    if (!programId) {
      // Đợi nếu studentData đang được fetch
      if (get().loading) {
        // Đợi tối đa 10 giây cho fetchStudentData hoàn thành
        let waitCount = 0;
        while (get().loading && waitCount < 100) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
      }
      
      // Thử fetch studentData nếu chưa có
      if (!studentData && !get().loading) {
        await get().fetchStudentData();
      }
      
      // Sau khi fetch hoặc đợi xong, lấy lại studentData và programId
      studentData = get().studentData;
      programId = studentData?.programId;
      
      // Kiểm tra lại sau khi fetch
      if (!programId) {
        set({ 
          educationProgramError: studentData 
            ? 'Không tìm thấy thông tin ngành học. Vui lòng thử lại.'
            : 'Vui lòng đăng nhập để xem chương trình học.',
          educationProgramLoading: false 
        });
        return;
      }
    }
    
    try {
      // Sử dụng programId từ studentData thay vì hardcode
      const finalProgramId = programId;
      const response = await apiClient.get<{ content: EducationBlock[]; totalElements: number }>(
        `/api/studentsubjectmark/checkFinishedEducationProgramOfStudent/tree/studentId/${finalProgramId}`
      );

      set({ 
        educationProgram: response.data.content || [], 
        educationProgramLoading: false 
      });
    } catch (error) {
      console.error('Error fetching education program:', error);
      const errorMessage = getErrorMessage(error) || 'Không thể tải thông tin chương trình học. Vui lòng thử lại.';
      set({ educationProgramError: errorMessage, educationProgramLoading: false });
    }
  },
  clearEducationProgram: () =>
    set({
      educationProgram: [],
      educationProgramLoading: false,
      educationProgramError: null,
    }),
}));

export default useStudentStore;
