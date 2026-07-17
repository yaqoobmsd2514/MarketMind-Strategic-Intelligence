import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './PitchGenerator.css';
import { downloadPitchPDF } from '../utils/downloadUtils';
const ICONS = {Problem:'🔥',Solution:'💡','Market Size':'📊','Product Demo':'🛠️','Business Model':'💰',Traction:'📈',Competition:'🥊',Team:'👥',Financials:'📋','The Ask':'🤝'};
export default function PitchGenerator() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('list');
  const [slide, setSlide] = useState(0);
  useEffect(() => { api.get(`/ideas/${id}`).then(r=>setIdea(r.data.idea)).catch(()=>toast.error('Failed to load idea')); }, [id]);
  const generate = async () => {
    setLoading(true); toast.loading('Generating pitch deck...', {id:'pitch'});
    try {
      const res = await api.post('/ai/generate-pitch', { idea, analysis:idea?.analysis });
      setPitch(res.data.pitch); toast.success('Pitch deck ready!', {id:'pitch'});
    } catch { toast.error('Failed to generate pitch', {id:'pitch'}); }
    finally { setLoading(false); }
  };
  if (!idea) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}><div className="spinner"/></div>;
  return (
    <div className="pitch-page">
      <div className="pitch-header">
        <div>
          <div className="ap-breadcrumb"><Link to="/dashboard">Dashboard</Link><span>/</span><span>{idea.title}</span><span>/</span><span>Pitch Deck</span></div>
          <h1>Investor Pitch Deck</h1>
          <p style={{color:'var(--text-secondary)',fontSize:14}}>{idea.product} · {idea.targetCity}</p>
        </div>
        <div className="pitch-actions">
          {pitch && (
            <div className="view-toggle">
              <button className={mode==='list'?'active':''} onClick={()=>setMode('list')}>List</button>
              <button className={mode==='present'?'active':''} onClick={()=>setMode('present')}>Present</button>
            </div>
          )}
          {!pitch ? <button className="gen-pitch-btn" onClick={generate} disabled={loading}>{loading?<><span className="btn-spinner"/> Generating...</>:'🚀 Generate Pitch Deck'}</button>
          : <><button className="regen-btn" onClick={generate} disabled={loading}>↻ Regenerate</button><button className="download-btn" onClick={() => downloadPitchPDF(pitch, idea)}>⬇️ Download PDF</button></>}
        </div>
      </div>
      {!pitch&&!loading&&(
        <div className="pitch-empty">
          <span>🚀</span><h2>Generate Your Investor Pitch</h2>
          <p>AI will create a 10-slide investor-ready pitch deck based on your idea and market analysis.</p>
          <ul className="pitch-includes">{['Problem & Solution slides','Market size with your data','Revenue model & projections','Competitive landscape','The Ask'].map((item,i)=><li key={i}>✓ {item}</li>)}</ul>
          <button className="gen-pitch-btn large" onClick={generate} disabled={loading}>{loading?<><span className="btn-spinner"/> Generating...</>:'⚡ Generate Pitch Deck'}</button>
        </div>
      )}
      {pitch && (
        <AnimatePresence mode="wait">
          {mode==='list' ? (
            <motion.div key="list" initial={{opacity:0}} animate={{opacity:1}}>
              <div className="pitch-meta"><div><span>Title</span><strong>{pitch.pitchTitle}</strong></div><div><span>Tagline</span><strong>"{pitch.tagline}"</strong></div>{pitch.askAmount&&<div><span>Ask</span><strong>{pitch.askAmount}</strong></div>}</div>
              <div className="slides-list">
                {pitch.slides?.map((s,i)=>(
                  <motion.div key={i} className="slide-item" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                    <div className="slide-num">{s.slideNumber}</div>
                    <div className="slide-body">
                      <div className="slide-title-row"><span>{ICONS[s.title]||'📌'}</span><h3>{s.title}</h3></div>
                      <p className="slide-heading">"{s.heading}"</p>
                      <ul className="slide-bullets">{s.bullets?.map((b,j)=><li key={j}>{b}</li>)}</ul>
                      {s.speakerNotes&&<details className="notes"><summary>Speaker notes</summary><p>{s.speakerNotes}</p></details>}
                    </div>
                  </motion.div>
                ))}
              </div>
              {pitch.useOfFunds?.length>0&&<div className="use-funds"><h3>Use of Funds</h3><ul>{pitch.useOfFunds.map((f,i)=><li key={i}>{f}</li>)}</ul></div>}
            </motion.div>
          ) : (
            <motion.div key="present" initial={{opacity:0}} animate={{opacity:1}} className="present-mode">
              <div className="slide-dots">{pitch.slides?.map((_,i)=><button key={i} className={`dot ${slide===i?'active':''}`} onClick={()=>setSlide(i)}>{i+1}</button>)}</div>
              <AnimatePresence mode="wait">
                {pitch.slides?.[slide]&&(
                  <motion.div key={slide} className="big-slide" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                    <div className="big-slide-meta">{ICONS[pitch.slides[slide].title]||'📌'} Slide {pitch.slides[slide].slideNumber}</div>
                    <h2>{pitch.slides[slide].title}</h2>
                    <p className="big-heading">"{pitch.slides[slide].heading}"</p>
                    <ul className="big-bullets">{pitch.slides[slide].bullets?.map((b,j)=><li key={j}>{b}</li>)}</ul>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="slide-nav">
                <button disabled={slide===0} onClick={()=>setSlide(s=>s-1)}>← Previous</button>
                <span>{slide+1} / {pitch.slides?.length}</span>
                <button disabled={slide===pitch.slides?.length-1} onClick={()=>setSlide(s=>s+1)}>Next →</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
