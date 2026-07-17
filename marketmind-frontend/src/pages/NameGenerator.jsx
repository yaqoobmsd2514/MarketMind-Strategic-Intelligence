import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './NameGenerator.css';

const STYLES = ['Modern & Tech', 'Traditional & Trust', 'Playful & Fun', 'Luxury & Premium', 'Simple & Clean'];

export default function NameGenerator() {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ product: '', industry: 'Food & Beverage', targetCity: '', style: 'Modern & Tech' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    api.get('/ideas').then(r => setIdeas(r.data.ideas || [])).catch(() => {});
    const s = JSON.parse(localStorage.getItem('saved_names') || '[]');
    setSaved(s);
  }, []);

  const autofill = (id) => {
    const idea = ideas.find(i => i._id === id);
    if (idea) setForm(f => ({ ...f, product: idea.product, industry: idea.industry, targetCity: idea.targetCity }));
  };

  const generate = async () => {
    if (!form.product || !form.targetCity) return toast.error('Fill in product and city');
    setLoading(true); setResults(null);
    try {
      const res = await api.post('/ai/generate-names', form);
      setResults(res.data);
      toast.success('10 names generated!');
    } catch { toast.error('Generation failed. Try again.'); }
    finally { setLoading(false); }
  };

  const saveName = (name) => {
    const updated = saved.includes(name) ? saved.filter(n => n !== name) : [...saved, name];
    setSaved(updated);
    localStorage.setItem('saved_names', JSON.stringify(updated));
    toast(saved.includes(name) ? 'Removed from saved' : '❤️ Saved!');
  };

  const scoreColor = s => s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="namegen-page">
      <div className="ng-header">
        <h1>🏷️ Business Name Generator</h1>
        <p>AI-powered naming for your Pakistan startup — with domain availability & brand scoring</p>
      </div>

      <div className="ng-form-card">
        {ideas.length > 0 && (
          <div className="ng-autofill">
            <label>Autofill from your idea:</label>
            <select onChange={e => autofill(e.target.value)} defaultValue="">
              <option value="">— Select idea —</option>
              {ideas.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
            </select>
          </div>
        )}
        <div className="ng-fields">
          <div className="ng-field">
            <label>Product / Service *</label>
            <input value={form.product} onChange={e => setForm(f => ({...f, product: e.target.value}))} placeholder="e.g. Burger Shop, Online Tutoring" />
          </div>
          <div className="ng-field">
            <label>City *</label>
            <input value={form.targetCity} onChange={e => setForm(f => ({...f, targetCity: e.target.value}))} placeholder="e.g. Lahore, Karachi" />
          </div>
          <div className="ng-field">
            <label>Industry</label>
            <select value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))}>
              {['Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="ng-field">
            <label>Name Style</label>
            <select value={form.style} onChange={e => setForm(f => ({...f, style: e.target.value}))}>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button className="ng-btn" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner-sm"/> Generating names...</> : '✨ Generate 10 Names'}
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            {results.tips && <div className="ng-tip">💡 {results.tips}</div>}
            <div className="ng-grid">
              {(results.names || []).map((n, i) => (
                <motion.div key={i} className="ng-card" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                  <div className="ngc-top">
                    <div className="ngc-score" style={{color: scoreColor(n.score), borderColor: scoreColor(n.score)+'40'}}>{n.score}</div>
                    <button className={`ngc-save ${saved.includes(n.name)?'saved':''}`} onClick={() => saveName(n.name)}>
                      {saved.includes(n.name) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <h3 className="ngc-name">{n.name}</h3>
                  <p className="ngc-tagline">"{n.tagline}"</p>
                  <p className="ngc-meaning">{n.meaning}</p>
                  <div className="ngc-domain">🌐 {n.domain}</div>
                </motion.div>
              ))}
            </div>
            {saved.length > 0 && (
              <div className="ng-saved">
                <h3>❤️ Saved Names ({saved.length})</h3>
                <div className="ng-saved-list">
                  {saved.map(n => <span key={n} className="ng-saved-tag" onClick={() => saveName(n)}>{n} ✕</span>)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
