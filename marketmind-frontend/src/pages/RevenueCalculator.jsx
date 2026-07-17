import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import './RevenueCalculator.css';

export default function RevenueCalculator() {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ product: '', industry: 'Food & Beverage', targetCity: '', targetCustomers: '', priceMin: '', priceMax: '', initialInvestment: '500000' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [view, setView] = useState('monthly');

  useEffect(() => { api.get('/ideas').then(r => setIdeas(r.data.ideas || [])).catch(() => {}); }, []);

  const autofill = (id) => {
    const idea = ideas.find(i => i._id === id);
    if (idea) setForm(f => ({ ...f, product: idea.product, industry: idea.industry, targetCity: idea.targetCity, targetCustomers: idea.targetCustomers, priceMin: idea.priceMin || '', priceMax: idea.priceMax || '' }));
  };

  const calculate = async () => {
    if (!form.product || !form.priceMin || !form.priceMax) return toast.error('Fill in product and price range');
    setLoading(true); setResults(null);
    try {
      const res = await api.post('/ai/calculate-revenue', form);
      setResults(res.data);
      toast.success('Financial projections ready!');
    } catch { toast.error('Calculation failed. Try again.'); }
    finally { setLoading(false); }
  };

  const fmt = v => v >= 1000000 ? `Rs${(v/1000000).toFixed(1)}M` : v >= 1000 ? `Rs${(v/1000).toFixed(0)}K` : `Rs${v}`;

  const monthlyData = results?.monthly?.map(m => ({
    name: `M${m.month}`, Revenue: m.revenue, Costs: m.costs, Profit: m.profit, Customers: m.customers
  })) || [];

  const yearlyData = results?.yearly ? [
    { name: 'Year 1', Revenue: results.yearly.year1?.revenue, Profit: results.yearly.year1?.profit },
    { name: 'Year 2', Revenue: results.yearly.year2?.revenue, Profit: results.yearly.year2?.profit },
    { name: 'Year 3', Revenue: results.yearly.year3?.revenue, Profit: results.yearly.year3?.profit },
  ] : [];

  return (
    <div className="revcalc-page">
      <div className="rc-header">
        <h1>📊 Revenue & Break-even Calculator</h1>
        <p>AI-powered financial projections specific to your city and market in Pakistan</p>
      </div>

      <div className="rc-form-card">
        {ideas.length > 0 && (
          <div className="rc-autofill">
            <label>Autofill from idea:</label>
            <select onChange={e => autofill(e.target.value)} defaultValue="">
              <option value="">— Select idea —</option>
              {ideas.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
            </select>
          </div>
        )}
        <div className="rc-fields">
          <div className="rc-field">
            <label>Product / Service *</label>
            <input value={form.product} onChange={e => setForm(f => ({...f, product: e.target.value}))} placeholder="e.g. Burger Shop" />
          </div>
          <div className="rc-field">
            <label>City</label>
            <input value={form.targetCity} onChange={e => setForm(f => ({...f, targetCity: e.target.value}))} placeholder="e.g. Lahore" />
          </div>
          <div className="rc-field">
            <label>Min Price (PKR) *</label>
            <input type="number" value={form.priceMin} onChange={e => setForm(f => ({...f, priceMin: e.target.value}))} placeholder="e.g. 300" />
          </div>
          <div className="rc-field">
            <label>Max Price (PKR) *</label>
            <input type="number" value={form.priceMax} onChange={e => setForm(f => ({...f, priceMax: e.target.value}))} placeholder="e.g. 800" />
          </div>
          <div className="rc-field">
            <label>Target Customers</label>
            <input value={form.targetCustomers} onChange={e => setForm(f => ({...f, targetCustomers: e.target.value}))} placeholder="e.g. university students" />
          </div>
          <div className="rc-field">
            <label>Initial Investment (PKR)</label>
            <input type="number" value={form.initialInvestment} onChange={e => setForm(f => ({...f, initialInvestment: e.target.value}))} placeholder="500000" />
          </div>
        </div>
        <button className="rc-btn" onClick={calculate} disabled={loading}>
          {loading ? <><span className="spinner-sm"/> Calculating projections...</> : '🧮 Calculate Financials'}
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            {/* Break-even highlight */}
            <div className="rc-breakeven">
              <div className="be-item be-main">
                <span className="be-icon">🎯</span>
                <span className="be-val">{results.breakEven?.monthsToBreakEven} months</span>
                <span className="be-lbl">Break-even Point</span>
              </div>
              <div className="be-item">
                <span className="be-val">{results.breakEven?.unitsPerMonth}</span>
                <span className="be-lbl">Units/Month Needed</span>
              </div>
              <div className="be-item">
                <span className="be-val" style={{color:'#10b981'}}>{fmt(results.breakEven?.revenueAtBreakEven)}</span>
                <span className="be-lbl">Revenue at Break-even</span>
              </div>
              {results.keyMetrics && <>
                <div className="be-item">
                  <span className="be-val">{results.keyMetrics.grossMargin}</span>
                  <span className="be-lbl">Gross Margin</span>
                </div>
                <div className="be-item">
                  <span className="be-val">{results.keyMetrics.cac}</span>
                  <span className="be-lbl">Customer Acq. Cost</span>
                </div>
              </>}
            </div>

            {/* Chart toggle */}
            <div className="rc-chart-card">
              <div className="rc-chart-header">
                <h3>{view === 'monthly' ? 'Monthly Revenue vs Costs' : '3-Year Revenue Projection'}</h3>
                <div className="rc-toggle">
                  <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>Monthly</button>
                  <button className={view === 'yearly' ? 'active' : ''} onClick={() => setView('yearly')}>Yearly</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                {view === 'monthly' ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={fmt} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{background:'#1a1a2e',border:'1px solid #2a2a3a',borderRadius:8}} />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Costs" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={fmt} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{background:'#1a1a2e',border:'1px solid #2a2a3a',borderRadius:8}} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#6366f1" radius={[6,6,0,0]} />
                    <Bar dataKey="Profit" fill="#10b981" radius={[6,6,0,0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Yearly cards */}
            {results.yearly && (
              <div className="rc-yearly-grid">
                {[1,2,3].map(y => {
                  const yr = results.yearly[`year${y}`];
                  if (!yr) return null;
                  return (
                    <div key={y} className="rc-year-card">
                      <div className="ryc-label">Year {y}</div>
                      <div className="ryc-rev">{fmt(yr.revenue)}</div>
                      <div className="ryc-sub">Revenue</div>
                      <div className={`ryc-profit ${yr.profit >= 0 ? 'pos' : 'neg'}`}>{yr.profit >= 0 ? '+' : ''}{fmt(yr.profit)}</div>
                      <div className="ryc-sub">Net Profit</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assumptions & Risks */}
            <div className="rc-bottom-grid">
              {results.assumptions && (
                <div className="rc-box">
                  <h3>📋 Assumptions</h3>
                  <ul>{results.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              )}
              {results.risks && (
                <div className="rc-box rc-risks">
                  <h3>⚠️ Financial Risks</h3>
                  <ul>{results.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
