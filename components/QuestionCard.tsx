
import React, { useState } from 'react';
import { QuestionData, QuestionStatus } from '../types';

interface QuestionCardProps {
  data: QuestionData;
  index: number;
  onAudit?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAuditing: boolean;
  showQCControls?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  data, 
  index,
  onApprove, 
  onReject,
  showQCControls 
}) => {
  const [viewMode, setViewMode] = useState<'AUDIT' | 'CLEAN'>('AUDIT');

  const getStatusStyle = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.APPROVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case QuestionStatus.NEEDS_CORRECTION: return 'bg-amber-100 text-amber-700 border-amber-200';
      case QuestionStatus.REJECTED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const renderRedlined = (html: string) => {
    return (
      <div 
        className="prose-sm max-w-none dark:text-slate-200"
        dangerouslySetInnerHTML={{ 
          __html: html.replace(/<del>/g, '<del class="bg-red-100 text-red-800 line-through px-1 rounded mx-0.5">')
                      .replace(/<\/del>/g, '</del>')
                      .replace(/<ins>/g, '<ins class="bg-emerald-100 text-emerald-800 font-bold px-1 rounded mx-0.5">')
                      .replace(/<\/ins>/g, '</ins>')
        }} 
      />
    );
  };

  const isLocked = data.isLocked;
  const isMcq = data.v1_original.options && data.v1_original.options.length > 0;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all overflow-hidden mb-6 ${isLocked ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-200 dark:border-slate-700 shadow-sm'}`}>
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white ${isLocked ? 'bg-emerald-600' : 'bg-slate-900'}`}>{index}</span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(data.status)}`}>{data.status}</span>
          {isLocked && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">LOCKED (V3)</span>}
        </div>
        
        <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('AUDIT')}
            className={`px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all ${viewMode === 'AUDIT' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Audit View (V2)
          </button>
          <button 
            onClick={() => setViewMode('CLEAN')}
            className={`px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all ${viewMode === 'CLEAN' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Clean View (Final)
          </button>
        </div>
      </div>

      <div className="p-8">
        {viewMode === 'AUDIT' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Redlined Audit</h4>
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-lg font-medium leading-relaxed">
                {renderRedlined(data.redlineHtml.question)}
              </div>
            </section>

            {isMcq ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.redlineHtml.options?.map((opt, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
                    <span className="font-black text-slate-400 text-sm">{String.fromCharCode(65+i)}</span>
                    <div className="text-sm font-medium">{renderRedlined(opt)}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Solution Logic Audit</h4>
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-medium italic text-slate-600 dark:text-slate-300">
                {renderRedlined(data.redlineHtml.solution)}
              </div>
            </section>

            {data.auditLogs.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
                {data.auditLogs.map((log, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 ${log.severity === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${log.severity === 'HIGH' ? 'bg-rose-600' : 'bg-amber-600'}`}>{log.severity}</span>
                    <p className="text-xs font-bold leading-tight"><span className="uppercase opacity-70">{log.type}:</span> {log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
             <section>
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Verified Final Question</h4>
              <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-2xl font-black text-slate-900 dark:text-slate-50 leading-tight">
                {data.v2_ai_corrected?.question}
              </div>
            </section>

            {isMcq ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.v2_ai_corrected?.options?.map((opt, i) => (
                  <div key={i} className={`p-5 rounded-2xl border-2 ${i === data.v2_ai_corrected?.correctOptionIndex ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-slate-400 text-xs">{String.fromCharCode(65+i)}</span>
                      {i === data.v2_ai_corrected?.correctOptionIndex && <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Verified Correct</span>}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{opt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-700 flex justify-between items-center shadow-2xl">
                 <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Correct Answer</h4>
                   <p className="text-3xl font-black text-indigo-400">{data.v2_ai_corrected?.correctAnswer}</p>
                 </div>
              </div>
            )}

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Final Solution</h4>
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {data.v2_ai_corrected?.solution}
              </div>
            </section>
          </div>
        )}
      </div>

      {showQCControls && !isLocked && (
        <div className="px-8 py-5 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">QC Workflow Action required</p>
          <div className="flex gap-4">
            <button 
              onClick={() => onApprove?.(data.id)}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg tracking-widest transition-all shadow-lg shadow-emerald-900/20"
            >
              Approve & Lock (V3)
            </button>
            <button 
              onClick={() => onReject?.(data.id)}
              className="px-6 py-2.5 border border-rose-500 text-rose-500 hover:bg-rose-900/20 text-[10px] font-black uppercase rounded-lg tracking-widest transition-all"
            >
              Reject for Correction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
