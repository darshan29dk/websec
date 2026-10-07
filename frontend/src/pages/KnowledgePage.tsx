import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Hash,
  ExternalLink,
  Shield,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { knowledgeApi } from '../services/api/knowledgeApi';
import { KnowledgeDocument, KnowledgeSearchResult, KnowledgeIngestRequest } from '../types/knowledge';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ingestion Modal State (ADMIN)
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('OWASP');
  const [sourceUrl, setSourceUrl] = useState('');
  const [documentType, setDocumentType] = useState('SECURITY_STANDARD');
  const [version, setVersion] = useState('1.0');
  const [content, setContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await knowledgeApi.getAllDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch knowledge base documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await knowledgeApi.searchKnowledge(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      alert('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setIngesting(true);
      const req: KnowledgeIngestRequest = {
        title,
        source,
        sourceUrl,
        documentType,
        version,
        content
      };
      await knowledgeApi.ingestDocument(req);
      setShowIngestModal(false);
      setTitle('');
      setContent('');
      fetchDocuments();
    } catch (err: any) {
      alert('Failed to ingest knowledge document: ' + err.message);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 text-cyan-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">SECURITY KNOWLEDGE BASE</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">RAG Vector Store</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Authoritative OWASP, CWE, CVSS, and Hardening Standards for Grounded Reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIngestModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg flex items-center gap-2 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add Knowledge Document
          </button>
        </div>
      </div>

      {/* RAG Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search security knowledge (e.g. SQL Injection, XSS, CSRF, TLS headers)..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-lg shadow flex items-center justify-center gap-2 transition"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search RAG Base
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" /> RAG Search Results ({searchResults.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((res, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400">{res.source}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {Math.round(res.relevanceScore * 100)}% match
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{res.title}</h3>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed font-mono">
                  "{res.contentExcerpt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" /> Ingested Knowledge Documents ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading security knowledge documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{doc.source}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {doc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-2">{doc.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                    {doc.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Chunks: {doc.chunkCount}</span>
                  {doc.sourceUrl && (
                    <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No knowledge documents ingested yet.</p>
          </div>
        )}
      </div>

      {/* ADMIN Ingestion Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Ingest Authoritative Security Knowledge
              </h3>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. OWASP Top 10 A03:2021 - Injection"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Source Organization *</label>
                  <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="OWASP">OWASP Foundation</option>
                    <option value="CWE / MITRE">CWE / MITRE</option>
                    <option value="CVE / NVD">CVE / NVD</option>
                    <option value="CISA">CISA Guidance</option>
                    <option value="TLS / Security Headers">TLS / Security Headers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Document Type *</label>
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECURITY_STANDARD">Security Standard</option>
                    <option value="VULNERABILITY_GUIDANCE">Vulnerability Guidance</option>
                    <option value="HARDENING_GUIDANCE">Hardening Guidance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Source URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://owasp.org/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Content Text *</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste the authoritative security standard guidance text here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow flex items-center gap-2"
                >
                  {ingesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ingest Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
