
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import QuestionInput from './components/QuestionInput';
import QuestionCard from './components/QuestionCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginScreen from './components/LoginScreen';
import { UserRole, QuestionData, Paper, QuestionStatus, AuditLog, UserProfile, QuestionVersion } from './types';
import { auditRawInput } from './services/geminiService';
import { dbService, MOCK_USERS } from './services/dbService';

const STORAGE_KEY_DARK_MODE = 'paperchecker_dark_mode_v2';
const STORAGE_KEY_USER_ID = 'paperchecker_active_user_id';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_USER_ID);
    return MOCK_USERS.find(u => u.id === savedId) || null;
  });
  
  const [activeTab, setActiveTab] = useState<string>('input');
  const [history, setHistory] = useState<Paper[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
      if (savedMode !== null) return JSON.parse(savedMode);
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const papers = await dbService.getPapers();
        setHistory(papers);
        if (papers.length > 0) setActivePaperId(papers[0].id);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER_ID, currentUser.id);
      setActiveTab(currentUser.role === UserRole.QC_HEAD ? 'approval' : 'input');
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_ID);
    }
  }, [currentUser]);

  const currentPaper = useMemo(() => history.find(p => p.id === activePaperId) || null, [history, activePaperId]);
  const questions = useMemo(() => currentPaper?.questions || [], [currentPaper]);

  const handleLogin = (user: UserProfile) => setCurrentUser(user);
  const handleLogout = () => { setCurrentUser(null); setActivePaperId(null); };

  const createPaperFromAudit = useCallback(async (results: any[]) => {
    if (!currentUser) return;
    setIsSyncing(true);
    
    const paperQuestions: QuestionData[] = results.map(res => ({
      id: Math.random().toString(36).substr(2, 9),
      topic: res.topic || 'General',
      status: QuestionStatus.PENDING,
      isLocked: false,
      lastModified: Date.now(),
      v1_original: { versionNumber: 1, ...res.clean }, 
      v2_ai_corrected: { versionNumber: 2, ...res.clean },
      auditLogs: res.auditLogs,
      redlineHtml: res.redlines
    }));

    const newPaper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: paperQuestions[0]?.topic || 'New Submission',
      subject: 'Examination',
      createdBy: currentUser.id,
      creatorName: currentUser.name,
      status: 'PENDING_QC',
      questions: paperQuestions,
      createdAt: Date.now()
    };
    
    await dbService.savePaper(newPaper);
    setHistory(prev => [newPaper, ...prev]);
    setActivePaperId(newPaper.id);
    setActiveTab('review');
    setIsSyncing(false);
  }, [currentUser]);

  const handleQuestionAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (!currentPaper || !activePaperId) return;
    
    const updatedQuestions = questions.map(q => {
      if (q.id === id) {
        const newStatus = action === 'APPROVE' ? QuestionStatus.APPROVED : QuestionStatus.REJECTED;
        return {
          ...q,
          status: newStatus,
          isLocked: action === 'APPROVE',
          v3_final_approved: action === 'APPROVE' ? q.v2_ai_corrected : undefined,
          lastModified: Date.now()
        };
      }
      return q;
    });

    setIsSyncing(true);
    const updatedPaper = { ...currentPaper, questions: updatedQuestions };
    
    const allApproved = updatedQuestions.every(q => q.status === QuestionStatus.APPROVED);
    if (allApproved) updatedPaper.status = 'APPROVED_LOCKED';

    await dbService.savePaper(updatedPaper);
    setHistory(prev => prev.map(p => p.id === activePaperId ? updatedPaper : p));
    setIsSyncing(false);
  };

  const generateCleanContent = () => {
    if (!currentPaper) return "";
    return questions.map((q, i) => {
      const clean = q.v2_ai_corrected;
      if (!clean) return '';
      let text = `${i + 1}. ${clean.question}\n`;
      if (clean.options && clean.options.length > 0) {
        clean.options.forEach((opt, idx) => {
          text += `   ${String.fromCharCode(65 + idx)}) ${opt}\n`;
        });
      }
      const ansIdx = clean.correctOptionIndex;
      text += `Ans: ${ansIdx !== undefined ? String.fromCharCode(65 + ansIdx) : (clean.correctAnswer || 'N/A')}\n`;
      text += `Sol: ${clean.solution}\n\n`;
      return text;
    }).join('\n');
  };

  const handleExport = (type: 'CLEAN' | 'AUDIT', format: 'PDF' | 'WORD') => {
    if (!currentPaper) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${currentPaper.title}_${type}_${timestamp}`;

    if (type === 'CLEAN') {
      const content = generateCleanContent();
      if (format === 'WORD') {
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.doc`;
        a.click();
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<html><head><title>${fileName}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6;white-space:pre-wrap;}</style></head><body><h1>${currentPaper.title} (Verified Clean)</h1><hr/>${content}</body></html>`);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } else {
      if (format === 'WORD') {
        let html = `<html><head><style>del{color:red;text-decoration:line-through;background:#fee2e2;} ins{color:green;font-weight:bold;background:#dcfce7;} h3{margin-top:20px; border-top: 1px solid #ccc; padding-top: 10px;}</style></head><body><h1>Audit Report - ${currentPaper.title}</h1>`;
        questions.forEach((q, i) => {
          html += `<h3>Question ${i+1}</h3>`;
          html += `<div>${q.redlineHtml.question}</div>`;
          if (q.redlineHtml.options) {
             html += `<ul style="list-style:none; padding-left: 20px;">`;
             q.redlineHtml.options.forEach((opt, idx) => {
               html += `<li style="margin: 5px 0;">${String.fromCharCode(65+idx)}) ${opt}</li>`;
             });
             html += `</ul>`;
          }
          html += `<p><strong>Solution Audit:</strong> ${q.redlineHtml.solution}</p>`;
          if (q.auditLogs.length > 0) {
            html += `<div style="margin-top:10px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0;"><strong>Audit Interventions:</strong><ul>`;
            q.auditLogs.forEach(log => html += `<li>[${log.severity}] ${log.type}: ${log.message}</li>`);
            html += `</ul></div>`;
          }
        });
        html += `</body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.doc`;
        a.click();
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          let html = `<html><head><title>${fileName}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6;} del{background:#fee2e2;text-decoration:line-through;padding:0 2px;} ins{background:#dcfce7;font-weight:bold;padding:0 2px;} .q-block{margin-bottom:30px; border-bottom:1px solid #eee; padding-bottom:20px;} .logs{background:#f8fafc; padding:10px; font-size:12px; border-radius:8px; margin-top:10px;}</style></head><body><h1>Audit Redlines - ${currentPaper.title}</h1>`;
          questions.forEach((q, i) => {
            html += `<div class="q-block"><h3>Q${i+1}</h3>`;
            html += `<div>${q.redlineHtml.question}</div>`;
            if (q.redlineHtml.options) {
               html += `<div style="margin:10px 0;">`;
               q.redlineHtml.options.forEach((opt, idx) => {
                 html += `<div style="margin-bottom:5px;">${String.fromCharCode(65+idx)}) ${opt}</div>`;
               });
               html += `</div>`;
            }
            html += `<div><strong>Solution Audit:</strong> ${q.redlineHtml.solution}</div>`;
            if (q.auditLogs.length > 0) {
               html += `<div class="logs"><strong>Quality Logs:</strong><ul>`;
               q.auditLogs.forEach(log => html += `<li>[${log.severity}] ${log.type}: ${log.message}</li>`);
               html += `</ul></div>`;
            }
            html += `</div>`;
          });
          html += `</body></html>`;
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this submission record permanently?")) {
      setIsSyncing(true);
      await dbService.deletePaper(id);
      setHistory(prev => prev.filter(p => p.id !== id));
      if (activePaperId === id) setActivePaperId(null);
      setIsSyncing(false);
    }
  };

  const allLogs: AuditLog[] = history.flatMap(p => p.questions.flatMap(q => q.auditLogs));

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Academic Cloud...</p>
    </div>
  );

  if (!currentUser) return <LoginScreen users={MOCK_USERS} onLogin={handleLogin} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;

  return (
    <Layout 
      currentUser={currentUser} users={MOCK_USERS} activeTab={activeTab} setActiveTab={setActiveTab}
      history={history} onLoadHistory={(p) => setActivePaperId(p.id)} activePaperId={activePaperId} 
      onDeleteHistory={handleDeleteHistory} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      isSyncing={isSyncing} onLogout={handleLogout} onUserSwitch={handleLogin}
    >
      {activeTab === 'input' && <QuestionInput onAdd={() => {}} onAddBulk={createPaperFromAudit} />}
      
      {activeTab === 'review' && (
        <div className="space-y-6">
          <header className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{currentPaper?.title || 'Draft Library'}</h1>
                <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest mt-1">
                  Owner: {currentPaper?.creatorName} • Status: {currentPaper?.status.replace('_', ' ')}
                </p>
              </div>
              
              {currentPaper && (
                <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                   <div className="mr-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Export Paper</p>
                     <div className="flex gap-2">
                        <button onClick={() => handleExport('CLEAN', 'PDF')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Final (PDF)</button>
                        <button onClick={() => handleExport('CLEAN', 'WORD')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Final (Word)</button>
                     </div>
                   </div>
                   <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Export Audit</p>
                     <div className="flex gap-2">
                        <button onClick={() => handleExport('AUDIT', 'PDF')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase rounded-lg hover:bg-rose-600 hover:text-white transition-all">Audit (PDF)</button>
                        <button onClick={() => handleExport('AUDIT', 'WORD')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase rounded-lg hover:bg-rose-600 hover:text-white transition-all">Audit (Word)</button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </header>

          {questions.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No questions loaded in workspace</p>
               <button onClick={() => setActiveTab('input')} className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Go to Intake Workspace →</button>
            </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard key={q.id} index={idx + 1} data={q} isAuditing={false} />
            ))
          )}
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="space-y-6">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Academic QC Queue</h1>
            <p className="text-slate-500 font-medium">Evaluate Audit results and perform final Locking.</p>
          </header>
          {questions.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Queue is currently clear</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard 
                key={q.id} index={idx + 1} data={q} 
                onApprove={() => handleQuestionAction(q.id, 'APPROVE')} 
                onReject={() => handleQuestionAction(q.id, 'REJECT')} 
                isAuditing={false} showQCControls={currentUser.role === UserRole.QC_HEAD}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && <AnalyticsDashboard logs={allLogs} />}
    </Layout>
  );
};

export default App;
