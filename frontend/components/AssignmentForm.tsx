'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BookOpen, Calendar, FileText, Hash, Star, Sliders, Upload, X,
  ChevronRight, Loader2, AlertCircle, Lightbulb
} from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import { createAssignment } from '../../lib/api';

const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', desc: 'MCQ with 4 options', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'short_answer', label: 'Short Answer', desc: '2-3 sentence response', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'long_answer', label: 'Long Answer', desc: 'Essay or detailed answer', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'true_false', label: 'True / False', desc: 'Binary response', color: 'bg-green-50 border-green-200 text-green-800' },
  { id: 'fill_blank', label: 'Fill in Blank', desc: 'Complete the sentence', color: 'bg-rose-50 border-rose-200 text-rose-800' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', emoji: '🟢', desc: 'Foundational concepts' },
  { value: 'medium', label: 'Medium', emoji: '🟡', desc: 'Applied understanding' },
  { value: 'hard', label: 'Hard', emoji: '🔴', desc: 'Advanced analysis' },
  { value: 'mixed', label: 'Mixed', emoji: '🎯', desc: 'Balanced distribution' },
];

const GRADE_LEVELS = [
  'Grade 1–5 (Primary)', 'Grade 6–8 (Middle)', 'Grade 9–10 (Secondary)',
  'Grade 11–12 (Senior)', 'Undergraduate', 'Postgraduate', 'Professional',
];

interface FormErrors {
  [key: string]: string;
}

