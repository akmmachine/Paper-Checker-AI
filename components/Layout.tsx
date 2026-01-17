
import React, { useState } from 'react';
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-40 shadow-2xl transition-transform duration-300 ease-in-out
        ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-indigo-600 p-1 rounded">🛡️</span> AuditPro
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Academic Safety System</p>
          </div>
          <button onClick={closeDrawer} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 mt-4">Navigation</p>
          {activeRole === UserRole.TEACHER ? (
            <>
              <button 
                onClick={() => handleTabClick('input')}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                📝 Paper Input
              </button>
              <button 
                onClick={() => handleTabClick('review')}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 ${activeTab === 'review' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                🔍 Audit Review
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleTabClick('analytics')}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                📊 Error Analytics
              </button>
              <button 
                onClick={() => handleTabClick('approval')}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 ${activeTab === 'approval' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                ✅ QC Approvals
              </button>
            </>
          )}

          <div className="pt-8 pb-4">
            <div className="px-4 flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">📜 Recent Archive</p>
              {history.length > 0 && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Last 5</span>}
            </div>
            
            <div className="space-y-2 px-2">
              {history.length === 0 ? (
                <div className="px-4 py-3 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-[10px] text-slate-600 italic leading-relaxed text-center">No audit sessions archived yet.</p>
                </div>
              ) : (
                history.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => {
                      onLoadHistory(paper);
                      closeDrawer();
                    }}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-slate-700/50 hover:bg-slate-800/50 group transition-all duration-200"
                  >
                    <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                      {paper.title}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-slate-800 group-hover:bg-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-400 group-hover:text-slate-200 transition-colors">
                        <span className="text-indigo-500 opacity-70">#</span>
                        {paper.questions?.length || 0} Questions
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">Logged In As</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-sm font-bold text-slate-100">{activeRole === UserRole.TEACHER ? 'Faculty Auditor' : 'QC Supervisor'}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              onRoleSwitch(activeRole === UserRole.TEACHER ? UserRole.QC_HEAD : UserRole.TEACHER);
              closeDrawer();
            }}
            className="mt-4 w-full text-xs text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider transition bg-indigo-400/10 py-2.5 rounded-lg border border-indigo-400/20 active:scale-95"
          >
            Switch to {activeRole === UserRole.TEACHER ? 'QC Access' : 'Teacher Access'}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={toggleDrawer} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs p-1 rounded font-bold">🛡️</span>
            <span className="font-black text-slate-900 uppercase tracking-tighter">AuditPro</span>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
