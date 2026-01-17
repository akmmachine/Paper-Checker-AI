
import React, { useState, useRef, useEffect } from 'react';
import { QuestionData, QuestionStatus } from '../types';
import { auditRawQuestion, auditDocument } from '../services/geminiService';

interface QuestionInputProps {
  onAdd: (q: QuestionData) => void;
  onAddBulk: (qs: QuestionData[]) => void;
}

const LOADING_MESSAGES = [
  "Detecting question components...",
  "Parsing options A, B, C, D...",
  "Extracting solution logic...",
  "Verifying academic accuracy...",
  "Generating redline comparison...",
];

const QuestionInput: React.FC<QuestionInputProps> = ({ onAdd, onAddBulk }) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'UPLOAD'>('SINGLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [rawInput, setRawInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    let progressInterval: any;
    if (isProcessing) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
      }, 2000);

      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + (Math.random() * 8);
        });
      }, 300);
    }
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isProcessing]);

  const handleSmartPasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;

    setIsProcessing(true);
    try {
      const result = await auditRawQuestion(rawInput);
      
      const newQuestion: QuestionData = {
        id: Math.random().toString(36).substr(2, 9),
        topic: result.topic || 'General',
        original: result.originalParsed,
        audit: {
          status: result.status,
          logs: result.auditLogs,
          redlines: result.redlines,
          clean: result.clean
        },
        version: 2,
        lastModified: Date.now()
      };

      setProgress(100);
      setTimeout(() => {
        onAdd(newQuestion);
        setRawInput('');
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      alert("AI failed to parse the question. Please ensure it contains a question, options, and a solution.");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const results = await auditDocument(base64, file.type);
        
        const mappedQuestions: QuestionData[] = results.map((res: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          topic: res.topic,
          original: res.original,
          audit: res.audit,
          version: 2,
          lastModified: Date.now()
        }));

        setProgress(100);
        setTimeout(() => {
          onAddBulk(mappedQuestions);
          setIsProcessing(false);
        }, 500);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Failed to process document.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('SINGLE')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'SINGLE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Smart Paste (Fast Entry)
        </button>
        <button 
          onClick={() => setActiveTab('UPLOAD')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'UPLOAD' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Upload Document
        </button>
      </div>

      <div className="p-8 relative min-h-[350px]">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">AI Audit Active</h3>
              <p className="text-xs font-bold text-indigo-600 animate-pulse mt-1">{loadingMessage}</p>
              <div className="mt-6 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SINGLE' ? (
          <form onSubmit={handleSmartPasteSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Copy-Paste Full Question Content</label>
              <div className="relative group">
                <textarea 
                  rows={10}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition resize-none bg-slate-50/50 text-slate-800 font-medium font-mono text-sm leading-relaxed"
                  placeholder={`Example:\nQ1. What is the value of g?\n(A) 9.8 (B) 10 (C) 1.6 (D) 0\nCorrect Answer: A\nSolution: On Earth, the gravitational constant...`}
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> AI Parsing Enabled
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400 font-medium italic">AI will auto-separate Question, Options, and Solution.</p>
              <button 
                type="submit"
                disabled={!rawInput.trim() || isProcessing}
                className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-xl shadow-xl shadow-indigo-100 transition active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                Run Strict Audit
              </button>
            </div>
          </form>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 transition-colors group">
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="mt-6 text-center px-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Batch Paper Upload</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Extracting multiple MCQs from PDF/DOCX</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 px-10 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-indigo-600 transition shadow-xl"
            >
              Select File
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".pdf,.docx"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionInput;
