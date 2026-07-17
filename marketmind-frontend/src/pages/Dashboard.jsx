import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadFullReport } from '../utils/downloadUtils';
import './Dashboard.css';

const QUICK_TOOLS = [
  { icon: '🏷️', label: 'Name Generator', path: '/names', color: '#6366f1', desc: 'Brand your startup' },
  { icon: '💰', label: 'Funding Finder', path: '/funding', color: '#10b981', desc: 'Find investors' },
  { icon: '📊', label: 'Revenue Calc', path: '/revenue', color: '#f59e0b', desc: 'Project finances' },
  { icon: '📣', label: 'Marketing', path: '/marketing', color: '#ef4444', desc: 'Grow your brand' },
  { icon: '⚖️', label: 'Legal Check', path: '/legal', color: '#3b82f6', desc: 'Stay compliant' },
  { icon: '🛠️', label: 'SWOT & BMC', path: '/toolkit', color: '#8b5cf6', desc: 'Strategy tools' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchIdeas(); }, []);

  const fetchIdeas = async () => {
    try { const r = await api.get('/ideas'); setIdeas(r.data.ideas || []); }
    catch { toast.error('Failed to load ideas'); }
    finally { setLoading(false); }
  };

  const deleteIdea = async (id) => {
    if (!confirm('Delete this idea?')) return;
    setDeleting(id);
    try { await api.delete(`/ideas/${id}`); setIdeas(p => p.filter(i => i._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const downloadReport = async (idea) => {
    if (!idea.analysis?.viabilityScore) return toast.error('Run analysis first');
    toast.loading('Generating PDF...', { id: 'dl' });
    try { await downloadFullReport(idea, idea.analysis, null, null); toast.success('Downloaded!', { id: 'dl' }); }
    catch { toast.error('Download failed', { id: 'dl' }); }
  };

  const vColor = s => s >= 70 ? '#10b981' : s >= 45 ? '#f59e0b' : '#ef4444';
  const analyzedIdeas = ideas.filter(i => i.analysis?.viabilityScore);
  const avgScore = analyzedIdeas.length
    ? Math.round(analyzedIdeas.reduce((s, i) => s + (i.analysis?.viabilityScore || 0), 0) / analyzedIdeas.length) : 0;
  const firstName = user?.name?.split(' ')[0] || 'Entrepreneur';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard">
      {/* Hero greeting */}
      <motion.div className="dash-hero" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-text">
          <h1>{greeting}, {firstName} 👋</h1>
          <p>Your startup intelligence platform. Build, analyze, and launch with confidence.</p>
        </div>
        <Link to="/ideas/new" className="hero-cta">
          <span>+</span> Analyze New Idea
        </Link>
      </motion.div>

      {/* Stats row */}
      <div className="dash-stats">
        {[
          { label: 'Total Ideas', val: ideas.length, icon: '💡', color: '#6366f1' },
          { label: 'Analyzed', val: analyzedIdeas.length, icon: '📊', color: '#10b981' },
          { label: 'Avg Viability', val: avgScore ? `${avgScore}/100` : '—', icon: '🎯', color: '#f59e0b' },
          { label: 'AI Tools', val: 6, icon: '🤖', color: '#8b5cf6' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dash-body">
        {/* Ideas section */}
        <div className="dash-ideas-section">
          <div className="section-header">
            <h2>Your Ideas</h2>
            <Link to="/ideas/new" className="sec-btn">+ New Idea</Link>
          </div>

          {loading ? (
            <div className="ideas-grid">
              {[1,2,3].map(i => <div key={i} className="idea-card-skeleton skeleton" />)}
            </div>
          ) : ideas.length === 0 ? (
            <div className="empty-ideas">
              <div className="empty-icon">💡</div>
              <h3>No ideas yet</h3>
              <p>Start by analyzing your first business idea.</p>
              <Link to="/ideas/new" className="empty-cta">Analyze My First Idea →</Link>
            </div>
          ) : (
            <div className="ideas-grid">
              <AnimatePresence>
                {ideas.map((idea, i) => (
                  <motion.div key={idea._id} className="idea-card"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                    layout>
                    {/* Card top */}
                    <div className="ic-top-row">
                      <span className="ic-industry">{idea.industry?.split('&')[0]?.trim()}</span>
                      {idea.analysis?.viabilityScore && (
                        <span className="ic-score" style={{ color: vColor(idea.analysis.viabilityScore), borderColor: vColor(idea.analysis.viabilityScore) + '40' }}>
                          {idea.analysis.viabilityScore}/100
                        </span>
                      )}
                    </div>

                    {/* Title & meta */}
                    <h3 className="ic-title">{idea.title || idea.product}</h3>
                    <div className="ic-meta-row">
                      <span>📍 {idea.targetCity}</span>
                      <span>👥 {idea.targetCustomers?.slice(0, 28)}{(idea.targetCustomers?.length || 0) > 28 ? '...' : ''}</span>
                    </div>

                    {/* Score bars */}
                    {idea.analysis?.demandScore && (
                      <div className="ic-bars">
                        {[
                          { l: 'Demand', v: idea.analysis.demandScore, c: '#10b981' },
                          { l: 'Viability', v: idea.analysis.viabilityScore, c: '#6366f1' },
                          { l: 'Openness', v: Math.max(0, 100 - idea.analysis.competitionScore), c: '#f59e0b' },
                        ].map(b => (
                          <div key={b.l} className="ic-bar-row">
                            <span className="ic-bar-lbl">{b.l}</span>
                            <div className="ic-bar-track">
                              <motion.div className="ic-bar-fill"
                                initial={{ width: 0 }} animate={{ width: `${b.v}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                                style={{ background: b.c }} />
                            </div>
                            <span className="ic-bar-val" style={{ color: b.c }}>{b.v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="ic-actions">
                      <Link to={`/ideas/${idea._id}/analysis`} className="ica-btn primary">
                        {idea.analysis?.viabilityScore ? '📊 Analysis' : '⚡ Analyze'}
                      </Link>
                      <Link to={`/ideas/${idea._id}/competitors`} className="ica-btn">🗺️</Link>
                      <Link to={`/ideas/${idea._id}/pitch`} className="ica-btn">🚀</Link>
                      {idea.analysis?.viabilityScore && (
                        <button className="ica-btn green" onClick={() => downloadReport(idea)} title="Download PDF">⬇️</button>
                      )}
                      <button className="ica-btn danger" onClick={() => deleteIdea(idea._id)}
                        disabled={deleting === idea._id} title="Delete">
                        {deleting === idea._id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Quick tools */}
        <div className="dash-tools-section">
          <div className="section-header"><h2>Quick Tools</h2></div>
          <div className="tools-grid">
            {QUICK_TOOLS.map((t, i) => (
              <motion.div key={t.path} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <Link to={t.path} className="tool-link-card">
                  <div className="tlc-icon" style={{ background: t.color + '20', color: t.color }}>{t.icon}</div>
                  <div>
                    <div className="tlc-label">{t.label}</div>
                    <div className="tlc-desc">{t.desc}</div>
                  </div>
                  <span className="tlc-arrow">›</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent activity */}
          {analyzedIdeas.length > 0 && (
            <div className="recent-section">
              <div className="section-header" style={{ marginTop: 24 }}><h2>Top Performing Ideas</h2></div>
              {analyzedIdeas.sort((a, b) => (b.analysis?.viabilityScore || 0) - (a.analysis?.viabilityScore || 0)).slice(0, 3).map((idea, i) => (
                <Link key={idea._id} to={`/ideas/${idea._id}/analysis`} className="recent-item">
                  <div className="ri-rank" style={{ background: [' linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#94a3b8,#64748b)', 'linear-gradient(135deg,#cd7f32,#a0522d)'][i] }}>
                    {i + 1}
                  </div>
                  <div className="ri-info">
                    <div className="ri-name">{idea.title || idea.product}</div>
                    <div className="ri-city">{idea.targetCity}</div>
                  </div>
                  <div className="ri-score" style={{ color: vColor(idea.analysis.viabilityScore) }}>
                    {idea.analysis.viabilityScore}/100
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
