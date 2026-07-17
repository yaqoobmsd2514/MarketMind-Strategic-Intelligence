import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadMarketingPDF } from '../utils/downloadUtils';
import './MarketingPlan.css';

const BUDGETS = ['10,000', '30,000', '50,000', '100,000', '200,000+'];
const CHANNEL_ICONS = { Instagram:'📸', Facebook:'👥', TikTok:'🎵', YouTube:'▶️', WhatsApp:'💬', LinkedIn:'💼', Google:'🔍', default:'📢' };

export default function MarketingPlan() {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ product: '', industry: 'Food & Beverage', targetCity: '', targetCustomers: '', budget: '30,000' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [tab, setTab] = useState('channels');

  useEffect(() => { api.get('/ideas').then(r => setIdeas(r.data.ideas || [])).catch(() => {}); }, []);

  const autofill = (id) => {
    const idea = ideas.find(i => i._id === id);
    if (idea) setForm(f => ({ ...f, product: idea.product, industry: idea.industry, targetCity: idea.targetCity, targetCustomers: idea.targetCustomers }));
  };

  const generate = async () => {
    if (!form.product || !form.targetCity) return toast.error('Fill in product and city');
    setLoading(true); setResults(null);
    try {
      const res = await api.post('/ai/marketing-plan', form);
      setResults(res.data);
      toast.success('Marketing plan ready!');
    } catch { toast.error('Generation failed. Try again.'); }
    finally { setLoading(false); }
  };

  const fmt = v => v >= 1000 ? `Rs${(v/1000).toFixed(0)}K` : `Rs${v}`;

  return (
    <div className="mkt-page">
      <div className="mkt-header">
        <h1>📣 Marketing Plan Generator</h1>
        <p>Complete digital marketing strategy built for Pakistan — social media, content, SEO & influencers</p>
      </div>

      <div className="mkt-form-card">
        {ideas.length > 0 && (
          <div className="mkt-autofill">
            <label>Autofill from idea:</label>
            <select onChange={e => autofill(e.target.value)} defaultValue="">
              <option value="">— Select idea —</option>
              {ideas.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
            </select>
          </div>
        )}
        <div className="mkt-fields">
          <div className="mkt-field"><label>Product / Service *</label><input value={form.product} onChange={e => setForm(f => ({...f, product: e.target.value}))} placeholder="e.g. Online Tutoring" /></div>
          <div className="mkt-field"><label>City *</label><input value={form.targetCity} onChange={e => setForm(f => ({...f, targetCity: e.target.value}))} placeholder="e.g. Islamabad" /></div>
          <div className="mkt-field"><label>Target Customers</label><input value={form.targetCustomers} onChange={e => setForm(f => ({...f, targetCustomers: e.target.value}))} placeholder="e.g. parents of school children" /></div>
          <div className="mkt-field"><label>Monthly Budget (PKR)</label>
            <select value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))}>
              {BUDGETS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <button className="mkt-btn" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner-sm"/>Generating plan...</> : '🚀 Generate Marketing Plan'}
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <button className="mkt-dl-btn" onClick={() => downloadMarketingPDF(results, { product: form.product, city: form.targetCity, budget: form.budget })}>⬇️ Download Marketing Plan PDF</button>
            {/* Budget breakdown */}
            {results.monthlyBudgetBreakdown && (
              <div className="mkt-budget-bar">
                <h3>💰 Monthly Budget: PKR {form.budget}</h3>
                <div className="budget-items">
                  {Object.entries(results.monthlyBudgetBreakdown).map(([k, v]) => (
                    <div key={k} className="budget-item">
                      <span className="bi-label">{k.replace(/([A-Z])/g,' $1').trim()}</span>
                      <div className="bi-bar-wrap"><div className="bi-bar" style={{width:`${Math.min(100,(v/Number(form.budget.replace(/,/g,'').replace('+','')))*100)}%`}} /></div>
                      <span className="bi-val">{fmt(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mkt-tabs">
              {['channels','calendar','seo','actions'].map(t => (
                <button key={t} className={`mkt-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                  {t==='channels'?'📢 Channels':t==='calendar'?'📅 Content Calendar':t==='seo'?'🔍 SEO':t==='actions'?'✅ Week 1 Actions':''}
                </button>
              ))}
            </div>

            {tab === 'channels' && (
              <div className="mkt-channels">
                {(results.channels || []).map((ch, i) => (
                  <motion.div key={i} className="ch-card" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
                    <div className="ch-top">
                      <span className="ch-icon">{CHANNEL_ICONS[ch.name] || CHANNEL_ICONS.default}</span>
                      <div><h3 className="ch-name">{ch.name}</h3><span className="ch-budget">PKR {ch.budget?.toLocaleString()}/mo</span></div>
                      <div className="ch-reach">👥 {ch.expectedReach?.toLocaleString()} reach</div>
                    </div>
                    <div className="ch-tactics"><strong>Tactics:</strong>
                      <ul>{(ch.tactics||[]).map((t,j)=><li key={j}>{t}</li>)}</ul>
                    </div>
                    <div className="ch-ideas"><strong>Content Ideas:</strong>
                      <div className="ch-ideas-list">{(ch.contentIdeas||[]).map((c,j)=><span key={j} className="idea-chip">{c}</span>)}</div>
                    </div>
                    {ch.kpis && <div className="ch-kpis">🎯 KPIs: {ch.kpis.join(' · ')}</div>}
                  </motion.div>
                ))}
              </div>
            )}

            {tab === 'calendar' && (
              <div className="mkt-calendar">
                {(results.contentCalendar || []).map((week, i) => (
                  <div key={i} className="cal-week">
                    <div className="cal-week-header">
                      <span className="cal-wnum">Week {week.week}</span>
                      <span className="cal-theme">{week.theme}</span>
                      <span className="cal-platform">{week.platform}</span>
                    </div>
                    <div className="cal-posts">
                      {(week.posts || []).map((p, j) => <div key={j} className="cal-post">📝 {p}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'seo' && (
              <div className="mkt-seo">
                <h3>🎯 Target Keywords for {form.targetCity}</h3>
                <div className="seo-keywords">
                  {(results.seoKeywords || []).map((kw, i) => <span key={i} className="seo-kw">{kw}</span>)}
                </div>
                {results.influencerStrategy && (
                  <div className="seo-influencer">
                    <h3>🌟 Influencer Strategy</h3>
                    <p>{results.influencerStrategy}</p>
                  </div>
                )}
                {results.expectedResults && (
                  <div className="seo-results">
                    <h3>📈 Expected Results</h3>
                    <div className="er-grid">
                      {Object.entries(results.expectedResults).map(([k,v])=>(
                        <div key={k} className="er-item"><span className="er-period">{k}</span><span className="er-val">{v}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'actions' && (
              <div className="mkt-actions">
                <h3>✅ Your Week 1 Action Plan</h3>
                <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:20}}>Do these right now to start generating customers:</p>
                {(results.week1Actions || []).map((a, i) => (
                  <motion.div key={i} className="action-item" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}>
                    <div className="action-num">{i+1}</div>
                    <div className="action-text">{a}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
