'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Minus, X, Upload, Mic, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { useAssignmentStore } from '../../store/assignmentStore';
import { createAssignment } from '../../lib/api';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False Questions',
  'Fill in the Blanks',
];

interface QuestionRow {
  id: string;
  type: string;
  numQuestions: number;
  marks: number;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { setCurrentAssignmentId, setGenerationProgress } = useAssignmentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState<QuestionRow[]>([
    { id: '1', type: 'Multiple Choice Questions', numQuestions: 4, marks: 1 },
    { id: '2', type: 'Short Questions', numQuestions: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', numQuestions: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', numQuestions: 5, marks: 5 },
  ]);

  const totalQuestions = rows.reduce((s, r) => s + r.numQuestions, 0);
  const totalMarks = rows.reduce((s, r) => s + r.numQuestions * r.marks, 0);

  const updateRow = (id: string, field: 'type' | 'numQuestions' | 'marks', value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now().toString(), type: 'Multiple Choice Questions', numQuestions: 2, marks: 1 }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!dueDate) { toast.error('Please select a due date'); return; }
    if (rows.length === 0) { toast.error('Add at least one question type'); return; }

    const assignmentTitle = title || `Assignment – ${new Date().toLocaleDateString()}`;
    const assignmentSubject = subject || 'General';
    const assignmentGrade = gradeLevel || 'Grade 9-10';

    setIsSubmitting(true);
    setGenerationProgress({ status: 'pending', progress: 5, message: 'Creating...' });

    try {
      // Map row types to our internal types
      const typeMap: Record<string, string> = {
        'Multiple Choice Questions': 'mcq',
        'Short Questions': 'short_answer',
        'Long Answer Questions': 'long_answer',
        'Diagram/Graph-Based Questions': 'long_answer',
        'Numerical Problems': 'short_answer',
        'True/False Questions': 'true_false',
        'Fill in the Blanks': 'fill_blank',
      };
      const questionTypes = Array.from(new Set(rows.map(r => typeMap[r.type] || 'short_answer')));

      const result = await createAssignment({
        title: assignmentTitle,
        subject: assignmentSubject,
        gradeLevel: assignmentGrade,
        dueDate,
        questionTypes,
        totalQuestions,
        totalMarks,
        difficulty: 'mixed',
        additionalInstructions: additionalInfo + (rows.length ? `\n\nQuestion breakdown: ${rows.map(r => `${r.numQuestions} ${r.type} (${r.marks} marks each)`).join(', ')}` : ''),
        file,
      });

      setCurrentAssignmentId(result.assignmentId);
      router.push(`/generate/${result.assignmentId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
      setGenerationProgress({ status: 'idle', progress: 0, message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Assignment" showBack />
        <div className="flex-1 p-6 overflow-y-auto">

          {/* Page header */}
          <div className="mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <div>
              <h1 className="text-[18px] font-semibold text-gray-900">Create Assignment</h1>
              <p className="text-sm text-gray-400">Set up a new assignment for your students</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-0 mb-6">
            {[1, 2, 3].map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>

          {/* Main form card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-0.5">Assignment Details</h2>
            <p className="text-sm text-gray-400 mb-5">Basic information about your assignment</p>

            {/* Title / Subject / Grade (optional quick fields) */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assignment Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Quiz on Electricity"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Science"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade / Class</label>
                <input
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  placeholder="e.g. Grade 8"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                />
              </div>
            </div>

            {/* File Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center mb-5 cursor-pointer transition-colors ${
                dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload size={16} className="text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload size={20} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Choose a file or drag & drop it here</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">JPEG, PNG, upto 10MB</p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Browse Files
                  </button>
                </>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.txt"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <p className="text-xs text-gray-400 mb-6 -mt-3">Upload images of your preferred document/image</p>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDueDate(e.target.value)}
                  placeholder="Choose a chapter"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 pr-10 text-gray-600"
                />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Question Type Table */}
            <div className="mb-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_140px_120px_32px] gap-3 mb-2 px-1">
                <span className="text-xs font-medium text-gray-500">Question Type</span>
                <span className="text-xs font-medium text-gray-500 text-center">No. of Questions</span>
                <span className="text-xs font-medium text-gray-500 text-center">Marks</span>
                <span />
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {rows.map(row => (
                  <div key={row.id} className="grid grid-cols-[1fr_140px_120px_32px] gap-3 items-center">
                    {/* Type dropdown */}
                    <div className="relative">
                      <select
                        value={row.type}
                        onChange={e => updateRow(row.id, 'type', e.target.value)}
                        className="w-full appearance-none px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-white pr-8 text-gray-700"
                      >
                        {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Num Questions stepper */}
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'numQuestions', Math.max(1, row.numQuestions - 1))}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-gray-800">{row.numQuestions}</span>
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'numQuestions', row.numQuestions + 1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Marks stepper */}
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'marks', Math.max(1, row.marks - 1))}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-gray-800">{row.marks}</span>
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'marks', row.marks + 1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add row */}
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                  <Plus size={13} className="text-white" />
                </div>
                Add Question Type
              </button>

              {/* Totals */}
              <div className="flex flex-col items-end mt-4 gap-0.5">
                <span className="text-sm text-gray-600">Total Questions : <span className="font-semibold text-gray-900">{totalQuestions}</span></span>
                <span className="text-sm text-gray-600">Total Marks : <span className="font-semibold text-gray-900">{totalMarks}</span></span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
              </label>
              <div className="relative">
                <textarea
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 resize-none pr-10"
                />
                <button className="absolute right-2.5 bottom-2.5 p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <Mic size={15} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1A1A1A' }}
            >
              {isSubmitting ? 'Generating...' : 'Next'}
              {!isSubmitting && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
