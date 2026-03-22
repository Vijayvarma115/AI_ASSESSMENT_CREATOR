import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: Question[];
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  duration: string;
  totalMarks: number;
  instructions: string[];
  sections: Section[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: string;
  additionalInstructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: string;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  additionalInstructions: string;
  file?: File | null;
}

interface GenerationProgress {
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}

interface AssignmentStore {
  // Form state
  formData: AssignmentFormData;
  setFormData: (data: Partial<AssignmentFormData>) => void;
  resetForm: () => void;

  // Current assignment
  currentAssignmentId: string | null;
  setCurrentAssignmentId: (id: string | null) => void;

  // Generation progress
  generationProgress: GenerationProgress;
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;

  // Generated paper
  generatedPaper: GeneratedPaper | null;
  setGeneratedPaper: (paper: GeneratedPaper | null) => void;

  // All assignments list
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

const defaultFormData: AssignmentFormData = {
  title: '',
  subject: '',
  gradeLevel: '',
  dueDate: '',
  questionTypes: [],
  totalQuestions: 10,
  totalMarks: 50,
  difficulty: 'mixed',
  additionalInstructions: '',
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    (set) => ({
      formData: defaultFormData,
      setFormData: (data) =>
        set((state) => ({ formData: { ...state.formData, ...data } })),
      resetForm: () => set({ formData: defaultFormData }),

      currentAssignmentId: null,
      setCurrentAssignmentId: (id) => set({ currentAssignmentId: id }),

      generationProgress: { status: 'idle', progress: 0, message: '' },
      setGenerationProgress: (progress) =>
        set((state) => ({
          generationProgress: { ...state.generationProgress, ...progress },
        })),

      generatedPaper: null,
      setGeneratedPaper: (paper) => set({ generatedPaper: paper }),

      assignments: [],
      setAssignments: (assignments) => set({ assignments }),

      wsConnected: false,
      setWsConnected: (connected) => set({ wsConnected: connected }),
    }),
    { name: 'AssignmentStore' }
  )
);
