export const ASSESSMENT_QUEUE = 'assessment-generation';

export interface AssessmentJobData {
  assignmentId: string;
  title: string;
  subject: string;
  gradeLevel: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: string;
  additionalInstructions: string;
  fileContent?: string;
}
