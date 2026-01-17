
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRole, onRoleSwitch, activeTab, setActiveTab }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-indigo-600 p-1 rounded">🛡️</span> AuditPro
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Academic Safety System</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {activeRole === UserRole.TEACHER ? (
            <>
              <button 
                onClick={() => setActiveTab('input')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'input' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                📝 Paper Input
              </button>
              <button 
                onClick={() => setActiveTab('review')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'review' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                🔍 Audit Review
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                📊 Error Analytics
              </button>
              <button 
                onClick={() => setActiveTab('approval')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'approval' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                ✅ QC Approvals
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-2 font-medium">Active Session</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">{activeRole === UserRole.TEACHER ? 'Faculty Member' : 'QC Lead'}</span>
            </div>
          </div>
          <button 
            onClick={() => onRoleSwitch(activeRole === UserRole.TEACHER ? UserRole.QC_HEAD : UserRole.TEACHER)}
            className="mt-4 w-full text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            Switch to {activeRole === UserRole.TEACHER ? 'QC Role' : 'Teacher Role'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
