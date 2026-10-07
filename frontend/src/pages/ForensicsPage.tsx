import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forensicApi } from '../services/api/forensicApi';
import { ForensicCase, CaseStatus } from '../types/forensic';
import { FolderGit2, Search, Filter, ShieldAlert, Plus, CheckCircle, Clock } from 'lucide-react';

export const ForensicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    loadCases();
  }, [page, statusFilter]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await forensicApi.getCases({
        status: statusFilter || undefined,
        page,
        size: 15
      });
      if (res.success && res.data) {
        setCases(res.data.content);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to load forensic cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-700/50">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">LOW</span>;
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">OPEN</span>;
      case 'INVESTIGATING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">INVESTIGATING</span>;
      case 'EVIDENCE_COMPLETE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-700/50">EVIDENCE COMPLETE</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">CLOSED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">INCONCLUSIVE</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-7 h-7 text-cyan-400" />
            Digital Forensics Cases
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Evidence-driven reconstruction, hash integrity verification, and forensic case timelines.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="EVIDENCE_COMPLETE">Evidence Complete</option>
            <option value="CLOSED">Closed</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading forensic cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No forensic cases found. Convert an Incident or create a new case to start digital evidence collection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Case Number</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Evidence Items</th>
                  <th className="px-4 py-3">Opened At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-medium text-cyan-400">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{c.title}</td>
                    <td className="px-4 py-3 text-slate-300">{c.targetName}</td>
                    <td className="px-4 py-3">{getPriorityBadge(c.priority)}</td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-200">{c.evidenceCount}</span>
                      {c.unverifiedEvidenceCount > 0 && (
                        <span className="ml-2 text-xs text-amber-400 font-semibold">({c.unverifiedEvidenceCount} unverified)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {new Date(c.openedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/forensics/${c.id}`)}
                        className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-xs transition font-medium"
                      >
                        Investigate Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-slate-400">
          <div>Page {page + 1} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-50 text-slate-300"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-50 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
