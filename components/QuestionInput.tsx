
import React, { useState, useRef, useEffect } from 'react';
import { QuestionData } from '../types';
import { auditRawQuestion, auditDocument } from '../services/geminiService';
import mammoth from 'mammoth';

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
  "OCR in progress...",
];

const QuestionInput: React.FC<QuestionInputProps> = ({ onAdd, onAddBulk }) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'UPLOAD' | 'IMAGE'>('SINGLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [rawInput, setRawInput] = useState('');
  const [stagedSnippets, setStagedSnippets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleStageSnippet = () => {
    if (!rawInput.trim()) return;
    setStagedSnippets(prev => [...prev, rawInput.trim()]);
    setRawInput('');
  };

  const removeStagedSnippet = (index: number) => {
    setStagedSnippets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSmartPasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalQueue = [...stagedSnippets];
    if (rawInput.trim()) finalQueue.push(rawInput.trim());

    if (finalQueue.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    try {
      const combinedInput = finalQueue.join('\n\n---NEXT QUESTION---\n\n');
      const results = await auditRawQuestion(combinedInput);
      
      const mappedQuestions: QuestionData[] = results.map((result: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        topic: result.topic || 'Pasted Content',
        original: result.originalParsed,
        audit: {
          status: result.status,
          logs: result.auditLogs,
          redlines: result.redlines,
          clean: result.clean
        },
        version: 2,
        lastModified: Date.now()
      }));

      setProgress(100);
      setTimeout(() => {
        onAddBulk(mappedQuestions);
        setRawInput('');
        setStagedSnippets([]);
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      alert("AI failed to parse the questions. Please ensure the text format is clear.");
      setIsProcessing(false);
    }
  };

  const processFiles = async (files: FileList | null, isImage: boolean) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const filesArray: File[] = Array.from(files);

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setLoadingMessage(`Scanning ${file.name} (${i + 1} of ${filesArray.length})...`);
        setProgress(Math.floor((i / filesArray.length) * 100));

        const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        let results: any[] = [];

        if (isDocx) {
          // GEMINI API does not support .docx binary inlineData natively.
          // We extract text locally using mammoth.js and then send it as a raw text prompt.
          const arrayBuffer = await file.arrayBuffer();
          const extractResult = await mammoth.extractRawText({ arrayBuffer });
          const text = extractResult.value;
          
          if (!text.trim()) {
            console.warn(`File ${file.name} appears to be empty or unreadable.`);
            continue;
          }

          results = await auditRawQuestion(text);
        } else {
          // PDF and Images are supported natively by Gemini API via inlineData
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });

          results = await auditDocument(base64, file.type);
        }
        
        const mapped = results.map((res: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          topic: `[${file.name}] ${res.topic || 'General'}`,
          original: res.originalParsed,
          audit: {
            status: res.status,
            logs: res.auditLogs,
            redlines: res.redlines,
            clean: res.clean
          },
          version: 2,
          lastModified: Date.now()
        }));

        onAddBulk(mapped);
      }

      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Failed to process one or more files. Ensure they are clear and readable.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('SINGLE')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'SINGLE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Smart Paste {stagedSnippets.length > 0 && `(${stagedSnippets.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('UPLOAD')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'UPLOAD' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          PDF/Docx Upload
        </button>
        <button 
          onClick={() => setActiveTab('IMAGE')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'IMAGE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Image/Photo
        </button>
      </div>

      <div className="p-8 relative min-h-[420px]">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center px-6 max-w-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">AI Extraction Active</h3>
              <p className="text-xs font-bold text-indigo-600 animate-pulse mt-1 h-4">{loadingMessage}</p>
              <div className="mt-6 w-64 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mx-auto border border-slate-200 dark:border-slate-600">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SINGLE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Input Workspace</label>
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500">Separated by clear labels (Q, Options, Solution)</span>
                </div>
                <textarea 
                  rows={8}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-0 transition resize-none bg-slate-50/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 font-medium font-mono text-sm leading-relaxed"
                  placeholder="Paste questions here. AI will detect and organize them into a new file..."
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                />
              </div>

              {stagedSnippets.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staged Batches ({stagedSnippets.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stagedSnippets.map((snippet, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl group hover:border-indigo-200 transition">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-5 h-5 flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-full text-[10px] font-bold shrink-0">{idx + 1}</span>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{snippet.slice(0, 40)}...</p>
                        </div>
                        <button 
                          onClick={() => removeStagedSnippet(idx)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                type="button"
                onClick={handleStageSnippet}
                disabled={!rawInput.trim() || isProcessing}
                className="flex-1 px-6 py-3.5 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:border-slate-300 disabled:text-slate-400 font-black rounded-xl transition active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                Stage for Process
              </button>
              <button 
                type="button"
                onClick={handleSmartPasteSubmit}
                disabled={(stagedSnippets.length === 0 && !rawInput.trim()) || isProcessing}
                className="flex-[1.5] px-10 py-3.5 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-black rounded-xl shadow-xl transition active:scale-95 text-[10px] uppercase tracking-[0.2em]"
              >
                Auto-Archive & Verify ({stagedSnippets.length + (rawInput.trim() ? 1 : 0)})
              </button>
            </div>
          </div>
        )}

        {activeTab === 'UPLOAD' && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl hover:border-indigo-400 transition-colors group bg-slate-50/50 dark:bg-slate-700/50 animate-in fade-in duration-300">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mt-6 text-center px-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-wide">Document Intake</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Each file will be saved as a separate archive entry.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 px-12 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-indigo-600 transition shadow-xl"
            >
              Select PDF/DOCX
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".pdf,.docx" 
              multiple 
              onChange={(e) => processFiles(e.target.files, false)} 
            />
          </div>
        )}

        {activeTab === 'IMAGE' && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl hover:border-emerald-400 transition-colors group bg-slate-50/50 dark:bg-slate-700/50 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl group-hover:bg-emerald-100 transition-colors">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="mt-6 text-center px-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-wide">Image Recognition</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Upload photos or screenshots of question papers.</p>
            </div>
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="mt-8 px-12 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-emerald-600 transition shadow-xl"
            >
              Select Images
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={imageInputRef} 
              accept="image/*" 
              multiple 
              onChange={(e) => processFiles(e.target.files, true)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionInput;
