
import React, { useState, useEffect } from 'react';
import { UserRole, Paper } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  history: Paper[];
  onLoadHistory: (paper: Paper) => void;
  onDeleteHistory: (e: React.MouseEvent, id: string) => void;
  activePaperId: string | null;
  createNewPaper: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRole, 
  onRoleSwitch, 
  activeTab, 
  setActiveTab,
  history,
  onLoadHistory,
  onDeleteHistory,
  activePaperId,
  createNewPaper,
  isDarkMode,
  toggleDarkMode
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    closeDrawer();
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-30 lg:hidden transition-all duration-500 ${isDrawerOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none backdrop-blur-none'}`}
        onClick={closeDrawer}
      />

      <aside 
        className={`
          fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-40 shadow-2xl transition-all duration-500
          ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static
        `}
      >
        <div className="p-6 border-b border-slate-800 dark:border-slate-700 flex items-center justify-between">
          <div onClick={() => handleTabClick(activeRole === UserRole.TEACHER ? 'input' : 'approval')} className="cursor-pointer group">
            <h1 className="text-xl font-bold flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
              <span className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">🔍</span> Paper Checker
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black opacity-80">Academic Verification</p>
          </div>
          <button onClick={toggleDarkMode} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all active:scale-90">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <nav className="flex-1 p-5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-4 mb-3 mt-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {activeRole === UserRole.TEACHER ? 'Teacher Menu' : 'QC Lead Menu'}
            </p>
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeRole === UserRole.TEACHER ? 'bg-indigo-500' : 'bg-rose-500'}`} />
          </div>

          {activeRole === UserRole.TEACHER ? (
            <>
              <button 
                onClick={() => handleTabClick('input')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Paper Input
              </button>
              <button 
                onClick={() => handleTabClick('review')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'review' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Audit Review
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleTabClick('approval')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'approval' ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                QC Approvals
              </button>
              <button 
                onClick={() => handleTabClick('analytics')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analytics
              </button>
            </>
          )}

          <div className="pt-10 pb-4">
            <div className="px-4 flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Archive</p>
              <span className="text-[9px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full font-black border border-slate-700">HIST</span>
            </div>
            
            <div className="space-y-3 px-1">
              {history.length === 0 ? (
                <div className="px-4 py-5 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                   <p className="text-[10px] text-slate-600 font-bold uppercase text-center leading-tight">No archived<br/>sessions</p>
                </div>
              ) : (
                history.map((paper) => (
                  <div key={paper.id} className="relative group">
                    <button
                      onClick={() => onLoadHistory(paper)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 active:scale-95 ${activePaperId === paper.id ? 'bg-slate-800 border-indigo-600 shadow-xl ring-1 ring-indigo-500/50' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}`}
                    >
                      <div className={`text-xs font-bold truncate ${activePaperId === paper.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {paper.title}
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${activePaperId === paper.id ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {paper.questions.length} Qs
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {formatTime(paper.createdAt)}
                        </span>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => onDeleteHistory(e, paper.id)}
                      className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete archive entry"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={() => onRoleSwitch(activeRole === UserRole.TEACHER ? UserRole.QC_HEAD : UserRole.TEACHER)}
            className={`w-full text-[10px] text-white font-black uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${activeRole === UserRole.TEACHER ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            {activeRole === UserRole.TEACHER ? 'Switch to QC Mode' : 'Switch to Teacher Mode'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
          <button onClick={toggleDrawer} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded shadow-sm">🔍</span>
            <span className="font-black text-slate-900 dark:text-slate-50 uppercase tracking-tighter">Paper Checker AI</span>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
