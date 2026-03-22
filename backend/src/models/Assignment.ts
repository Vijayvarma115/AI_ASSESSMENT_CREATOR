import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: IQuestion[];
}

export interface IGeneratedPaper {
  title: string;
  subject: string;
  duration: string;
  totalMarks: number;
  instructions: string[];
  sections: ISection[];
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  additionalInstructions: string;
  fileContent?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  generatedPaper?: IGeneratedPaper;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  marks: { type: Number, required: true },
  options: [{ type: String }],
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  questions: [QuestionSchema],
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  instructions: [{ type: String }],
  sections: [SectionSchema],
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: [{ type: String }],
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    additionalInstructions: { type: String, default: '' },
    fileContent: { type: String },
    fileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    generatedPaper: GeneratedPaperSchema,
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
