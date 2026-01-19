
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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRole, 
  onRoleSwitch, 
  activeTab, 
  setActiveTab,
  history,
  onLoadHistory
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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
    const seconds = Math.floor(diff / 1000);
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const NavIcon = ({ tab }: { tab: string }) => {
    switch (tab) {
      case 'input':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'approval':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-300">
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-30 lg:hidden transition-all duration-500 ${isDrawerOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none backdrop-blur-none'}`}
        onClick={closeDrawer}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      />

      {/* Sidebar / Drawer */}
      <aside 
        className={`
          fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-40 shadow-2xl transition-all duration-500
          ${isDrawerOpen ? 'translate-x-0 translate-z-0' : '-translate-x-full translate-z-0'}
          lg:translate-x-0 lg:static lg:block
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-600/20">🔍</span> Paper Checker AI
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black opacity-80">Academic Verification Engine</p>
          </div>
          <button onClick={closeDrawer} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-5 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-4">Main Menu</p>
          {activeRole === UserRole.TEACHER ? (
            <>
              <button 
                onClick={() => handleTabClick('input')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <NavIcon tab="input" />
                Paper Input
              </button>
              <button 
                onClick={() => handleTabClick('review')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'review' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <NavIcon tab="review" />
                Audit Review
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleTabClick('analytics')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <NavIcon tab="analytics" />
                Error Analytics
              </button>
              <button 
                onClick={() => handleTabClick('approval')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'approval' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <NavIcon tab="approval" />
                QC Approvals
              </button>
            </>
          )}

          <div className="pt-8 pb-4">
            <div className="px-4 flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Archive</p>
              {history.length > 0 && <span className="text-[9px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full font-black border border-slate-700">HIST</span>}
            </div>
            
            <div className="space-y-3 px-1">
              {history.length === 0 ? (
                <div className="px-4 py-5 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-[10px] text-slate-600 font-bold uppercase text-center leading-tight">No archived<br/>sessions</p>
                </div>
              ) : (
                history.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => {
                      onLoadHistory(paper);
                      closeDrawer();
                    }}
                    className="w-full text-left p-4 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 hover:bg-slate-800/40 group transition-all duration-300 active:scale-95"
                  >
                    <div className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                      {paper.title}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex items-center gap-1 bg-slate-800 group-hover:bg-slate-700 px-2 py-0.5 rounded-full text-[9px] font-black text-slate-400 group-hover:text-slate-200 transition-colors border border-slate-700">
                        {paper.questions?.length || 0} Qs
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(paper.createdAt)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
            <p className="text-[9px] text-slate-500 mb-2.5 font-black uppercase tracking-widest">Active Identity</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-600/20">
                  {activeRole === UserRole.TEACHER ? 'FT' : 'QC'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-800 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-100">{activeRole === UserRole.TEACHER ? 'Faculty User' : 'QC Supervisor'}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Standard Project</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              onRoleSwitch(activeRole === UserRole.TEACHER ? UserRole.QC_HEAD : UserRole.TEACHER);
              closeDrawer();
            }}
            className="mt-4 w-full text-[10px] text-white font-black uppercase tracking-widest transition bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Switch Perspective
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <button 
            onClick={toggleDrawer} 
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors active:bg-slate-200"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-600/20">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <span className="font-black text-slate-900 uppercase tracking-tighter text-base">Paper Checker AI</span>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="max-w-6xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
