'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Sparkles, Brain, FileCheck, Zap } from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getAssignment } from '../../lib/api';

const STEPS = [
  { icon: Brain, label: 'Analyzing requirements', threshold: 0 },
  { icon: Sparkles, label: 'Structuring question paper', threshold: 30 },
  { icon: Zap, label: 'Generating questions with AI', threshold: 55 },
  { icon: FileCheck, label: 'Validating and formatting', threshold: 80 },
];

interface Props {
  assignmentId: string;
}

export default function GenerationProgress({ assignmentId }: Props) {
  const router = useRouter();
  const { generationProgress, setGeneratedPaper, setGenerationProgress } = useAssignmentStore();

  useWebSocket(assignmentId);

  // Poll fallback in case WS misses the message
  const pollStatus = useCallback(async () => {
    try {
      const assignment = await getAssignment(assignmentId);
      if (assignment.status === 'completed' && assignment.generatedPaper) {
        setGeneratedPaper(assignment.generatedPaper);
        setGenerationProgress({ status: 'completed', progress: 100, message: 'Question paper ready!' });
      } else if (assignment.status === 'failed') {
        setGenerationProgress({
          status: 'failed',
          progress: 0,
          message: assignment.errorMessage || 'Generation failed',
        });
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  }, [assignmentId, setGeneratedPaper, setGenerationProgress]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (generationProgress.status !== 'completed' && generationProgress.status !== 'failed') {
        pollStatus();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [generationProgress.status, pollStatus]);

  useEffect(() => {
    if (generationProgress.status === 'completed') {
      const t = setTimeout(() => {
        router.push(`/result/${assignmentId}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [generationProgress.status, assignmentId, router]);

  const { progress, status, message } = generationProgress;
  const failed = status === 'failed';
  const completed = status === 'completed';

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto text-center">

        {/* Icon */}
        <div className={`
          w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-medium
          ${completed ? 'bg-green-50' : failed ? 'bg-red-50' : 'bg-navy-900'}
        `}>
          {completed ? (
            <CheckCircle size={36} className="text-green-500" />
          ) : failed ? (
            <XCircle size={36} className="text-red-500" />
          ) : (
            <Loader2 size={36} className="text-white animate-spin" />
          )}
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
          {completed ? 'Paper Generated!' : failed ? 'Generation Failed' : 'Generating Your Paper'}
        </h1>
        <p className="text-slate-500 mb-10 text-sm">
          {failed
            ? message || 'Something went wrong. Please try again.'
            : completed
            ? 'Redirecting to your question paper...'
            : 'AI is crafting your personalized question paper'}
        </p>

        {!failed && (
          <>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>{message}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 text-left">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = progress >= step.threshold && progress < (STEPS[i + 1]?.threshold ?? 101);
                const isDone = progress > (STEPS[i + 1]?.threshold ?? 100);

                return (
                  <div
                    key={i}
                    className={`
                      flex items-center gap-3 p-3.5 rounded-xl border transition-all
                      ${isActive
                        ? 'bg-navy-50 border-navy-200 shadow-sm'
                        : isDone
                        ? 'bg-green-50 border-green-200'
                        : 'bg-slate-50 border-slate-200 opacity-40'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive ? 'bg-navy-900' : isDone ? 'bg-green-500' : 'bg-slate-300'}
                    `}>
                      {isDone ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : (
                        <Icon
                          size={16}
                          className={`${isActive ? 'text-white' : 'text-slate-500'} ${isActive ? 'animate-pulse' : ''}`}
                        />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-navy-900' : isDone ? 'text-green-800' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                    {isActive && (
                      <Loader2 size={14} className="ml-auto text-navy-400 animate-spin" />
                    )}
                    {isDone && (
                      <span className="ml-auto text-xs text-green-600 font-medium">Done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {failed && (
          <button
            onClick={() => router.push('/create')}
            className="mt-6 px-6 py-3 bg-navy-900 text-white rounded-xl font-medium hover:bg-navy-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
