
import React, { useState, useRef, useEffect } from 'react';
import { QuestionData, QuestionStatus } from '../types';
import { auditDocument } from '../services/geminiService';

interface QuestionInputProps {
  onAdd: (q: QuestionData) => void;
  onAddBulk: (qs: QuestionData[]) => void;
}

const LOADING_MESSAGES = [
  "Inhaling document structure...",
  "Identifying question boundaries...",
  "Analyzing academic logic...",
  "Running cross-validation checks...",
  "Formatting redlined corrections...",
  "Finalizing audit report...",
];

const QuestionInput: React.FC<QuestionInputProps> = ({ onAdd, onAddBulk }) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'UPLOAD'>('SINGLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    solution: '',
    topic: ''
  });

  // Cycle through loading messages while processing
  useEffect(() => {
    let interval: any;
    let progressInterval: any;
    if (isProcessing) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
      }, 2500);

      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev; // Hold at 95 until complete
          return prev + (Math.random() * 5);
        });
      }, 400);
    } else {
      setLoadingMessage(LOADING_MESSAGES[0]);
      setProgress(0);
    }
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.solution || formData.options.some(o => !o)) {
      alert("Please fill all components. Incomplete questions are blocked from the audit pipeline.");
      return;
    }

    const newQuestion: QuestionData = {
      id: Math.random().toString(36).substr(2, 9),
      topic: formData.topic || 'General',
      original: {
        question: formData.question,
        options: [...formData.options],
        correctOptionIndex: formData.correctOptionIndex,
        solution: formData.solution
      },
      version: 1,
      lastModified: Date.now()
    };

    onAdd(newQuestion);
    setFormData({
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      solution: '',
      topic: ''
    });
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
      alert("Failed to process document. Ensure it is a valid PDF or Word file.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateOption = (idx: number, val: string) => {
    const next = [...formData.options];
    next[idx] = val;
    setFormData({ ...formData, options: next });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('SINGLE')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'SINGLE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Manual Question Entry
        </button>
        <button 
          onClick={() => setActiveTab('UPLOAD')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'UPLOAD' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Upload Paper (PDF/Word)
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'SINGLE' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Topic / Chapter</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition bg-slate-50/50"
                  placeholder="e.g. Thermodynamics"
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Question Body</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none bg-slate-50/50 text-slate-800 font-medium"
                placeholder="Paste question text here..."
                value={formData.question}
                onChange={e => setFormData({...formData, question: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((opt, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition ${formData.correctOptionIndex === idx ? 'border-green-500 bg-green-50/50' : 'border-slate-100 bg-slate-50/30'}`}>
                  <input 
                    type="radio" 
                    name="correct" 
                    checked={formData.correctOptionIndex === idx}
                    onChange={() => setFormData({...formData, correctOptionIndex: idx})}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={e => updateOption(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Detailed Solution</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none bg-slate-50/50 text-slate-800 font-medium italic"
                placeholder="Explain the logic..."
                value={formData.solution}
                onChange={e => setFormData({...formData, solution: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition active:scale-95 text-xs uppercase tracking-widest"
              >
                Enqueue for Audit
              </button>
            </div>
          </form>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 transition-colors group relative overflow-hidden min-h-[400px]">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute -inset-4 border border-indigo-100 rounded-full animate-ping opacity-25"></div>
                </div>
                
                <div className="text-center max-w-xs">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.15em] mb-1">AI Audit Live</h3>
                  <p className="text-xs font-bold text-indigo-600 animate-pulse uppercase tracking-wider h-4">
                    {loadingMessage}
                  </p>
                  
                  <div className="mt-8 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Processing Accuracy: {Math.round(progress)}%
                  </p>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="mt-6 text-center px-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Drop Question Paper</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium max-w-sm">AI will automatically parse structure, detect errors, and suggest redlines across multiple questions.</p>
              <div className="mt-4 flex gap-2 justify-center">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-black text-slate-500 border border-slate-200">PDF</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-black text-slate-500 border border-slate-200">DOCX</span>
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 px-10 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-indigo-600 transition shadow-xl active:scale-95"
            >
              Select File
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionInput;
