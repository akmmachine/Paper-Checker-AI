
import React, { useState } from 'react';
import { QuestionData, QuestionStatus } from '../types';

interface QuestionCardProps {
  data: QuestionData;
  index: number; // Sequential number of the question in the paper
  onAudit: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAuditing: boolean;
  showQCControls?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  data, 
  index,
  onAudit, 
  onApprove, 
  onReject,
  isAuditing, 
  showQCControls 
}) => {
  const [viewMode, setViewMode] = useState<'AUDIT' | 'CLEAN'>('AUDIT');

  const getStatusStyle = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case QuestionStatus.NEEDS_CORRECTION: return 'bg-amber-100 text-amber-700 border-amber-200';
      case QuestionStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const renderRedlined = (html: any) => {
    const safeHtml = typeof html === 'string' ? html : '';
    if (!safeHtml) return <span className="text-slate-400 italic">No content available</span>;

    return (
      <div 
        className="prose-sm max-w-none dark:text-slate-200"
        dangerouslySetInnerHTML={{ 
          __html: safeHtml.replace(/<del>/g, '<del class="bg-red-100 text-red-800 line-through px-1 rounded mx-0.5">')
                      .replace(/<\/del>/g, '</del>')
                      .replace(/<ins>/g, '<ins class="bg-green-100 text-green-800 font-medium px-1 rounded mx-0.5">')
                      .replace(/<\/ins>/g, '</ins>')
        }} 
      />
    );
  };

  // Safely extract content with fallbacks
  const displayOptions = data.audit?.redlines?.options || data.original?.options || [];
  const cleanOptions = data.audit?.clean?.options || [];
  const correctIdx = data.audit?.clean?.correctOptionIndex ?? data.original?.correctOptionIndex ?? 0;
  const isNumerical = displayOptions.length === 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6 group hover:border-indigo-300 transition">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm shadow-sm">
              {index}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-300">Question</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(data.audit?.status || QuestionStatus.PENDING)}`}>
            {data.audit?.status || 'UNAUDITED'}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{data.topic || 'General'}</span>
          {isNumerical && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-200 px-1.5 py-0.5 rounded">Numerical</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {!data.audit && !isAuditing && (
            <button 
              onClick={() => onAudit(data.id)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow transition active:scale-95"
            >
              Start AI Audit
            </button>
          )}
          {isAuditing && <span className="text-xs text-indigo-500 animate-pulse font-medium">Verifying logic...</span>}
          {data.audit && (
            <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
              <button 
                onClick={() => setViewMode('AUDIT')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'AUDIT' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                AUDIT VIEW
              </button>
              <button 
                onClick={() => setViewMode('CLEAN')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'CLEAN' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                CLEAN VIEW
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'AUDIT' || !data.audit ? (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase mb-2 tracking-wider">Question Body</p>
              {data.audit?.redlines?.question ? (
                renderRedlined(data.audit.redlines.question)
              ) : (
                <p className="text-slate-800 dark:text-slate-200 font-medium">{data.original?.question || 'No question text provided.'}</p>
              )}
            </div>

            {isNumerical ? (
              <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2 tracking-wider">Target Answer</p>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {data.audit?.redlines?.correctAnswer ? renderRedlined(data.audit.redlines.correctAnswer) : (data.original?.correctAnswer || 'N/A')}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayOptions.map((opt, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${i === correctIdx ? 'bg-green-50 border-green-200' : 'border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-700/30'}`}>
                    <span className="font-bold text-xs text-slate-400 dark:text-slate-300 mt-0.5">{String.fromCharCode(65+i)})</span>
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      {data.audit?.redlines?.options ? renderRedlined(opt) : opt}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase mb-2 tracking-wider">Solution Logic</p>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 text-sm italic text-slate-600 dark:text-slate-300">
                {data.audit?.redlines?.solution ? (
                  renderRedlined(data.audit.redlines.solution)
                ) : (
                  data.original?.solution || 'No solution provided.'
                )}
              </div>
            </div>

            {data.audit?.logs && data.audit.logs.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-red-400 uppercase mb-2 tracking-wider">Audit Findings</p>
                <div className="space-y-2">
                  {data.audit.logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-center text-xs text-slate-600 dark:text-slate-300 bg-red-50 p-2 rounded border border-red-100 dark:border-red-800">
                      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black">{log.severity}</span>
                      <span className="font-bold uppercase text-[10px] text-red-700">{log.type}:</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-green-500 uppercase mb-2 tracking-wider">Exam-Ready Question</p>
              <p className="text-slate-900 dark:text-slate-50 font-semibold text-lg leading-relaxed">{data.audit?.clean?.question || 'No cleaned content available.'}</p>
            </div>
            
            {isNumerical ? (
              <div className="p-6 bg-green-50/50 dark:bg-green-900/10 border-2 border-green-500/20 rounded-2xl">
                <p className="text-[10px] font-bold text-green-600 uppercase mb-2 tracking-wider">Verified Final Answer</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">{data.audit?.clean?.correctAnswer || 'N/A'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cleanOptions.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-xl border-2 transition ${i === correctIdx ? 'border-green-500 bg-green-50' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400 dark:text-slate-300 text-xs">{String.fromCharCode(65+i)}</span>
                      {i === correctIdx && <span className="bg-green-600 text-white text-[8px] font-black px-1 rounded">CORRECT</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{opt}</p>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2 tracking-wider">Verified Solution</p>
              <div className="bg-indigo-50/50 dark:bg-indigo-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {data.audit?.clean?.solution || 'No cleaned solution available.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      {showQCControls && data.audit && (
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <span className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase">QC Review Required</span>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => onApprove?.(data.id)}
              className="px-6 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded uppercase tracking-widest transition active:scale-95"
            >
              Approve & Lock
            </button>
            <button 
              onClick={() => onReject?.(data.id)}
              className="px-4 py-1.5 border border-red-500/50 text-red-400 hover:bg-red-900/20 text-xs font-black rounded uppercase tracking-widest transition active:scale-95"
            >
              Reject Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
