'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import TopBar from '../../../components/TopBar';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { getAssignment } from '../../../lib/api';

const STEPS = [
  { label: 'Analyzing assignment details', threshold: 0 },
  { label: 'Building question structure', threshold: 25 },
  { label: 'Generating questions with AI', threshold: 50 },
  { label: 'Assigning marks & difficulty', threshold: 75 },
  { label: 'Formatting question paper', threshold: 90 },
];

export default function GeneratePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { generationProgress, setGeneratedPaper, setGenerationProgress } = useAssignmentStore();
  useWebSocket(params.id);

  const poll = useCallback(async () => {
    try {
      const a = await getAssignment(params.id);
      if (a.status === 'completed' && a.generatedPaper) {
        setGeneratedPaper(a.generatedPaper);
        setGenerationProgress({ status: 'completed', progress: 100, message: 'Done!' });
      } else if (a.status === 'failed') {
        setGenerationProgress({ status: 'failed', progress: 0, message: a.errorMessage || 'Failed' });
      }
    } catch {}
  }, [params.id, setGeneratedPaper, setGenerationProgress]);

  useEffect(() => {
    const t = setInterval(() => {
      if (generationProgress.status !== 'completed' && generationProgress.status !== 'failed') poll();
    }, 3500);
    return () => clearInterval(t);
  }, [generationProgress.status, poll]);

  useEffect(() => {
    if (generationProgress.status === 'completed') {
      setTimeout(() => router.push(`/result/${params.id}`), 800);
    }
  }, [generationProgress.status, params.id, router]);

  const { progress, status, message } = generationProgress;
  const failed = status === 'failed';
  const completed = status === 'completed';

  return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Assignment" showBack />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 w-full max-w-md text-center">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
              completed ? 'bg-green-50' : failed ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              {completed ? (
                <CheckCircle size={32} className="text-green-500" />
              ) : failed ? (
                <XCircle size={32} className="text-red-400" />
              ) : (
                <Loader2 size={32} className="text-gray-400 animate-spin" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {completed ? 'Paper Generated!' : failed ? 'Generation Failed' : 'Generating Question Paper'}
            </h2>
            <p className="text-sm text-gray-400 mb-7">
              {failed ? (message || 'Something went wrong') : completed ? 'Redirecting...' : 'AI is crafting your personalized question paper'}
            </p>

            {!failed && !completed && (
              <>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: '#1A1A1A' }}
                  />
                </div>

                {/* Steps */}
                <div className="space-y-2.5 text-left">
                  {STEPS.map((step, i) => {
                    const done = progress > (STEPS[i + 1]?.threshold ?? 101);
                    const active = progress >= step.threshold && !done;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-green-500' : active ? 'bg-gray-800' : 'bg-gray-200'
                        }`}>
                          {done ? (
                            <CheckCircle size={12} className="text-white" />
                          ) : active ? (
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          ) : null}
                        </div>
                        <span className={`text-sm ${done ? 'text-green-600' : active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                        {active && <Loader2 size={12} className="ml-auto text-gray-400 animate-spin" />}
                        {done && <span className="ml-auto text-xs text-green-500">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {failed && (
              <button
                onClick={() => router.push('/create')}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-xl"
                style={{ background: '#1A1A1A' }}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
