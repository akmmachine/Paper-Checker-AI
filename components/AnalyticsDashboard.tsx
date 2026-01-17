
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuditLog } from '../types';

interface AnalyticsDashboardProps {
  logs: AuditLog[];
}

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ logs }) => {
  // Aggregate data
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

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Academic Safety Audit Logs</h1>
        <p className="text-slate-500 font-medium">Tracking error patterns and quality trends across departments.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">Error Types Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">Severity Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col justify-center text-center">
          <div className="text-5xl font-black text-indigo-400">{logs.length}</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Total Intervention Points</p>
          <div className="mt-8 space-y-2">
             <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-slate-400">Critical (High)</span>
                <span className="text-sm font-bold text-red-400">{severityCount['HIGH'] || 0}</span>
             </div>
             <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-slate-400">Logical (Conceptual)</span>
                <span className="text-sm font-bold text-indigo-400">{typeCount['CONCEPTUAL'] || 0}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Raw Audit Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Type</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Message</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Severity</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200">{log.type}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{log.message}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${log.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 font-bold text-[10px] hover:underline">VIEW Q</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
