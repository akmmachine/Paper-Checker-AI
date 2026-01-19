
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuditLog } from '../types';

interface AnalyticsDashboardProps {
  logs: AuditLog[];
}

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

// FilterBadge component for category filtering.
// Defined outside the main component to prevent unnecessary re-mounts and fix TypeScript 'key' prop error.
const FilterBadge: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
  >
    {label}
  </button>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ logs }) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Aggregate data for charts
  const typeCount = logs.reduce((acc: any, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(typeCount).map(key => ({
    name: key,
    value: typeCount[key]
  }));

  const severityCount = logs.reduce((acc: any, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(severityCount).map(key => ({
    name: key,
    value: severityCount[key]
  }));

  // Filtering logic for the table
  const filteredLogs = logs.filter(log => {
    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesType && matchesSeverity;
  });

  const isFiltered = typeFilter !== 'ALL' || severityFilter !== 'ALL';

  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setSeverityFilter('ALL');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paper Checker AI Analytics</h1>
        <p className="text-slate-500 font-medium">Tracking error patterns and quality trends across all verified sessions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-8 tracking-widest">Error Types Distribution</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fontWeight: 700 }} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 600 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-8 tracking-widest">Severity Overview</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.921l-1.157 2.016a1 1 0 01-.157.218l-1.782 1.782a1 1 0 01-.707.293H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H9.414l1.293-1.293a1 1 0 011.688.84z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="text-6xl font-black text-indigo-400 tracking-tighter">{logs.length}</div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-4">Verification Events</p>
            <div className="mt-10 space-y-3">
               <div className="bg-slate-800/80 backdrop-blur px-5 py-4 rounded-2xl flex justify-between items-center border border-slate-700/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Failures</span>
                  <span className="text-base font-black text-red-400">{severityCount['HIGH'] || 0}</span>
               </div>
               <div className="bg-slate-800/80 backdrop-blur px-5 py-4 rounded-2xl flex justify-between items-center border border-slate-700/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Logic Flaws</span>
                  <span className="text-base font-black text-indigo-400">{typeCount['CONCEPTUAL'] || 0}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="shrink-0">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Raw Verification Feed</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Live stream of AI interventions across all papers.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Filter by Type</p>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'CONCEPTUAL', 'NUMERICAL', 'LOGICAL', 'GRAMMATICAL'].map(t => (
                  <FilterBadge key={t} label={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} />
                ))}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block mx-1" />
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Filter Severity</p>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                  <FilterBadge key={s} label={s} active={severityFilter === s} onClick={() => setSeverityFilter(s)} />
                ))}
              </div>
            </div>
            
            {isFiltered && (
              <div className="sm:ml-4 sm:pt-4">
                <button 
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-100 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditor's Note</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Integrity Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-600 border border-slate-200 uppercase tracking-tighter">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed max-w-lg">{log.message}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                        log.severity === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 
                        log.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                        Inspect Logic
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase">No Matching Records</h4>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters to see more results.</p>
              <button 
                onClick={handleResetFilters}
                className="mt-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
