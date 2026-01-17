
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRole, onRoleSwitch, activeTab, setActiveTab }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    closeDrawer();
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
          <button onClick={closeDrawer} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {activeRole === UserRole.TEACHER ? (
            <>
              <button 
                onClick={() => handleTabClick('input')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'input' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                📝 Paper Input
              </button>
              <button 
                onClick={() => handleTabClick('review')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'review' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                🔍 Audit Review
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleTabClick('analytics')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'analytics' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                📊 Error Analytics
              </button>
              <button 
                onClick={() => handleTabClick('approval')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'approval' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                ✅ QC Approvals
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">Active Session</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-100">{activeRole === UserRole.TEACHER ? 'Faculty Member' : 'QC Lead'}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              onRoleSwitch(activeRole === UserRole.TEACHER ? UserRole.QC_HEAD : UserRole.TEACHER);
              closeDrawer();
            }}
            className="mt-4 w-full text-xs text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider transition bg-indigo-400/10 py-2 rounded-lg"
          >
            Switch to {activeRole === UserRole.TEACHER ? 'QC Role' : 'Teacher Role'}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={toggleDrawer} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs p-1 rounded font-bold">🛡️</span>
            <span className="font-black text-slate-900 uppercase tracking-tighter">AuditPro</span>
          </div>
          <div className="w-10"></div> {/* Spacer for symmetry */}
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
