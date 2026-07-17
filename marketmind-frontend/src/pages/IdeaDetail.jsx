import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadFullReport } from '../utils/downloadUtils';
import './IdeaDetail.css';

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mForm, setMForm] = useState({ title: '', dueDate: '' });
  const [showMForm, setShowMForm] = useState(false);

  useEffect(() => { fetchIdea(); }, [id]);

  const fetchIdea = async () => {
    try { const res = await api.get(`/ideas/${id}`); setIdea(res.data.idea); }
    catch { toast.error('Idea not found'); navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  const addMilestone = async () => {
    if (!mForm.title) return;
    try {
      await api.post(`/ideas/${id}/milestones`, { ...mForm, completed: false });
      toast.success('Milestone added!');
      setMForm({ title: '', dueDate: '' }); setShowMForm(false); fetchIdea();
    } catch { toast.error('Failed to add milestone'); }
  };

  const toggleMilestone = async (mid, done) => {
    try { await api.patch(`/ideas/${id}/milestones/${mid}`, { completed: !done }); fetchIdea(); }
    catch { toast.error('Failed to update'); }
  };

  const togglePublic = async () => {
    try {
      await api.put(`/ideas/${id}`, { isPublic: !idea.isPublic });
      toast.success(idea.isPublic ? 'Made private' : 'Now public!'); fetchIdea();
    } catch { toast.error('Failed to update'); }
  };

  const deleteIdea = async () => {
    if (!confirm('Delete this idea permanently?')) return;
    try { await api.delete(`/ideas/${id}`); toast.success('Deleted'); navigate('/dashboard'); }
    catch { toast.error('Delete failed'); }
  };

  const vColor = s => s >= 70 ? '#10b981' : s >= 45 ? '#f59e0b' : '#ef4444';
  const fmt = v => v >= 1000000 ? `₨${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₨${(v/1000).toFixed(0)}K` : `₨${v}`;

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}><div className="spinner"/></div>;
  if (!idea) return null;

  const a = idea.analysis;
  const completedMilestones = (idea.milestones || []).filter(m => m.completed).length;

  return (
    <div className="idea-detail">
      {/* Header */}
      <div className="id-header">
        <div>
          <div className="ap-breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span><span>{idea.title}</span>
          </div>
          <h1 className="id-title">{idea.title}</h1>
          <div className="id-meta">
            <span className="id-industry">{idea.industry}</span>
            <span>📍 {idea.targetCity}</span>
            <span>👥 {idea.targetCustomers}</span>
            <span className={`id-vis ${idea.isPublic ? 'pub' : 'priv'}`}>{idea.isPublic ? '🌐 Public' : '🔒 Private'}</span>
          </div>
        </div>
        <div className="id-actions">
          <Link to={`/ideas/${id}/analysis`} className="ida-btn primary">
            {a?.viabilityScore ? '📊 View Analysis' : '⚡ Run Analysis'}
          </Link>
          <Link to={`/ideas/${id}/competitors`} className="ida-btn">🗺️ Map</Link>
          <Link to={`/ideas/${id}/pitch`} className="ida-btn">🚀 Pitch</Link>
          {a && <button className="ida-btn green" onClick={() => downloadFullReport(idea, a, null, null)}>⬇️ PDF</button>}
          <button className="ida-btn" onClick={togglePublic}>{idea.isPublic ? '🔒 Make Private' : '🌐 Make Public'}</button>
          <button className="ida-btn danger" onClick={deleteIdea}>🗑️</button>
        </div>
      </div>

      <div className="id-body">
        <div className="id-main">
          {/* Analysis scores if available */}
          {a?.viabilityScore ? (
            <motion.div className="id-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
              <h2>📊 Analysis Summary</h2>
              <div className="id-scores">
                {[
                  {l:'Market Demand', v:a.demandScore, c:'#10b981'},
                  {l:'Viability', v:a.viabilityScore, c:'#6366f1'},
                  {l:'Market Openness', v:Math.max(0,100-a.competitionScore), c:'#f59e0b'},
                ].map(s => (
                  <div key={s.l} className="ids-item">
                    <div className="ids-ring" style={{borderColor:s.c+'30'}}>
                      <span style={{color:s.c}}>{s.v}</span>
                    </div>
                    <span className="ids-label">{s.l}</span>
                  </div>
                ))}
              </div>
              {a.overallVerdict && <div className="id-verdict">{a.overallVerdict}</div>}
              <div className="id-revenue-row">
                {[['Year 1',a.revenueProjection?.year1],['Year 2',a.revenueProjection?.year2],['Year 3',a.revenueProjection?.year3]].map(([l,v])=>(
                  <div key={l} className="idr-card">
                    <span className="idr-label">{l}</span>
                    <span className="idr-val">{fmt(v||0)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="id-card id-no-analysis">
              <div style={{fontSize:40,marginBottom:12}}>📊</div>
              <h3>No analysis yet</h3>
              <p>Run AI analysis to get market scores, financial projections, and customer insights.</p>
              <Link to={`/ideas/${id}/analysis`} className="id-run-btn">⚡ Run Full Analysis →</Link>
            </div>
          )}

          {/* Idea details */}
          <motion.div className="id-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1}}>
            <h2>💡 Idea Details</h2>
            <div className="id-details-grid">
              <div className="idg-item"><span className="idg-label">Product</span><span className="idg-val">{idea.product}</span></div>
              <div className="idg-item"><span className="idg-label">Industry</span><span className="idg-val">{idea.industry}</span></div>
              <div className="idg-item"><span className="idg-label">Target City</span><span className="idg-val">{idea.targetCity}</span></div>
              <div className="idg-item"><span className="idg-label">Country</span><span className="idg-val">{idea.targetCountry || 'Pakistan'}</span></div>
              <div className="idg-item"><span className="idg-label">Price Range</span><span className="idg-val">PKR {idea.priceMin}–{idea.priceMax}</span></div>
              <div className="idg-item"><span className="idg-label">Stage</span><span className="idg-val">{idea.stage || 'Idea'}</span></div>
              {idea.description && <div className="idg-item idg-full"><span className="idg-label">Description</span><span className="idg-val">{idea.description}</span></div>}
              {idea.targetCustomers && <div className="idg-item idg-full"><span className="idg-label">Target Customers</span><span className="idg-val">{idea.targetCustomers}</span></div>}
            </div>
          </motion.div>

          {/* Quick tools */}
          <motion.div className="id-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.15}}>
            <h2>🛠️ Tools for This Idea</h2>
            <div className="id-tools-grid">
              {[
                {icon:'🏷️',label:'Name Generator',path:'/names',color:'#6366f1'},
                {icon:'💰',label:'Funding Finder',path:'/funding',color:'#10b981'},
                {icon:'📊',label:'Revenue Calc',path:'/revenue',color:'#f59e0b'},
                {icon:'📣',label:'Marketing Plan',path:'/marketing',color:'#ef4444'},
                {icon:'⚖️',label:'Legal Check',path:'/legal',color:'#3b82f6'},
                {icon:'🛠️',label:'SWOT / BMC',path:'/toolkit',color:'#8b5cf6'},
              ].map(t=>(
                <Link key={t.path} to={t.path} className="idt-link">
                  <span style={{fontSize:20,marginBottom:4,display:'block'}}>{t.icon}</span>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{t.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Milestones sidebar */}
        <div className="id-side">
          <motion.div className="id-card" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{delay:.2}}>
            <div className="id-ms-header">
              <h2>🎯 Milestones</h2>
              <button className="id-ms-add" onClick={() => setShowMForm(s=>!s)}>+</button>
            </div>
            {(idea.milestones?.length || 0) > 0 && (
              <div className="id-ms-progress">
                <div className="id-ms-bar-bg">
                  <div className="id-ms-bar-fill" style={{width:`${(completedMilestones/(idea.milestones?.length||1))*100}%`}}/>
                </div>
                <span>{completedMilestones}/{idea.milestones?.length} done</span>
              </div>
            )}
            {showMForm && (
              <div className="id-ms-form">
                <input placeholder="Milestone title..." value={mForm.title} onChange={e=>setMForm(f=>({...f,title:e.target.value}))} className="id-ms-input"/>
                <input type="date" value={mForm.dueDate} onChange={e=>setMForm(f=>({...f,dueDate:e.target.value}))} className="id-ms-input"/>
                <div style={{display:'flex',gap:8}}>
                  <button className="id-ms-save" onClick={addMilestone}>Add</button>
                  <button className="id-ms-cancel" onClick={()=>setShowMForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div className="id-ms-list">
              {(idea.milestones || []).length === 0 ? (
                <p className="id-ms-empty">No milestones yet. Add your first goal!</p>
              ) : (
                idea.milestones.map((m, i) => (
                  <div key={m._id || i} className={`id-ms-item ${m.completed ? 'done' : ''}`} onClick={() => toggleMilestone(m._id, m.completed)}>
                    <div className="id-ms-check">{m.completed ? '✓' : ''}</div>
                    <div>
                      <div className="id-ms-title">{m.title}</div>
                      {m.dueDate && <div className="id-ms-date">{new Date(m.dueDate).toLocaleDateString()}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
