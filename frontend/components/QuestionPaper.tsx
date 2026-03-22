'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Download, RefreshCw, Printer, Clock, Star, BookOpen,
  ChevronDown, ChevronUp, Loader2, ArrowLeft, User, Hash, LayoutGrid
} from 'lucide-react';
import { GeneratedPaper, Question } from '../store/assignmentStore';
import { regenerateAssignment } from '../lib/api';
import { useAssignmentStore } from '../store/assignmentStore';

const DIFFICULTY_CONFIG = {
  easy: { 
    label: 'Easy', 
    className: 'inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700 border border-green-200', 
    dot: 'bg-green-500',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200'
  },
  medium: { 
    label: 'Medium', 
    className: 'inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 border border-amber-200', 
    dot: 'bg-amber-500',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  hard: { 
    label: 'Hard', 
    className: 'inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200', 
    dot: 'bg-red-500',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  },
};

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  true_false: 'True/False',
  fill_blank: 'Fill in Blank',
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const diff = DIFFICULTY_CONFIG[question.difficulty] || DIFFICULTY_CONFIG.medium;

  return (
    <div className="py-5 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3">
        {/* Question number */}
        <div className="w-7 h-7 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
          {index}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={diff.className}>
              <span className={`w-2 h-2 rounded-full ${diff.dot}`} />
              {diff.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {TYPE_LABELS[question.type] || question.type}
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium ml-auto">
              <Star size={10} />
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </span>
          </div>

          {/* Question text */}
          <p className="text-sm leading-relaxed text-slate-800 mb-3">{question.text}</p>

          {/* MCQ Options */}
          {question.type === 'mcq' && question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm text-slate-700">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true_false' && (
            <div className="flex gap-3 mb-3">
              {['True', 'False'].map(v => (
                <div key={v} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  <span className="text-sm font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Answer space */}
          {(question.type === 'short_answer' || question.type === 'fill_blank') && (
            <div className="border-b-2 border-dashed border-slate-300 h-8 mb-3" />
          )}
          {question.type === 'long_answer' && (
            <div className="space-y-2 mb-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border-b border-slate-200 h-7" />
              ))}
            </div>
          )}

          {/* Answer toggle */}
          {question.answer && (
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-1.5 text-xs text-navy-600 hover:text-navy-800 font-medium transition-colors no-print"
            >
              {showAnswer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAnswer ? 'Hide Answer' : 'Show Answer Key'}
            </button>
          )}
          {showAnswer && question.answer && (
            <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              <span className="font-semibold">Answer: </span>{question.answer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  paper: GeneratedPaper;
  assignmentId: string;
  dueDate?: string;
}

export default function QuestionPaper({ paper, assignmentId, dueDate }: Props) {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { setGenerationProgress, setGeneratedPaper } = useAssignmentStore();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateAssignment(assignmentId);
      setGeneratedPaper(null);
      setGenerationProgress({ status: 'pending', progress: 5, message: 'Re-queuing generation...' });
      toast.success('Regeneration started!');
      router.push(`/generate/${assignmentId}`);
    } catch (err) {
      toast.error('Failed to regenerate. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    toast.loading('Preparing PDF...', { id: 'pdf' });
    try {
      // Dynamically import to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      if (!paperRef.current) throw new Error('No paper element');

      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: paperRef.current.scrollWidth,
        height: paperRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      let heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${paper.title.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF generation failed. Use Print instead.', { id: 'pdf' });
    }
  }, [paper.title]);

  const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const difficultyBreakdown = paper.sections.flatMap(s => s.questions).reduce(
    (acc, q) => { acc[q.difficulty] = (acc[q.difficulty] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Action Bar */}
      <div className="no-print sticky top-16 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Regenerate
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-700 transition-all shadow-navy"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="no-print max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: 'Subject', value: paper.subject },
            { icon: Hash, label: 'Questions', value: totalQuestions },
            { icon: Star, label: 'Total Marks', value: paper.totalMarks },
            { icon: Clock, label: 'Duration', value: paper.duration },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-soft">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} className="text-slate-400" />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <p className="font-semibold text-navy-900 text-sm truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Difficulty breakdown */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <LayoutGrid size={13} className="text-slate-400" />
          <span className="text-slate-500">Difficulty:</span>
          {Object.entries(difficultyBreakdown).map(([diff, count]) => (
            <span key={diff} className={`px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_CONFIG[diff as keyof typeof DIFFICULTY_CONFIG]?.className}`}>
              {count} {diff}
            </span>
          ))}
        </div>
      </div>

      {/* THE EXAM PAPER */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div
          ref={paperRef}
          className="paper-container bg-white rounded-2xl border border-slate-200 shadow-large overflow-hidden"
        >
          {/* Paper Header */}
          <div className="bg-navy-900 px-8 py-8 text-white relative overflow-hidden">
            {/* Decorative lines */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-0 right-0 h-px bg-white" />
              <div className="absolute bottom-4 left-0 right-0 h-px bg-white" />
            </div>

            <div className="text-center relative">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white/80 mb-4">
                <BookOpen size={12} />
                {paper.subject}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                {paper.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" />
                  Time Allowed: <strong className="text-white">{paper.duration}</strong>
                </span>
                <span className="text-white/30">|</span>
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="text-amber-400" />
                  Maximum Marks: <strong className="text-white">{paper.totalMarks}</strong>
                </span>
                {dueDate && (
                  <>
                    <span className="text-white/30">|</span>
                    <span>Due: <strong className="text-white">{new Date(dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-parchment border-b border-slate-200 px-8 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: User, label: "Student's Name" },
                { icon: Hash, label: 'Roll Number' },
                { icon: LayoutGrid, label: 'Section / Class' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-end gap-3">
                  <Icon size={14} className="text-slate-400 mb-1 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 font-medium block mb-1">{label}</span>
                    <div className="border-b-2 border-slate-400 w-full h-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions */}
          {paper.instructions?.length > 0 && (
            <div className="px-8 py-5 bg-amber-50/60 border-b border-amber-100">
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
                General Instructions
              </h3>
              <ol className="space-y-1.5 list-none">
                {paper.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Sections */}
          <div className="divide-y divide-slate-100">
            {paper.sections.map((section, sIdx) => (
              <div key={section.id} className="px-8 py-6">
                {/* Section header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {String.fromCharCode(65 + sIdx)}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-navy-900 text-lg">{section.title}</h2>
                    </div>
                    <p className="text-xs text-slate-500 ml-10 italic">{section.instruction}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-xs text-slate-500">Section Marks</span>
                    <p className="font-display font-bold text-navy-900 text-lg">{section.totalMarks}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-navy-200 via-navy-100 to-transparent mb-4" />

                {/* Questions */}
                <div>
                  {section.questions.map((question, qIdx) => {
                    const globalIdx = paper.sections
                      .slice(0, sIdx)
                      .reduce((sum, s) => sum + s.questions.length, 0) + qIdx + 1;
                    return (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={globalIdx}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Paper Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Generated by VedaAI • {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Total: {paper.totalMarks} marks | {totalQuestions} questions
            </p>
          </div>

          {/* ANSWER KEY SECTION */}
          <div className="border-t-2 border-dashed border-slate-300 px-8 py-8 bg-white">
            {/* Answer Key Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <span className="text-amber-700 font-bold text-lg">✓</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-navy-900">Answer Key</h2>
              </div>
              <p className="text-sm text-slate-600 ml-11">Complete solutions and answers for all questions</p>
            </div>

            {/* Answer Key by Section */}
            <div className="space-y-8">
              {paper.sections.map((section, sIdx) => (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-soft">
                  {/* Section header in answer key */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded bg-navy-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {String.fromCharCode(65 + sIdx)}
                        </span>
                      </div>
                      <h3 className="font-bold text-navy-900">{section.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 ml-10">({section.questions.length} questions • {section.totalMarks} marks)</p>
                  </div>

                  {/* Questions in answer key */}
                  <div className="divide-y divide-slate-100">
                    {section.questions.map((question, qIdx) => {
                      const globalIdx = paper.sections
                        .slice(0, sIdx)
                        .reduce((sum, s) => sum + s.questions.length, 0) + qIdx + 1;
                      const diff = DIFFICULTY_CONFIG[question.difficulty] || DIFFICULTY_CONFIG.medium;

                      return (
                        <div key={question.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                          {/* Q number and type */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {globalIdx}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={diff.className}>
                                  <span className={`w-2 h-2 rounded-full ${diff.dot}`} />
                                  {diff.label}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  {TYPE_LABELS[question.type] || question.type}
                                </span>
                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                                  <Star size={10} className="mr-1" />
                                  {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-800 mb-2">{question.text}</p>
                            </div>
                          </div>

                          {/* Answer section */}
                          {question.answer ? (
                            <div className="ml-9 p-3 rounded-lg border border-slate-200 bg-slate-50">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Answer:</p>
                              <p className="text-sm text-slate-800 leading-relaxed">{question.answer}</p>
                            </div>
                          ) : (
                            <div className="ml-9 p-3 rounded-lg bg-slate-50 border border-slate-200">
                              <p className="text-xs text-slate-500 italic">No answer provided</p>
                            </div>
                          )}

                          {/* Options for MCQ (shown in answer key) */}
                          {question.type === 'mcq' && question.options && (
                            <div className="ml-9 mt-3 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-600 mb-2">Options:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {question.options.map((opt, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                    <span className="font-bold text-slate-500 min-w-fit">({String.fromCharCode(65 + i)})</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Questions</p>
                  <p className="text-lg font-bold text-navy-900">{totalQuestions}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Marks</p>
                  <p className="text-lg font-bold text-navy-900">{paper.totalMarks}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Difficulty Distribution</p>
                  <p className="text-sm font-semibold text-navy-900">
                    {Object.entries(difficultyBreakdown).map(([diff, count]) => (
                      <span key={diff} className="block">{capitalize(diff)}: {count}</span>
                    ))}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Duration</p>
                  <p className="text-lg font-bold text-navy-900">{paper.duration}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
