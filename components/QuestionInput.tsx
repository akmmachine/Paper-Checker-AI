
import React, { useState, useRef, useEffect } from 'react';
import { auditRawInput, auditDocumentInput } from '../services/geminiService';
import mammoth from 'mammoth';

interface QuestionInputProps {
  onAdd: (q: any) => void;
  onAddBulk: (qs: any[]) => void;
}

const VALIDATION_KEYWORDS = ['question', 'option', 'answer', 'solution'];

const QuestionInput: React.FC<QuestionInputProps> = ({ onAddBulk }) => {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'UPLOAD' | 'CSV'>('TEXT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePresence = (text: string) => {
    const lower = text.toLowerCase();
    const missing = VALIDATION_KEYWORDS.filter(k => !lower.includes(k));
    if (missing.length > 0) {
      return `Input missing core components: ${missing.join(', ')}. All are mandatory for Audit.`;
    }
    return null;
  };

  const handleAuditSubmit = async () => {
    setError(null);
    const validationError = validatePresence(rawInput);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    try {
      const results = await auditRawInput(rawInput);
      onAddBulk(results);
      setRawInput('');
    } catch (err) {
      setError("AI Audit failed to process this input. Please check the format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const isDocx = file.name.endsWith('.docx');
      let results: any[] = [];

      if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        const validationError = validatePresence(value);
        if (validationError) {
          setError(`Document validation failed: ${validationError}`);
          setIsProcessing(false);
          return;
        }
        results = await auditRawInput(value);
      } else {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        results = await auditDocumentInput(base64, file.type);
      }
      onAddBulk(results);
    } catch (err) {
      setError("Document extraction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-12">
      <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('TEXT')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'TEXT' ? 'text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Smart Editor</button>
        <button onClick={() => setActiveTab('UPLOAD')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'UPLOAD' ? 'text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>File Intake</button>
        <button onClick={() => setActiveTab('CSV')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'CSV' ? 'text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Bulk CSV</button>
      </div>

      <div className="p-10 relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Executing Strict AI Audit...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <span className="text-rose-500 font-black text-xl">⚠️</span>
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {activeTab === 'TEXT' && (
          <div className="space-y-6">
             <textarea 
               rows={10}
               className="w-full p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 font-mono text-sm leading-relaxed focus:border-indigo-500 outline-none transition-all"
               placeholder="Example Input Format:&#10;&#10;Question: What is 2+2?&#10;Option A: 3&#10;Option B: 4&#10;Answer: B&#10;Solution: Addition of two and two equals four."
               value={rawInput}
               onChange={e => setRawInput(e.target.value)}
             />
             <button 
               onClick={handleAuditSubmit}
               disabled={!rawInput.trim() || isProcessing}
               className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
             >
               Initialize Paper Audit
             </button>
          </div>
        )}

        {activeTab === 'UPLOAD' && (
           <div className="flex flex-col items-center justify-center h-[300px] border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl hover:border-indigo-400 transition-all">
              <svg className="w-12 h-12 text-slate-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg"
              >
                Upload PDF / DOCX
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,image/*" onChange={e => e.target.files && processFile(e.target.files[0])} />
           </div>
        )}

        {activeTab === 'CSV' && (
           <div className="text-center py-20">
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Bulk CSV Support coming in v2.6</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default QuestionInput;
