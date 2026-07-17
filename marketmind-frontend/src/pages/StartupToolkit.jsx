import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './StartupToolkit.css';
import { downloadSWOTPDF } from '../utils/downloadUtils';
const TOOLS = [{id:'swot',icon:'🔲',label:'SWOT Analysis'},{id:'bmc',icon:'🗂️',label:'Business Model Canvas'}];
export default function StartupToolkit() {
  const [tool, setTool] = useState('swot');
  const [ideas, setIdeas] = useState([]);
  const [selId, setSelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  useEffect(() => { api.get('/ideas').then(r=>{setIdeas(r.data.ideas);if(r.data.ideas.length)setSelId(r.data.ideas[0]._id);}).catch(()=>{}); }, []);
  useEffect(() => { setResult(null); }, [tool, selId]);
  const selIdea = ideas.find(i=>i._id===selId);
  const generate = async () => {
    if (!selIdea) return toast.error('Select an idea first');
    setLoading(true); setResult(null);
    try {
      const payload = {product:selIdea.product,industry:selIdea.industry,targetCity:selIdea.targetCity,targetCustomers:selIdea.targetCustomers,description:selIdea.description,priceMin:selIdea.priceMin,priceMax:selIdea.priceMax};
      const res = tool==='swot' ? await api.post('/ai/generate-swot',payload) : await api.post('/ai/generate-bmc',payload);
      setResult(tool==='swot'?res.data.swot:res.data.bmc);
      toast.success('Generated!');
    } catch { toast.error('Generation failed. Try again.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="toolkit-page">
      <div className="tk-header">
        <h1>🛠️ Startup Toolkit</h1>
        <p>AI-powered strategic frameworks — SWOT Analysis and Business Model Canvas for your ideas</p>
      </div>
      <div className="tool-tabs">{TOOLS.map(t=><button key={t.id} className={`tool-tab ${tool===t.id?'active':''}`} onClick={()=>setTool(t.id)}><span>{t.icon}</span><span>{t.label}</span></button>)}</div>
      <div className="tk-config">
        <div className="form-group" style={{maxWidth:320}}>
          <label>Select your business idea</label>
          <select value={selId} onChange={e=>setSelId(e.target.value)}>{ideas.map(i=><option key={i._id} value={i._id}>{i.title}</option>)}</select>
        </div>
        <button className="gen-btn" onClick={generate} disabled={loading||!selId}>{loading?<><span className="btn-spinner"/> Generating...</>:`✨ Generate ${TOOLS.find(t=>t.id===tool)?.label}`}</button>
      </div>
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={tool} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
              {tool==='swot' && selIdea && (
                <button className="swot-dl-btn" onClick={() => downloadSWOTPDF(result, selIdea)}>⬇️ Download SWOT PDF</button>
              )}
            </div>
            {tool==='swot' && <SWOTDisplay data={result}/>}
            {tool==='bmc' && <BMCDisplay data={result}/>}
          </motion.div>
        )}
      </AnimatePresence>
      {!result&&!loading&&<div className="tk-placeholder"><span>{TOOLS.find(t=>t.id===tool)?.icon}</span><p>Select an idea and click Generate</p></div>}
    </div>
  );
}
function SWOTDisplay({data}) {
  const q=[{k:'strengths',l:'Strengths',c:'#10b981',bg:'rgba(16,185,129,0.08)',icon:'💪'},{k:'weaknesses',l:'Weaknesses',c:'#ef4444',bg:'rgba(239,68,68,0.08)',icon:'⚠️'},{k:'opportunities',l:'Opportunities',c:'#6366f1',bg:'rgba(99,102,241,0.08)',icon:'🚀'},{k:'threats',l:'Threats',c:'#f59e0b',bg:'rgba(245,158,11,0.08)',icon:'🌩️'}];
  return (
    <div className="swot-grid">
      {q.map(({k,l,c,bg,icon})=>(
        <div key={k} className="swot-q" style={{background:bg,borderColor:c+'40',border:'1px solid'}}>
          <h3 style={{color:c}}>{icon} {l}</h3>
          <ul>{(data[k]||[]).map((item,i)=><li key={i}>{item}</li>)}</ul>
        </div>
      ))}
      {data.strategicRecommendations&&(
        <div className="swot-strat">
          <h3>Strategic Recommendations</h3>
          <div className="strat-grid">
            {Object.entries(data.strategicRecommendations).map(([k,v])=>(
              <div key={k} className="strat-item"><span className="strat-key">{k}</span><p>{v}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function BMCDisplay({data}) {
  const blocks=[{k:'valueProposition',l:'Value Proposition',span:2},{k:'customerSegments',l:'Customer Segments'},{k:'channels',l:'Channels'},{k:'customerRelationships',l:'Customer Relationships'},{k:'revenueStreams',l:'Revenue Streams'},{k:'keyActivities',l:'Key Activities'},{k:'keyResources',l:'Key Resources'},{k:'keyPartnerships',l:'Key Partnerships'},{k:'costStructure',l:'Cost Structure'},{k:'unfairAdvantage',l:'Unfair Advantage',span:2}];
  return (
    <div className="bmc-grid">
      {blocks.map(b=>(
        <div key={b.k} className="bmc-block" style={{gridColumn:b.span?`span ${b.span}`:undefined}}>
          <h4>{b.l}</h4>
          {Array.isArray(data[b.k])?<ul>{data[b.k]?.map((item,i)=><li key={i}>{item}</li>)}</ul>:<p>{data[b.k]}</p>}
        </div>
      ))}
    </div>
  );
}
