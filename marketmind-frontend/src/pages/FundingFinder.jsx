import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadFundingPDF } from '../utils/downloadUtils';
import './FundingFinder.css';

const STAGES = ['Idea Stage', 'MVP/Prototype', 'Early Revenue', 'Growth Stage'];
const AMOUNTS = ['100,000 - 500,000', '500,000 - 2,000,000', '2,000,000 - 10,000,000', '10,000,000+'];

export default function FundingFinder() {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ product: '', industry: 'Food & Beverage', stage: 'Idea Stage', amount: '500,000 - 2,000,000' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => { api.get('/ideas').then(r => setIdeas(r.data.ideas || [])).catch(() => {}); }, []);

  const autofill = (id) => {
    const idea = ideas.find(i => i._id === id);
    if (idea) setForm(f => ({ ...f, product: idea.product, industry: idea.industry }));
  };

  const find = async () => {
    if (!form.product) return toast.error('Enter your product/service');
    setLoading(true); setResults(null);
    try {
      const res = await api.post('/ai/find-funding', form);
      setResults(res.data);
      toast.success(`Found ${res.data.sources?.length || 0} funding sources!`);
      window._fundingMeta = { product: form.product, stage: form.stage };
    } catch { toast.error('Search failed. Try again.'); }
    finally { setLoading(false); }
  };

  const diffColor = d => d === 'Easy' ? '#10b981' : d === 'Medium' ? '#f59e0b' : '#ef4444';
  const typeColor = t => ({ Grant:'#10b981', VC:'#6366f1', Angel:'#f59e0b', Incubator:'#8b5cf6', Bank:'#3b82f6' }[t] || '#64748b');

  return (
    <div className="funding-page">
      <div className="fd-header">
        <h1>💰 Funding Finder</h1>
        <p>Discover real grants, investors & incubators available for Pakistan startups</p>
      </div>

      <div className="fd-form-card">
        {ideas.length > 0 && (
          <div className="fd-autofill">
            <label>Autofill from idea:</label>
            <select onChange={e => autofill(e.target.value)} defaultValue="">
              <option value="">— Select idea —</option>
              {ideas.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
            </select>
          </div>
        )}
        <div className="fd-fields">
          <div className="fd-field">
            <label>Product / Service *</label>
            <input value={form.product} onChange={e => setForm(f => ({...f, product: e.target.value}))} placeholder="e.g. Mobile App, Food Business" />
          </div>
          <div className="fd-field">
            <label>Industry</label>
            <select value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))}>
              {['Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech','Agriculture'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="fd-field">
            <label>Startup Stage</label>
            <select value={form.stage} onChange={e => setForm(f => ({...f, stage: e.target.value}))}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="fd-field">
            <label>Funding Needed (PKR)</label>
            <select value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}>
              {AMOUNTS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <button className="fd-btn" onClick={find} disabled={loading}>
          {loading ? <><span className="spinner-sm"/> Finding funding sources...</> : '🔍 Find Funding Sources'}
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <div className="fd-summary">
              <div className="fds-item">
                <span className="fds-val">{results.sources?.length || 0}</span>
                <span className="fds-lbl">Sources Found</span>
              </div>
              <div className="fds-item">
                <span className="fds-val" style={{color:'#10b981'}}>{results.totalPotential}</span>
                <span className="fds-lbl">Total Potential</span>
              </div>
            </div>
            {results.topRecommendation && (
              <div className="fd-rec">⭐ <strong>Top Pick:</strong> {results.topRecommendation}</div>
            )}
            <button className="fd-dl-btn" onClick={() => downloadFundingPDF(results, { product: form.product, stage: form.stage })}>⬇️ Download PDF Report</button>
            <div className="fd-list">
              {(results.sources || []).map((s, i) => (
                <motion.div key={i} className="fd-card" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}>
                  <div className="fdc-top">
                    <div>
                      <span className="fdc-type" style={{background: typeColor(s.type)+'22', color: typeColor(s.type), borderColor: typeColor(s.type)+'44'}}>{s.type}</span>
                      <h3 className="fdc-name">{s.name}</h3>
                    </div>
                    <div className="fdc-right">
                      <div className="fdc-score" style={{background:`conic-gradient(#6366f1 ${s.matchScore*3.6}deg, #1a1a2e 0)`}}>
                        <span>{s.matchScore}%</span>
                      </div>
                      <span className="fdc-match">match</span>
                    </div>
                  </div>
                  <div className="fdc-amount">💰 {s.amount}</div>
                  <div className="fdc-body">
                    <div><strong>Eligibility:</strong> {s.eligibility}</div>
                    <div><strong>How to Apply:</strong> {s.howToApply}</div>
                    {s.deadline && <div><strong>Deadline:</strong> {s.deadline}</div>}
                  </div>
                  <div className="fdc-footer">
                    <span className="fdc-diff" style={{color: diffColor(s.difficulty)}}>● {s.difficulty}</span>
                    {s.link && <a href={s.link.startsWith('http') ? s.link : `https://${s.link}`} target="_blank" rel="noopener noreferrer" className="fdc-link">Visit →</a>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
