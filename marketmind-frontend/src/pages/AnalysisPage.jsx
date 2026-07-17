import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadAnalysisPDF, downloadFullReport } from '../utils/downloadUtils';
import './AnalysisPage.css';

export default function AnalysisPage() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState('overview');
  const [growthRate, setGrowthRate] = useState(30);
  const [monthlyCosts, setMonthlyCosts] = useState(200000);

  useEffect(() => { fetchIdea(); }, [id]);

  const fetchIdea = async () => {
    try {
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data.idea);
      if (res.data.idea.analysis?.viabilityScore) setAnalysis(res.data.idea.analysis);
    } catch { toast.error('Failed to load idea'); }
    finally { setFetching(false); }
  };

  const runAnalysis = async () => {
    setLoading(true); toast.loading('Analyzing your idea...', { id: 'a' });
    try {
      const res = await api.post('/ai/analyze-idea', {
        ideaId: idea._id, product: idea.product, industry: idea.industry,
        targetCity: idea.targetCity, targetCountry: idea.targetCountry || 'Pakistan',
        targetCustomers: idea.targetCustomers, priceMin: idea.priceMin,
        priceMax: idea.priceMax, description: idea.description
      });
      setAnalysis(res.data.analysis);
      toast.success('Analysis complete!', { id: 'a' });
    } catch { toast.error('Analysis failed. Try again.', { id: 'a' }); }
    finally { setLoading(false); }
  };

  // Financial simulator calc
  const base1 = analysis?.revenueProjection?.year1 || 1200000;
  const year3Simulated = +(base1 * Math.pow(1 + growthRate / 100, 2) / 1000000).toFixed(1);
  const breakEvenMonth = Math.ceil(monthlyCosts / ((base1 / 12) * 0.4));

  const simData = analysis ? [1,2,3,4,5,6,7,8,9,10,11,12,18,24,30,36].map(m => {
    const rev = (base1 / 12) * Math.pow(1 + growthRate / 1200, m);
    const cost = monthlyCosts;
    return { month: m <= 12 ? `M${m}` : `Y${Math.ceil(m/12)}`, Revenue: Math.round(rev/1000), Costs: Math.round(cost/1000), Profit: Math.round((rev-cost)/1000) };
  }).filter((_, i) => [0,2,5,11,12,13,14,15].includes(i)) : [];

  const fmt = v => v >= 1000000 ? `₨${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₨${(v/1000).toFixed(0)}K` : `₨${v}`;

  const marketData = analysis ? [
    { name: 'TAM', value: +(analysis.tamEstimate/1000000).toFixed(1), fill: '#6366f1' },
    { name: 'SAM', value: +(analysis.samEstimate/1000000).toFixed(1), fill: '#10b981' },
    { name: 'SOM', value: +(analysis.somEstimate/1000000).toFixed(1), fill: '#f59e0b' },
  ] : [];

  const ScoreRing = ({ score, label, color, size = 110 }) => {
    const r = size/2-10, c = 2*Math.PI*r, p = (score/100)*c;
    return (
      <div className="score-ring-wrap">
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9"/>
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9"
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - p }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}/>
          <text x={size/2} y={size/2+6} textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{score}</text>
        </svg>
        <p className="score-ring-label">{label}</p>
      </div>
    );
  };

  if (fetching) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}><div className="spinner"/></div>;
  if (!idea) return <div>Idea not found</div>;

  return (
    <div className="analysis-page">
      <div className="ap-header">
        <div>
          <div className="ap-breadcrumb"><Link to="/dashboard">Dashboard</Link><span>/</span><Link to={`/ideas/${id}`}>{idea.title}</Link><span>/</span><span>Analysis</span></div>
          <h1>{idea.title}</h1>
          <p className="ap-meta">{idea.product} · {idea.targetCity} · {idea.targetCustomers}</p>
        </div>
        <div className="ap-header-right">
          {!analysis ? (
            <button className="run-btn" onClick={runAnalysis} disabled={loading}>
              {loading ? <><span className="btn-spinner"/> Analyzing market data...</> : <>⚡ Run Full AI Analysis</>}
            </button>
          ) : (
            <div className="ap-actions">
              <button className="rerun-btn" onClick={runAnalysis} disabled={loading}>{loading ? '...' : '↻ Re-analyze'}</button>
              <Link to={`/ideas/${id}/competitors`} className="ap-link">🗺 Map</Link>
              <Link to={`/ideas/${id}/pitch`} className="ap-link primary">🚀 Pitch</Link>
              <button className="dl-btn" onClick={() => downloadAnalysisPDF(analysis, idea)}>⬇️ PDF</button>
              <button className="dl-btn dl-full" onClick={() => downloadFullReport(idea, analysis, null, null)}>📦 Full</button>
            </div>
          )}
        </div>
      </div>

      {!analysis && !loading && (
        <div className="no-analysis"><span>📊</span><h2>No analysis yet</h2>
          <p>Click "Run Full AI Analysis" to get market scores, revenue projections, customer personas, and entry strategy.</p>
        </div>
      )}

      {analysis && (<>
        <div className="score-rings">
          <ScoreRing score={analysis.demandScore} label="Market Demand" color="#10b981"/>
          <ScoreRing score={analysis.viabilityScore} label="Viability" color="#6366f1"/>
          <ScoreRing score={Math.max(0,100-analysis.competitionScore)} label="Market Openness" color="#f59e0b"/>
        </div>
        <motion.div className="verdict-box" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}>
          <span>🧠</span><p>{analysis.overallVerdict}</p>
        </motion.div>
        <div className="ap-tabs">
          {[['overview','📊 Overview'],['financials','💰 Financials'],['customers','👥 Customers'],['insights','💡 Insights']].map(([t,l])=>(
            <button key={t} className={`ap-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{l}</button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}>

            {tab==='overview' && (
              <div className="tab-content">
                <div className="two-col">
                  <div className="ap-card">
                    <h3>Market Size ($M)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                        <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:12}}/>
                        <YAxis tick={{fill:'#94a3b8',fontSize:11}} tickFormatter={v=>`$${v}M`}/>
                        <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.3)',borderRadius:8}} formatter={v=>[`$${v}M`,'']}/>
                        <Bar dataKey="value" radius={[6,6,0,0]}>{marketData.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ap-card">
                    <h3>Entry Strategy</h3><p className="insight-text">{analysis.entryStrategy}</p>
                    <h3 style={{marginTop:'1.5rem'}}>Positioning</h3>
                    <p className="insight-text positioning">{analysis.suggestedPositioning}</p>
                  </div>
                </div>
                <div className="three-col">
                  <div className="ap-card green-b"><h3>✓ Strengths</h3><ul className="insight-list">{analysis.keyStrengths?.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                  <div className="ap-card red-b"><h3>⚠ Risks</h3><ul className="insight-list">{analysis.keyRisks?.map((r,i)=><li key={i}>{r}</li>)}</ul></div>
                  <div className="ap-card blue-b"><h3>🚀 Opportunities</h3><ul className="insight-list">{analysis.opportunities?.map((o,i)=><li key={i}>{o}</li>)}</ul></div>
                </div>
              </div>
            )}

            {tab==='financials' && (
              <div className="tab-content">
                <div className="ap-card full sim-card">
                  <div className="sim-header">
                    <h3>📈 Interactive Revenue Simulator</h3>
                    <div className="sim-badges">
                      <span style={{color:'#10b981'}}>Year 3: <strong>₨{year3Simulated}M</strong></span>
                      <span style={{color:'#f59e0b',marginLeft:16}}>Break-even: <strong>~M{Math.min(breakEvenMonth,36)}</strong></span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={simData}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="month" tick={{fill:'#94a3b8',fontSize:11}}/>
                      <YAxis tick={{fill:'#94a3b8',fontSize:11}} tickFormatter={v=>`₨${v}K`}/>
                      <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.3)',borderRadius:8}} formatter={v=>[`₨${v}K`,'']}/>
                      <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="url(#rg)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="Costs" stroke="#ef4444" fill="url(#cg)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 3"/>
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="sim-sliders">
                    <div className="sim-slider-group">
                      <div className="ssl-header">
                        <label>📈 Growth Rate</label>
                        <span className="ssl-val green">{growthRate}% / year</span>
                      </div>
                      <input type="range" min="5" max="200" value={growthRate}
                        onChange={e=>setGrowthRate(Number(e.target.value))} className="sim-range green-range"
                        style={{background:`linear-gradient(to right,#10b981 ${(growthRate-5)/195*100}%,#1e1e30 ${(growthRate-5)/195*100}%)`}}/>
                      <div className="ssl-marks"><span>5%</span><span>Conservative 30%</span><span>Aggressive 100%+</span><span>200%</span></div>
                    </div>
                    <div className="sim-slider-group">
                      <div className="ssl-header">
                        <label>💸 Monthly Costs (PKR)</label>
                        <span className="ssl-val amber">₨{(monthlyCosts/1000).toFixed(0)}K / mo</span>
                      </div>
                      <input type="range" min="50000" max="2000000" step="10000" value={monthlyCosts}
                        onChange={e=>setMonthlyCosts(Number(e.target.value))} className="sim-range amber-range"
                        style={{background:`linear-gradient(to right,#f59e0b ${(monthlyCosts-50000)/1950000*100}%,#1e1e30 ${(monthlyCosts-50000)/1950000*100}%)`}}/>
                      <div className="ssl-marks"><span>₨50K</span><span>Low overhead</span><span>High overhead</span><span>₨2M</span></div>
                    </div>
                  </div>
                </div>

                <div className="rev-cards">
                  {[
                    ['Year 1', fmt(analysis.revenueProjection?.year1),''],
                    ['Year 2', fmt(analysis.revenueProjection?.year2),''],
                    ['Year 3 ✦', `₨${year3Simulated}M`,'highlighted'],
                    ['Market SOM', `$${(analysis.somEstimate/1000000)?.toFixed(1)}M`,''],
                  ].map(([l,v,cls],i)=>(
                    <div key={i} className={`rev-card ${cls}`}>
                      <span className="rev-label">{l}</span>
                      <span className="rev-value">{v}</span>
                      {cls==='highlighted' && <span className="sim-tag">simulated</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==='customers' && (
              <div className="tab-content">
                <div className="personas-grid">
                  {analysis.customerPersonas?.map((p,i)=>(
                    <motion.div key={i} className="persona-card" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.1}}>
                      <div className="persona-header">
                        <div className="persona-avatar">{p.name?.charAt(0)}</div>
                        <div><h4>{p.name}</h4><span className="persona-age">{p.age}</span></div>
                        <span className="adoption-tag">{p.adoptionType?.replace('_',' ')}</span>
                      </div>
                      <p className="persona-desc">{p.description}</p>
                      <div className="pain-points">{p.painPoints?.map((pp,j)=><div key={j} className="pain-item">⚡ {pp}</div>)}</div>
                      <div className="wtp">Willingness to pay: <strong>{p.willingnessToPay}</strong></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tab==='insights' && (
              <div className="tab-content">
                <div className="two-col">
                  <div className="ap-card">
                    <h3>Market Trends</h3>
                    {analysis.marketTrends?.map((t,i)=><div key={i} className="trend-item"><span className="trend-num">{i+1}</span><p>{t}</p></div>)}
                  </div>
                  <div className="ap-card">
                    <h3>Critical Success Factors</h3>
                    {analysis.criticalSuccessFactors?.map((f,i)=><div key={i} className="csf-item"><span>✓</span><p>{f}</p></div>)}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </>)}
    </div>
  );
}
