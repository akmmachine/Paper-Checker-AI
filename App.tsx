
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import QuestionInput from './components/QuestionInput';
import QuestionCard from './components/QuestionCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginScreen from './components/LoginScreen';
import { UserRole, QuestionData, Paper, QuestionStatus, AuditLog, UserProfile } from './types';
import { auditQuestion } from './services/geminiService';
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
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
      if (savedMode !== null) return JSON.parse(savedMode);
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Initial Data Load
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

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Sync user profile and adjust initial tab
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER_ID, currentUser.id);
      if (currentUser.role === UserRole.QC_HEAD) {
        setActiveTab('approval');
      } else {
        setActiveTab('input');
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_ID);
    }
  }, [currentUser]);

  const currentPaper = useMemo(() => {
    return history.find(p => p.id === activePaperId) || null;
  }, [history, activePaperId]);

  const questions = useMemo(() => currentPaper?.questions || [], [currentPaper]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePaperId(null);
  };

  const createPaperFromQuestions = useCallback(async (qs: QuestionData[]) => {
    if (!currentUser) return;
    setIsSyncing(true);
    const paperName = qs[0]?.topic || 'New Submission';
    const newPaper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: paperName,
      subject: paperName,
      createdBy: currentUser.id,
      creatorName: currentUser.name,
      status: 'PENDING_QC',
      questions: qs,
      createdAt: Date.now()
    };
    
    await dbService.savePaper(newPaper);
    setHistory(prev => [newPaper, ...prev]);
    setActivePaperId(newPaper.id);
    setActiveTab('review');
    setIsSyncing(false);
  }, [currentUser]);

  const updateCurrentPaperQuestions = useCallback(async (newQuestions: QuestionData[]) => {
    if (!activePaperId || !currentPaper) return;
    setIsSyncing(true);
    const updatedPaper = { ...currentPaper, questions: newQuestions };
    await dbService.savePaper(updatedPaper);
    setHistory(prev => prev.map(p => p.id === activePaperId ? updatedPaper : p));
    setIsSyncing(false);
  }, [activePaperId, currentPaper]);

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
      await updateCurrentPaperQuestions(updatedQuestions);
    } catch (err) {
      alert("AI Audit failed.");
    } finally {
      setIsAuditingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    const updated = questions.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: item.version + 1 }
        : item
    );
    await updateCurrentPaperQuestions(updated);
  };

  const handleReject = async (id: string) => {
    const updated = questions.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.REJECTED }, version: item.version + 1 }
        : item
    );
    await updateCurrentPaperQuestions(updated);
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this submission from cloud storage?")) {
      setIsSyncing(true);
      await dbService.deletePaper(id);
      setHistory(prev => prev.filter(p => p.id !== id));
      if (activePaperId === id) setActivePaperId(null);
      setIsSyncing(false);
    }
  };

  const allLogs: AuditLog[] = history.flatMap(p => p.questions.flatMap(q => q.audit?.logs || []));

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing Cloud Workspace</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen users={MOCK_USERS} onLogin={handleLogin} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <Layout 
      currentUser={currentUser}
      onUserSwitch={handleLogin}
      users={MOCK_USERS}
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      history={history} 
      onLoadHistory={(p) => setActivePaperId(p.id)}
      activePaperId={activePaperId} 
      onDeleteHistory={handleDeleteHistory}
      isDarkMode={isDarkMode} 
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      isSyncing={isSyncing}
      onLogout={handleLogout}
    >
      {activeTab === 'input' && <QuestionInput onAdd={() => {}} onAddBulk={createPaperFromQuestions} />}
      
      {activeTab === 'review' && (
        <div className="space-y-6">
          <header className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {currentPaper ? currentPaper.title : 'My Submissions'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Drafting & self-audit workspace.</p>
          </header>
          {questions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No questions in this paper</p>
               <button onClick={() => setActiveTab('input')} className="mt-4 text-indigo-600 font-bold text-sm">Add questions now →</button>
            </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard key={q.id} index={idx + 1} data={q} onAudit={handleAuditRequest} isAuditing={isAuditingId === q.id} />
            ))
          )}
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="space-y-6">
           <header className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">QC Approval Queue</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Final verification for all shared submissions.</p>
          </header>
          {questions.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Queue is currently clear</p>
             </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard 
                key={q.id} 
                index={idx + 1} 
                data={q} 
                onAudit={handleAuditRequest} 
                onApprove={handleApprove} 
                onReject={handleReject} 
                isAuditing={isAuditingId === q.id} 
                showQCControls 
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
