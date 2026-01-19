
import React from 'react';
import { UserProfile, UserRole } from '../types';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin, isDarkMode, toggleDarkMode }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl text-3xl">🔍</span>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter uppercase">Paper Checker AI</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Select your identity to access the cloud workspace.</p>
          <button 
            onClick={toggleDarkMode}
            className="mt-4 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:scale-110 transition-transform"
          >
            {isDarkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="group relative bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:-translate-y-2 hover:shadow-2xl text-left"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg ${user.role === UserRole.TEACHER ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                {user.avatar}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-1">{user.name}</h3>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{user.department}</p>
              
              <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${user.role === UserRole.TEACHER ? 'border-indigo-100 text-indigo-600 bg-indigo-50' : 'border-rose-100 text-rose-600 bg-rose-50'}`}>
                  {user.role === UserRole.TEACHER ? 'Faculty Member' : 'QC Auditor'}
                </span>
              </div>

              <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-16 text-center">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Academic Integrity System v2.5</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;