export default function AssignmentForm() {
  const router = useRouter();
  const { formData, setFormData, setCurrentAssignmentId, setGenerationProgress } =
    useAssignmentStore();

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.subject.trim()) e.subject = 'Subject is required';
    if (!formData.gradeLevel) e.gradeLevel = 'Grade level is required';
    if (!formData.dueDate) e.dueDate = 'Due date is required';
    else if (new Date(formData.dueDate) < new Date()) e.dueDate = 'Due date must be in the future';
    if (!formData.questionTypes.length) e.questionTypes = 'Select at least one question type';
    if (!formData.totalQuestions || formData.totalQuestions < 1) e.totalQuestions = 'Must be at least 1';
    if (formData.totalQuestions > 100) e.totalQuestions = 'Maximum 100 questions';
    if (!formData.totalMarks || formData.totalMarks < 1) e.totalMarks = 'Must be at least 1';
    if (formData.totalMarks > 1000) e.totalMarks = 'Maximum 1000 marks';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleQuestionType = (id: string) => {
    const current = formData.questionTypes;
    setFormData({
      questionTypes: current.includes(id) ? current.filter(t => t !== id) : [...current, id],
    });
    if (errors.questionTypes) setErrors(prev => ({ ...prev, questionTypes: '' }));
  };

  const handleFile = (file: File) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast.error('Only PDF, TXT, and MD files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setFormData({ file });
    toast.success(`${file.name} attached`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setGenerationProgress({ status: 'pending', progress: 5, message: 'Creating assignment...' });

    try {
      const result = await createAssignment(formData);
      setCurrentAssignmentId(result.assignmentId);
      toast.success('Assignment queued for generation!');
      router.push(`/generate/${result.assignmentId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment';
      toast.error(msg);
      setGenerationProgress({ status: 'idle', progress: 0, message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (name: string) => ({
    className: `input-base ${errors[name] ? 'error' : ''}`,
    onChange: () => errors[name] && setErrors(prev => ({ ...prev, [name]: '' })),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Section 1: Basic Info */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-navy-700" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">Basic Information</h2>
            <p className="text-xs text-slate-500">Name and configure your assessment</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Assessment Title <span className="text-red-400">*</span>
            </label>
            <input
              {...field('title')}
              type="text"
              value={formData.title}
              onChange={e => { setFormData({ title: e.target.value }); field('title').onChange(); }}
              placeholder="e.g., Mid-Term Examination — Chapter 5 & 6"
              className={`input-base ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={e => { setFormData({ subject: e.target.value }); errors.subject && setErrors(p => ({...p, subject: ''})); }}
              placeholder="e.g., Mathematics, Physics, History"
              className={`input-base ${errors.subject ? 'error' : ''}`}
            />
            {errors.subject && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Grade / Level <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.gradeLevel}
              onChange={e => { setFormData({ gradeLevel: e.target.value }); errors.gradeLevel && setErrors(p => ({...p, gradeLevel: ''})); }}
              className={`input-base ${errors.gradeLevel ? 'error' : ''}`}
            >
              <option value="">Select grade level...</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.gradeLevel && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.gradeLevel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Due Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={formData.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { setFormData({ dueDate: e.target.value }); errors.dueDate && setErrors(p => ({...p, dueDate: ''})); }}
                className={`input-base pl-9 ${errors.dueDate ? 'error' : ''}`}
              />
            </div>
            {errors.dueDate && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.dueDate}</p>}
          </div>
        </div>
      </section>

      {/* Section 2: Question Config */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">Question Configuration</h2>
            <p className="text-xs text-slate-500">Define types, count, and scoring</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Question Types <span className="text-red-400">*</span>
              <span className="ml-2 text-xs text-slate-400 font-normal">Select all that apply</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUESTION_TYPES.map(type => {
                const selected = formData.questionTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleQuestionType(type.id)}
                    className={`
                      relative flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                      ${selected
                        ? 'border-navy-500 bg-navy-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                      ${selected ? 'bg-navy-700 border-navy-700' : 'border-slate-300'}
                    `}>
                      {selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${selected ? 'text-navy-900' : 'text-slate-700'}`}>
                        {type.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{type.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.questionTypes && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.questionTypes}</p>
            )}
          </div>

          {/* Count + Marks */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Hash size={13} />Total Questions <span className="text-red-400">*</span></span>
              </label>
              <input
                type="number"
                min={1} max={100}
                value={formData.totalQuestions}
                onChange={e => { setFormData({ totalQuestions: Number(e.target.value) }); errors.totalQuestions && setErrors(p => ({...p, totalQuestions: ''})); }}
                className={`input-base ${errors.totalQuestions ? 'error' : ''}`}
              />
              {errors.totalQuestions && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.totalQuestions}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Star size={13} />Total Marks <span className="text-red-400">*</span></span>
              </label>
              <input
                type="number"
                min={1} max={1000}
                value={formData.totalMarks}
                onChange={e => { setFormData({ totalMarks: Number(e.target.value) }); errors.totalMarks && setErrors(p => ({...p, totalMarks: ''})); }}
                className={`input-base ${errors.totalMarks ? 'error' : ''}`}
              />
              {errors.totalMarks && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.totalMarks}</p>}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <span className="flex items-center gap-1.5"><Sliders size={13} />Difficulty Level</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ difficulty: opt.value as typeof formData.difficulty })}
                  className={`
                    py-3 px-4 rounded-xl border-2 text-center transition-all
                    ${formData.difficulty === opt.value
                      ? 'border-navy-500 bg-navy-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="text-xl mb-1">{opt.emoji}</div>
                  <div className={`text-sm font-semibold ${formData.difficulty === opt.value ? 'text-navy-900' : 'text-slate-700'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: File Upload + Instructions */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Upload size={16} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">Source Material & Instructions</h2>
            <p className="text-xs text-slate-500">Optional context for AI generation</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Topic Material <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            {formData.file ? (
              <div className="flex items-center gap-3 p-3.5 bg-navy-50 border border-navy-200 rounded-xl">
                <FileText size={18} className="text-navy-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{formData.file.name}</p>
                  <p className="text-xs text-navy-600">{(formData.file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ file: null })}
                  className="p-1 hover:bg-navy-100 rounded-lg transition-colors"
                >
                  <X size={14} className="text-navy-600" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${dragOver ? 'border-navy-400 bg-navy-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
                `}
              >
                <Upload size={24} className={`mx-auto mb-3 ${dragOver ? 'text-navy-500' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">PDF, TXT, MD — up to 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,application/pdf"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* Additional instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Additional Instructions <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={formData.additionalInstructions}
                onChange={e => setFormData({ additionalInstructions: e.target.value })}
                placeholder="e.g., Focus on Chapter 3 & 4. Include at least 2 diagram-based questions. Avoid questions about atomic theory."
                rows={4}
                className="input-base resize-none"
              />
            </div>
            <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
              <Lightbulb size={12} className="flex-shrink-0 mt-0.5" />
              <span>Be specific about topics, chapters, or any constraints for better results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
        <p className="text-sm text-slate-500 text-center sm:text-left">
          AI will generate a structured question paper with sections, marks, and difficulty tags.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all
            bg-navy-900 text-white hover:bg-navy-700 active:scale-95 shadow-navy
            disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
            min-w-[200px] justify-center
          `}
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" />Generating...</>
          ) : (
            <>Generate Paper <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </form>
  );
}
