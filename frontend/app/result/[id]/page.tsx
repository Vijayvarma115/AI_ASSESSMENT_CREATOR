'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Loader2, Code2, MessageSquare, Hand, MousePointer2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../../components/Sidebar';
import { useAssignmentStore, GeneratedPaper, Question } from '../../../store/assignmentStore';
import { getAssignment, regenerateAssignment } from '../../../lib/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

/* ─── Difficulty config ─────────────────────────────── */
const D: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',       color: '#22C55E' },
  medium: { label: 'Moderate',   color: '#F59E0B' },
  hard:   { label: 'Challenging', color: '#EF4444' },
};

/* ─── Question renderer ─────────────────────────────── */
function QuestionItem({ q, index }: { q: Question; index: number }) {
  const d = D[q.difficulty] || D.medium;
  return (
    <li className="mb-3">
      <div className="flex items-start gap-1">
        <span className="text-sm text-gray-800 leading-relaxed">
          <span className="font-normal">{index}. </span>
          <span style={{ color: d.color, fontWeight: 500 }}>[{d.label}]</span>
          {' '}{q.text}{' '}
          <span className="text-gray-500">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
        </span>
      </div>
      {/* MCQ options */}
      {q.type === 'mcq' && q.options && (
        <div className="ml-4 mt-1 grid grid-cols-2 gap-x-6">
          {q.options.map((opt, i) => (
            <span key={i} className="text-sm text-gray-700">
              ({String.fromCharCode(97 + i)}) {opt}
            </span>
          ))}
        </div>
      )}
      {/* True/False */}
      {q.type === 'true_false' && (
        <div className="ml-4 mt-1 flex gap-6 text-sm text-gray-700">
          <span>(a) True</span><span>(b) False</span>
        </div>
      )}
      {/* Fill blank */}
      {q.type === 'fill_blank' && (
        <div className="ml-4 mt-1 border-b border-gray-400 w-48 h-5" />
      )}
    </li>
  );
}

