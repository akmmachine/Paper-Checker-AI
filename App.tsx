
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import QuestionInput from './components/QuestionInput';
import QuestionCard from './components/QuestionCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { UserRole, QuestionData, Paper, QuestionStatus, AuditLog } from './types';
import { auditQuestion } from './services/geminiService';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.TEACHER);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);

  // Sync tab on role switch
  useEffect(() => {
    if (activeRole === UserRole.TEACHER) {
      setActiveTab('input');
    } else {
      setActiveTab('analytics');
    }
  }, [activeRole]);

  const handleAddQuestion = (q: QuestionData) => {
    setQuestions(prev => [q, ...prev]);
    setActiveTab('review');
  };

  const handleAddBulk = (qs: QuestionData[]) => {
    setQuestions(prev => [...qs, ...prev]);
    setActiveTab('review');
    alert(`Successfully ingested and audited ${qs.length} questions from the document.`);
  };

  const handleAuditRequest = async (id: string) => {
    const q = questions.find(item => item.id === id);
    if (!q) return;

    setIsAuditingId(id);
    try {
      const result = await auditQuestion(q.original);
      setQuestions(prev => prev.map(item => 
        item.id === id 
          ? { ...item, audit: result, version: 2 } 
          : item
      ));
    } catch (err) {
      alert("Audit failed. The AI engine is busy or the input was malformed.");
    } finally {
      setIsAuditingId(null);
    }
  };

  const handleApprove = (id: string) => {
    setQuestions(prev => prev.map(item => 
      item.id === id && item.audit
        ? { ...item, audit: { ...item.audit, status: QuestionStatus.APPROVED }, version: 3 }
        : item
    ));
    alert("Question Locked and Approved for Exam Production.");
  };

  const allLogs: AuditLog[] = questions.flatMap(q => q.audit?.logs || []);

  const renderContent = () => {
    switch (activeTab) {
      case 'input':
        return <QuestionInput onAdd={handleAddQuestion} onAddBulk={handleAddBulk} />;
      
      case 'review':
        return (
          <div className="space-y-6">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">Audit Pipeline</h1>
              <p className="text-slate-500 font-medium">Review AI interventions and verify corrected logic before submission.</p>
            </header>
            {questions.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No Questions in Pipeline</p>
                <button onClick={() => setActiveTab('input')} className="mt-4 text-indigo-600 font-bold hover:underline">Go to Input</button>
              </div>
            ) : (
              questions.map(q => (
                <QuestionCard 
                  key={q.id} 
                  data={q} 
                  onAudit={handleAuditRequest} 
                  isAuditing={isAuditingId === q.id}
                />
              ))
            )}
          </div>
        );

      case 'analytics':
        return <AnalyticsDashboard logs={allLogs} />;

      case 'approval':
        const pending = questions.filter(q => q.audit && q.audit.status !== QuestionStatus.APPROVED);
        return (
          <div className="space-y-6">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">QC Command Center</h1>
              <p className="text-slate-500 font-medium">Final approval required for all AI-corrected content.</p>
            </header>
            {pending.length === 0 ? (
              <div className="bg-green-50 rounded-2xl border border-green-100 p-12 text-center">
                <p className="text-green-600 font-black uppercase tracking-widest">Queue Clear</p>
                <p className="text-green-500 text-sm mt-1">All processed questions have been approved.</p>
              </div>
            ) : (
              pending.map(q => (
                <QuestionCard 
                  key={q.id} 
                  data={q} 
                  onAudit={handleAuditRequest} 
                  onApprove={handleApprove}
                  isAuditing={isAuditingId === q.id}
                  showQCControls
                />
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout 
      activeRole={activeRole} 
      onRoleSwitch={setActiveRole}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
