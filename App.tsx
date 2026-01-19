
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import QuestionInput from './components/QuestionInput';
import QuestionCard from './components/QuestionCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { UserRole, QuestionData, Paper, QuestionStatus, AuditLog } from './types';
import { auditQuestion } from './services/geminiService';

const STORAGE_KEY_ACTIVE_ID = 'paperchecker_active_paper_id_v2';
const STORAGE_KEY_HISTORY = 'paperchecker_paper_history_v2';
const STORAGE_KEY_DARK_MODE = 'paperchecker_dark_mode_v2';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.TEACHER);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [history, setHistory] = useState<Paper[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
      if (savedMode !== null) return JSON.parse(savedMode);
    } catch (e) { console.warn("LocalStorage access failed."); }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Derived state: Strictly find the paper in history based on the active ID
  const currentPaper = useMemo(() => {
    return history.find(p => p.id === activePaperId) || null;
  }, [history, activePaperId]);

  const questions = useMemo(() => {
    return currentPaper?.questions || [];
  }, [currentPaper]);

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try { localStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDarkMode)); } catch (e) {}
  }, [isDarkMode]);

  // Initial Load from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedActiveId) setActivePaperId(savedActiveId);
    } catch (e) { console.error("History load failed"); }
  }, []);

  // Persist history and active ID whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      if (activePaperId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activePaperId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch (e) {}
  }, [history, activePaperId]);

  // Handle Role Switch
  const handleRoleSwitch = (newRole: UserRole) => {
    setActiveRole(newRole);
    // When switching to QC, jump to approval or analytics
    if (newRole === UserRole.QC_HEAD) {
      if (questions.length > 0) setActiveTab('approval');
      else setActiveTab('analytics');
    } else {
      // When switching to Teacher, jump to review or input
      if (questions.length > 0) setActiveTab('review');
      else setActiveTab('input');
    }
  };

  // Automatically switch tabs based on content presence (only if in Teacher mode)
  useEffect(() => {
    if (activeRole === UserRole.TEACHER) {
      if (questions.length > 0 && activeTab === 'input') {
        setActiveTab('review');
      }
    }
  }, [activeRole, questions.length, activeTab]);

  // Create a brand new paper entry (Automatic archiving)
  const createPaperFromQuestions = useCallback((qs: QuestionData[]) => {
    const paperName = qs[0]?.topic || 'New Question Set';
    const newPaper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: paperName,
      subject: paperName,
      createdBy: 'Faculty User',
      status: 'IN_REVIEW',
      questions: qs,
      createdAt: Date.now()
    };
    
    setHistory(prev => [newPaper, ...prev]);
    setActivePaperId(newPaper.id);
    setActiveTab('review');
  }, []);

  // Update questions within the currently active paper
  const updateCurrentPaperQuestions = useCallback((newQuestions: QuestionData[]) => {
    if (!activePaperId) return;
    setHistory(prev => prev.map(p => 
      p.id === activePaperId ? { ...p, questions: newQuestions } : p
    ));
  }, [activePaperId]);

  const handleAddBulk = (qs: QuestionData[]) => {
    createPaperFromQuestions(qs);
  };

  const handleAuditRequest = async (id: string) => {
    const q = questions.find(item => item.id === id);
    if (!q || !q.original) return;

    setIsAuditingId(id);
    try {
      const result = await auditQuestion(q.original);
      const updatedQuestions = questions.map(item => 
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
      );
      updateCurrentPaperQuestions(updatedQuestions);
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setIsAuditingId(null);
    }
  };

  const handleApprove = (id: string) => {
    const updated = questions.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: item.version + 1 }
        : item
    );
    updateCurrentPaperQuestions(updated);
  };

  const handleApproveAll = () => {
    if (window.confirm("Approve all currently audited questions?")) {
      const updated = questions.map(item => 
        item.audit && item.audit.status !== QuestionStatus.APPROVED
          ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: item.version + 1 }
          : item
      );
      updateCurrentPaperQuestions(updated);
    }
  };

  const handleReject = (id: string) => {
    const updated = questions.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.REJECTED }, version: item.version + 1 }
        : item
    );
    updateCurrentPaperQuestions(updated);
  };

  const handleLoadHistory = (paper: Paper) => {
    setActivePaperId(paper.id);
    // Based on role, set appropriate tab
    if (activeRole === UserRole.TEACHER) setActiveTab('review');
    else setActiveTab('approval');
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this paper permanently from the archive?")) {
      setHistory(prev => prev.filter(p => p.id !== id));
      if (activePaperId === id) {
        setActivePaperId(null);
        if (activeRole === UserRole.TEACHER) setActiveTab('input');
        else setActiveTab('analytics');
      }
    }
  };

  const generatePaperContent = (isRedlined: boolean = false) => {
    const title = currentPaper?.title || (isRedlined ? 'Audit Report' : 'Verified Questions');
    const htmlContent = questions.map((q, idx) => {
      const data = isRedlined && q.audit?.redlines ? q.audit.redlines : (q.audit?.clean || q.original);
      const cleanData = q.audit?.clean || q.original;
      const isNumerical = !data.options || data.options.length === 0;
      
      return `
        <div style="margin-bottom: 40px; page-break-inside: avoid; font-family: sans-serif;">
          <h3 style="color: #4f46e5; margin-bottom: 8px;">Question ${idx + 1} ${isNumerical ? '(Numerical)' : ''}</h3>
          <p style="font-size: 16px; line-height: 1.5;">${data.question}</p>
          <div style="margin: 15px 0;">
            ${isNumerical ? `
              <div style="margin-bottom: 5px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                <strong style="color: #166534; font-size: 12px; text-transform: uppercase;">Correct Answer:</strong>
                <span style="font-size: 14px; font-weight: bold; margin-left: 10px;">${data.correctAnswer || cleanData.correctAnswer || 'N/A'}</span>
              </div>
            ` : `
              ${data.options!.map((opt, i) => `
                <div style="margin-bottom: 5px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; align-items: flex-start; gap: 8px;">
                  <strong style="color: #6b7280; font-size: 14px;">${String.fromCharCode(65 + i)})</strong>
                  <span style="font-size: 14px; flex: 1;">${opt}</span>
                  ${!isRedlined && i === cleanData.correctOptionIndex ? '<span style="font-size: 10px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">CORRECT</span>' : ''}
                </div>
              `).join('')}
            `}
          </div>
          <div style="padding: 15px; background: #eef2ff; border-radius: 8px; border-left: 4px solid #4f46e5;">
            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Solution Logic:</strong> <em style="display: block; margin-top: 5px;">${data.solution}</em></p>
          </div>
          ${isRedlined && q.audit?.logs && q.audit.logs.length > 0 ? `
            <div style="margin-top: 15px; padding: 10px; border: 1px solid #fee2e2; background: #fef2f2; border-radius: 6px;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #ef4444; display: block; margin-bottom: 5px;">Audit Intervention Notes:</strong>
              ${q.audit.logs.map(log => `<p style="font-size: 12px; margin: 4px 0; color: #b91c1c;">• [${log.type}] ${log.message}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <html>
        <head>
          <style>
            body { padding: 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }
            h1 { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; color: #111827; }
            del { background-color: #fee2e2; color: #991b1b; text-decoration: line-through; padding: 0 2px; border-radius: 2px; }
            ins { background-color: #dcfce7; color: #166534; text-decoration: none; font-weight: bold; padding: 0 2px; border-radius: 2px; }
            .header-meta { text-align: right; color: #9ca3af; font-size: 12px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header-meta">Audit System Report • ${new Date().toLocaleString()}</div>
          <h1>${title} ${isRedlined ? '(Intervention Logs)' : ''}</h1>
          ${htmlContent}
        </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generatePaperContent(false));
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleExportRedlines = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generatePaperContent(true));
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const allLogs: AuditLog[] = history.flatMap(p => p.questions.flatMap(q => q.audit?.logs || []));

  const renderContent = () => {
    const workspaceKey = activePaperId || 'new-workspace';
    
    switch (activeTab) {
      case 'input':
        return <QuestionInput key="input-tab" onAdd={() => {}} onAddBulk={handleAddBulk} />;
      case 'review':
        return (
          <div key={workspaceKey} className="space-y-6 animate-in fade-in duration-300">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-widest">Selected File</span>
                  {currentPaper && <span className="text-[10px] text-slate-400 font-bold">{new Date(currentPaper.createdAt).toLocaleString()}</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {currentPaper ? currentPaper.title : 'Workspace Empty'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Verify AI corrections and lock content for this specific paper.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleExportRedlines}
                  disabled={questions.length === 0}
                  className="px-4 py-2 border-2 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-30 uppercase tracking-widest flex items-center gap-2"
                >
                  🚩 Download Redlines
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={questions.length === 0}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-30 uppercase tracking-widest"
                >
                  📄 Export Clean
                </button>
                <button 
                  onClick={() => { setActivePaperId(null); setActiveTab('input'); }}
                  className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-lg hover:bg-indigo-700 transition uppercase tracking-widest"
                >
                  + New Input
                </button>
              </div>
            </header>
            
            {questions.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-slate-400 dark:text-slate-300 font-bold uppercase tracking-widest text-sm">No Paper Selected</p>
                <p className="text-xs text-slate-500 mt-2 mb-6">Select a file from the archive or start a new input.</p>
                <button onClick={() => setActiveTab('input')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-xl">Go to Input</button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <QuestionCard 
                    key={`${workspaceKey}-${q.id}`} 
                    index={idx + 1}
                    data={q} 
                    onAudit={handleAuditRequest} 
                    isAuditing={isAuditingId === q.id} 
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard logs={allLogs} />;
      case 'approval':
        const pending = questions.filter(q => q.audit && q.audit.status !== QuestionStatus.APPROVED);
        return (
          <div key={`qc-${workspaceKey}`} className="space-y-6 animate-in fade-in duration-300">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">QC Approvals</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Final review for: <span className="text-indigo-600 font-bold">{currentPaper?.title || 'No Paper Selected'}</span></p>
              <button 
                onClick={handleApproveAll} 
                disabled={pending.length === 0}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-30 shadow-lg"
              >
                Approve All Pending
              </button>
            </header>
            <div className="space-y-4">
              {pending.length === 0 ? (
                <div className="p-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">All questions approved or none pending in this file.</p>
                </div>
              ) : (
                pending.map((q, idx) => {
                  // Find the true index in the full list
                  const trueIndex = questions.findIndex(item => item.id === q.id) + 1;
                  return (
                    <QuestionCard 
                      key={`qc-${workspaceKey}-${q.id}`} 
                      index={trueIndex}
                      data={q} 
                      onAudit={handleAuditRequest} 
                      onApprove={handleApprove} 
                      onReject={handleReject} 
                      isAuditing={isAuditingId === q.id} 
                      showQCControls 
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <Layout 
      activeRole={activeRole} 
      onRoleSwitch={handleRoleSwitch}
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      history={history} 
      onLoadHistory={handleLoadHistory}
      activePaperId={activePaperId} 
      createNewPaper={() => { setActivePaperId(null); setActiveTab('input'); }}
      onDeleteHistory={handleDeleteHistory}
      isDarkMode={isDarkMode} 
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