/* ─── The formatted exam paper ──────────────────────── */
function ExamPaper({ paper, dueDate }: { paper: GeneratedPaper; dueDate?: string }) {
  let qCounter = 0;

  // Build answer key entries
  const allQuestions = paper.sections.flatMap(s => s.questions);
  const answerableQs = allQuestions.filter(q => q.answer);

  return (
    <div className="font-serif text-[13px] leading-relaxed text-gray-900">
      {/* School header */}
      <div className="text-center mb-4 pb-3 border-b border-gray-300">
        <h1 className="text-[16px] font-bold">Delhi Public School, Sector-4, Bokaro</h1>
        <p className="text-[13px] mt-0.5">Subject: {paper.subject}</p>
        <p className="text-[13px]">Class: {paper.title.includes('Grade') ? paper.title.split('Grade')[1]?.trim() : '–'}</p>
      </div>

      {/* Meta row */}
      <div className="flex justify-between mb-3 text-[12px]">
        <span>Time Allowed: {paper.duration}</span>
        <span>Maximum Marks: {paper.totalMarks}</span>
      </div>

      {/* General instructions */}
      {paper.instructions?.length > 0 && (
        <div className="mb-4">
          {paper.instructions.map((inst, i) => (
            <p key={i} className="text-[12px] text-gray-700">{inst}</p>
          ))}
        </div>
      )}

      {/* Student fields */}
      <div className="mb-5 space-y-1.5 text-[12px]">
        <div>Name: <span className="inline-block border-b border-gray-500 w-36 ml-1" /></div>
        <div>Roll Number: <span className="inline-block border-b border-gray-500 w-32 ml-1" /></div>
        <div>Class: 5th Section: <span className="inline-block border-b border-gray-500 w-24 ml-1" /></div>
      </div>

      {/* Sections */}
      {paper.sections.map((section) => (
        <div key={section.id} className="mb-6">
          <h2 className="text-center font-bold text-[14px] mb-1">{section.title}</h2>
          <p className="font-semibold text-[12px] mb-0.5">
            {section.questions[0] && (
              <>
                {section.questions[0].type === 'short_answer' ? 'Short Answer Questions' :
                 section.questions[0].type === 'long_answer' ? 'Long Answer Questions' :
                 section.questions[0].type === 'mcq' ? 'Multiple Choice Questions' :
                 section.questions[0].type === 'true_false' ? 'True or False' :
                 'Questions'}
              </>
            )}
          </p>
          <p className="italic text-[11px] text-gray-600 mb-2">{section.instruction}</p>
          <ol className="list-none space-y-1">
            {section.questions.map((q) => {
              qCounter++;
              return <QuestionItem key={q.id} q={q} index={qCounter} />;
            })}
          </ol>
        </div>
      ))}

      <p className="text-center font-bold text-[12px] mt-4 mb-6 border-t border-gray-300 pt-3">
        End of Question Paper
      </p>

      {/* Answer Key */}
      {answerableQs.length > 0 && (
        <div>
          <p className="font-bold text-[13px] mb-2">Answer Key:</p>
          <ol className="list-none space-y-1.5">
            {answerableQs.map((q, i) => (
              <li key={q.id} className="text-[12px] text-gray-700">
                <span className="font-medium">{i + 1}.</span> {q.answer}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ─── Result page ───────────────────────────────────── */
export default function ResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);
  const { generatedPaper, setGeneratedPaper, setGenerationProgress } = useAssignmentStore();
  const [loading, setLoading] = useState(!generatedPaper);
  const [dueDate, setDueDate] = useState<string>();
  const [isRegenerating, setIsRegenerating] = useState(false);
  useWebSocket(params.id);

  useEffect(() => {
    if (generatedPaper) { setLoading(false); return; }
    getAssignment(params.id).then(a => {
      setDueDate(a.dueDate);
      if (a.status === 'completed' && a.generatedPaper) {
        setGeneratedPaper(a.generatedPaper);
      } else if (a.status !== 'completed') {
        router.replace(`/generate/${params.id}`);
      }
    }).catch(() => router.replace('/')).finally(() => setLoading(false));
  }, [params.id, generatedPaper, router, setGeneratedPaper]);

  const handleDownloadPDF = useCallback(async () => {
    toast.loading('Preparing PDF...', { id: 'pdf' });
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!paperRef.current) throw new Error();
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#fff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      let left = 0, pageH = pdf.internal.pageSize.getHeight();
      while (left < h) {
        if (left > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -left, w, h);
        left += pageH;
      }
      pdf.save(`${generatedPaper?.title || 'question-paper'}.pdf`);
      toast.success('Downloaded!', { id: 'pdf' });
    } catch {
      toast.error('PDF failed — use Print instead', { id: 'pdf' });
    }
  }, [generatedPaper]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateAssignment(params.id);
      setGeneratedPaper(null);
      setGenerationProgress({ status: 'pending', progress: 5, message: 'Re-queuing...' });
      router.push(`/generate/${params.id}`);
    } catch { toast.error('Failed to regenerate'); }
    finally { setIsRegenerating(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar activeOverride="AI Teacher's Toolkit" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    </div>
  );

  if (!generatedPaper) return null;

  return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar activeOverride="AI Teacher's Toolkit" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs text-gray-400">✦</span>
            <span className="font-medium text-gray-700">Create New</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative"><span className="text-lg">🔔</span></button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">👤</div>
              <span className="text-sm text-gray-700 font-medium">John Doe</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-4">

            {/* AI message bubble */}
            <div className="bg-[#1A1A1A] text-white rounded-2xl p-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8500A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L15 14H3L9 2Z" fill="white"/>
                  <circle cx="9" cy="13" r="2" fill="white"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download size={13} />
                  Download as PDF
                </button>
              </div>
            </div>

            {/* The exam paper document */}
            <div
              ref={paperRef}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-8"
            >
              <ExamPaper paper={generatedPaper} dueDate={dueDate} />
            </div>
          </div>
        </div>

        {/* Bottom action bar — like Figma Image 4 */}
        <div className="no-print bg-[#1A1A1A] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <MousePointer2 size={18} className="text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Hand size={18} className="text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <MessageSquare size={18} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Regenerate
            </button>
            <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-gray-900 bg-white hover:bg-gray-100 transition-colors">
              Ask to edit
            </button>
          </div>

          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Code2 size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
