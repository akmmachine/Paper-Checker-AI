
import React, { useState, useEffect } from 'react';
import { UserRole, Paper, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: UserProfile;
  onUserSwitch: (user: UserProfile) => void;
  users: UserProfile[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  history: Paper[];
  onLoadHistory: (paper: Paper) => void;
  onDeleteHistory: (e: React.MouseEvent, id: string) => void;
  activePaperId: string | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSyncing: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser,
  onUserSwitch,
  users,
  activeTab, 
  setActiveTab,
  history,
  onLoadHistory,
  onDeleteHistory,
  activePaperId,
  isDarkMode,
  toggleDarkMode,
  isSyncing,
  onLogout
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getStatusBadge = (status: Paper['status']) => {
    switch(status) {
      case 'PENDING_QC': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-30 lg:hidden transition-all duration-500 ${isDrawerOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none backdrop-blur-none'}`}
        onClick={closeDrawer}
      />

      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-40 shadow-2xl transition-all duration-500 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-indigo-600 p-1.5 rounded-lg">🔍</span> Paper Cloud
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-indigo-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-black">
                {isSyncing ? 'Syncing...' : 'Connected'}
              </span>
            </div>
          </div>
          <button onClick={toggleDarkMode} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <nav className="flex-1 p-5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 mt-2">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</p>
          </div>

          {currentUser.role === UserRole.TEACHER ? (
            <>
              <button onClick={() => {setActiveTab('input'); closeDrawer();}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                New Submission
              </button>
              <button onClick={() => {setActiveTab('review'); closeDrawer();}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${activeTab === 'review' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                My Drafts
              </button>
            </>
          ) : (
            <>
              <button onClick={() => {setActiveTab('approval'); closeDrawer();}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${activeTab === 'approval' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                QC Approval Queue
              </button>
              <button onClick={() => {setActiveTab('analytics'); closeDrawer();}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${activeTab === 'analytics' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Audit Dashboard
              </button>
            </>
          )}

          <div className="pt-8 pb-4">
            <div className="px-4 flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shared Library</p>
            </div>
            
            <div className="space-y-2 px-1">
              {history.length === 0 ? (
                <p className="px-4 py-5 text-[10px] text-slate-600 font-bold uppercase text-center border border-dashed border-slate-800 rounded-xl leading-tight">Workspace is empty</p>
              ) : (
                history.map((paper) => (
                  <div key={paper.id} className="relative group">
                    <button
                      onClick={() => onLoadHistory(paper)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-95 ${activePaperId === paper.id ? 'bg-slate-800 border-indigo-600 ring-1 ring-indigo-500/50' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800'}`}
                    >
                      <div className={`text-[11px] font-bold truncate ${activePaperId === paper.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {paper.title}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black border uppercase ${getStatusBadge(paper.status)}`}>
                          {paper.status.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold">
                          {paper.creatorName.split(' ')[1]} • {formatTime(paper.createdAt)}
                        </span>
                      </div>
                    </button>
                    <button onClick={(e) => onDeleteHistory(e, paper.id)} className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-700/50"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xs">
              {currentUser.avatar}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold truncate">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{currentUser.department}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <p className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Account Settings</p>
              <div className="p-1">
                {users.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => { onUserSwitch(u); setShowProfileMenu(false); }}
                    className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-700 transition flex items-center justify-between rounded-lg ${currentUser.id === u.id ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    {u.name}
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${u.role === UserRole.TEACHER ? 'border-indigo-500 text-indigo-400' : 'border-rose-500 text-rose-400'}`}>
                      {u.role === UserRole.TEACHER ? 'T' : 'QC'}
                    </span>
                  </button>
                ))}
                <div className="h-px bg-slate-700 my-1 mx-2" />
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-900/20 transition flex items-center gap-2 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
          <button onClick={toggleDrawer} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded shadow-sm">🔍</span>
            <span className="font-black text-slate-900 dark:text-slate-50 uppercase tracking-tighter">Paper Cloud</span>
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
