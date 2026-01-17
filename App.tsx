
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import QuestionInput from './components/QuestionInput';
import QuestionCard from './components/QuestionCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { UserRole, QuestionData, Paper, QuestionStatus, AuditLog } from './types';
import { auditQuestion } from './services/geminiService';

const STORAGE_KEY_ACTIVE = 'paperchecker_active_questions';
const STORAGE_KEY_HISTORY = 'paperchecker_paper_history';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.TEACHER);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [history, setHistory] = useState<Paper[]>([]);
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);

  // Load history and active session on mount
  useEffect(() => {
    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (Array.isArray(parsed)) {
          setQuestions(parsed.filter(q => q && typeof q === 'object' && q.original));
        }
      } catch (e) { console.error("Failed to load active session"); }
    }

    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter(p => p && p.questions));
        }
      } catch (e) { console.error("Failed to load history"); }
    }
  }, []);

  // Sync active session to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(questions));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }, [questions]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (activeRole === UserRole.TEACHER) {
      setActiveTab('input');
    } else {
      setActiveTab('analytics');
    }
  }, [activeRole]);

  const handleAddQuestion = (q: QuestionData) => {
    setQuestions(prev => [q, ...prev]);
    setActiveTab('review');
  };

  const handleAddBulk = (qs: QuestionData[]) => {
    setQuestions(prev => [...qs, ...prev]);
    setActiveTab('review');
  };

  const handleAuditRequest = async (id: string) => {
    const q = questions.find(item => item.id === id);
    if (!q || !q.original) return;

    setIsAuditingId(id);
    try {
      const result = await auditQuestion(q.original);
      setQuestions(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              topic: result.topic || item.topic,
              audit: {
                status: result.status,
                logs: result.auditLogs,
                redlines: result.redlines,
                clean: result.clean
              }, 
              version: item.version + 1 
            } 
          : item
      ));
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setIsAuditingId(null);
    }
  };

  const handleApprove = (id: string) => {
    setQuestions(prev => prev.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: item.version + 1 }
        : item
    ));
  };

  const handleApproveAll = () => {
    if (window.confirm("Approve all currently audited questions?")) {
      setQuestions(prev => prev.map(item => 
        item.audit && item.audit.status !== QuestionStatus.APPROVED
          ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: item.version + 1 }
          : item
      ));
    }
  };

  const handleReject = (id: string) => {
    setQuestions(prev => prev.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.REJECTED }, version: item.version + 1 }
        : item
    ));
  };

  const archiveCurrentPaper = (finalStatus: 'DRAFT' | 'IN_REVIEW' | 'LOCKED' = 'IN_REVIEW') => {
    if (questions.length === 0) return;

    const mainTopic = questions[0]?.topic || 'Untitled Session';
    const newPaper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${mainTopic} Verification`,
      subject: mainTopic,
      createdBy: 'Faculty User',
      status: finalStatus,
      questions: [...questions],
      createdAt: Date.now()
    };

    setHistory(prev => {
      const updated = [newPaper, ...prev];
      return updated.slice(0, 5); // Keep only last 5
    });

    setQuestions([]);
    setActiveTab('input');
    alert(finalStatus === 'LOCKED' ? "Paper finalized and locked in history." : "Session archived to history.");
  };

  const loadFromHistory = (paper: Paper) => {
    if (questions.length > 0 && !window.confirm("Overwrite current active session with this history item?")) {
      return;
    }
    setQuestions(paper.questions || []);
    setActiveTab('review');
  };

  const clearActiveSession = () => {
    if (window.confirm("Clear all questions in current session? This will not affect archived history.")) {
      setQuestions([]);
      setActiveTab('input');
    }
  };

  const generatePaperContent = (format: 'PDF' | 'WORD') => {
    const title = questions[0]?.topic || 'Paper Checker AI Verified';
    const content = questions.map((q, idx) => {
      const data = q.audit?.clean || q.original;
      return `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="margin-bottom: 10px; font-family: sans-serif;">Question ${idx + 1}</h3>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">${data.question}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            ${data.options.map((opt, i) => `
              <div style="padding: 8px; border: 1px solid #eee; border-radius: 4px;">
                <strong>${String.fromCharCode(65 + i)})</strong> ${opt}
                ${i === data.correctOptionIndex ? ' <span style="color: #059669; font-weight: bold; font-size: 12px;">[CORRECT]</span>' : ''}
              </div>
            `).join('')}
          </div>
          <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1;">
            <strong style="display: block; font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Verified Solution</strong>
            <p style="font-size: 14px; color: #334155; margin: 0; font-style: italic;">${data.solution}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
            h1 { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; }
            .meta { text-align: right; color: #64748b; font-size: 12px; margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <div class="meta">Generated by Paper Checker AI • ${new Date().toLocaleDateString()}</div>
          <h1>${title}</h1>
          ${content}
        </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const html = generatePaperContent('PDF');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleExportWord = () => {
    const html = generatePaperContent('WORD');
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${questions[0]?.topic || 'Paper_Checker_AI'}_Verified.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allLogs: AuditLog[] = questions.flatMap(q => q.audit?.logs || []);

  const renderContent = () => {
    switch (activeTab) {
      case 'input':
        return <QuestionInput onAdd={handleAddQuestion} onAddBulk={handleAddBulk} />;
      case 'review':
        return (
          <div className="space-y-6">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Verification Pipeline</h1>
                <p className="text-slate-500 font-medium">Review AI interventions and verify corrected logic.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleExportPDF}
                  disabled={questions.length === 0}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-50 transition disabled:opacity-30 uppercase tracking-widest"
                >
                  📄 Export PDF
                </button>
                <button 
                  onClick={handleExportWord}
                  disabled={questions.length === 0}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-50 transition disabled:opacity-30 uppercase tracking-widest"
                >
                  📝 Export Word
                </button>
                <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>
                <button 
                  onClick={clearActiveSession}
                  disabled={questions.length === 0}
                  className="px-6 py-2 border-2 border-red-200 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-50 transition disabled:opacity-30 uppercase tracking-widest"
                >
                  Clear Session
                </button>
                <button 
                  onClick={() => archiveCurrentPaper('IN_REVIEW')}
                  disabled={questions.length === 0}
                  className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg shadow-lg hover:bg-indigo-600 transition disabled:opacity-50 uppercase tracking-widest"
                >
                  Archive & New
                </button>
              </div>
            </header>
            {questions.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Questions in Pipeline</p>
                <button onClick={() => setActiveTab('input')} className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold hover:bg-indigo-100 transition">Start New Input</button>
              </div>
            ) : (
              questions.map(q => (
                <QuestionCard 
                  key={q.id} 
                  data={q} 
                  onAudit={handleAuditRequest} 
                  isAuditing={isAuditingId === q.id}
                />
              ))
            )}
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard logs={allLogs} />;
      case 'approval':
        const pending = questions.filter(q => q.audit && q.audit.status !== QuestionStatus.APPROVED);
        const approvedCount = questions.filter(q => q.audit && q.audit.status === QuestionStatus.APPROVED).length;
        const totalAudited = questions.filter(q => q.audit).length;
        const progressPercent = totalAudited > 0 ? Math.round((approvedCount / totalAudited) * 100) : 0;

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">QC Command Center</h1>
                <p className="text-slate-500 font-medium">Final approval required for verified academic content.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Approval Progress</span>
                    <span className="text-indigo-600">{approvedCount}/{totalAudited}</span>
                  </div>
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100" />
                <button 
                  onClick={handleApproveAll}
                  disabled={pending.length === 0}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-100 transition disabled:opacity-30"
                >
                  Approve All Pending
                </button>
              </div>
            </header>

            {totalAudited === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <span className="text-2xl">🚧</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">No Verified Content</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Questions must pass AI verification in the Review tab before reaching QC.</p>
                </div>
                <button onClick={() => setActiveTab('review')} className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">Go to Review</button>
              </div>
            ) : pending.length === 0 ? (
              <div className="bg-indigo-600 rounded-3xl p-12 text-center shadow-2xl shadow-indigo-200 space-y-6">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Paper Fully Cleared</h3>
                  <p className="text-indigo-100 font-medium">All questions in this session have been approved and are ready for finalization.</p>
                </div>
                <div className="flex justify-center gap-4">
                   <button 
                    onClick={() => archiveCurrentPaper('LOCKED')}
                    className="px-8 py-3 bg-white text-indigo-600 font-black rounded-xl uppercase tracking-widest shadow-lg hover:scale-105 transition active:scale-95"
                  >
                    Finalize & Lock Paper
                  </button>
                   <button 
                    onClick={handleExportPDF}
                    className="px-8 py-3 border-2 border-white/30 text-white font-black rounded-xl uppercase tracking-widest hover:bg-white/10 transition"
                  >
                    Print Verified Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map(q => (
                  <QuestionCard 
                    key={q.id} 
                    data={q} 
                    onAudit={handleAuditRequest} 
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isAuditing={isAuditingId === q.id}
                    showQCControls
                  />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeRole={activeRole} 
      onRoleSwitch={setActiveRole}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      history={history}
      onLoadHistory={loadFromHistory}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
