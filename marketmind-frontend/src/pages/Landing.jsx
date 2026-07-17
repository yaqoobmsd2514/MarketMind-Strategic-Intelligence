import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import './Landing.css';

const ROTATING = ['Turn your idea into a business.','Know your market before you invest.','Get funded with a perfect pitch deck.','Outthink competition from day one.'];
const STATS = [{ val:'500+', label:'Ideas Analyzed' },{ val:'12', label:'AI Tools' },{ val:'2 min', label:'To Full Report' },{ val:'Free', label:'To Get Started' }];
const FEATURES = [
  { icon:'⚡', title:'AI Market Analysis', desc:'Scores your idea on demand, competition & viability. Get strengths, risks, opportunities in under 2 minutes.', color:'#6366f1', badge:'Most Used' },
  { icon:'📈', title:'Financial Simulator', desc:'Drag sliders to model growth rate & costs. See live Year 1–3 projections update instantly.', color:'#10b981', badge:'Interactive' },
  { icon:'🗺️', title:'Live Competitor Map', desc:'See real competitors in your city on an interactive map. Powered by OpenStreetMap + AI intelligence.', color:'#f59e0b', badge:'Real Data' },
  { icon:'🚀', title:'Pitch Deck Generator', desc:'10-slide investor-ready pitch deck auto-generated from your idea. Download as PDF instantly.', color:'#ec4899', badge:'Investor Ready' },
  { icon:'💰', title:'Funding Finder', desc:'Discover real Pakistan funding: SMEDA, NIC, i2i, Karandaaz and more with match scores.', color:'#8b5cf6', badge:'Pakistan-First' },
  { icon:'⚖️', title:'Legal Roadmap 2026', desc:'Complete SECP, FBR NTN, MOA/AOA registration guide with official links and cost estimates.', color:'#06b6d4', badge:'Up to Date' },
  { icon:'🏷️', title:'Name Generator', desc:'10 scored business names with taglines, domain suggestions and brand analysis.', color:'#f59e0b', badge:'Creative AI' },
  { icon:'📣', title:'Marketing Plan', desc:'Full digital strategy: channels, content calendar, SEO keywords, influencer tactics for Pakistan.', color:'#10b981', badge:'Actionable' },
];
const TESTIMONIALS = [
  { name:'Ali Hassan', role:'Founder, FoodTech Lahore', text:'MarketMind gave me a complete market analysis in 2 minutes. The competitor map showed me exactly where to open my restaurant. Highly recommend.', avatar:'A' },
  { name:'Fatima Sheikh', role:'Student Entrepreneur, Karachi', text:'I used it for my 4th year project. The pitch deck generator alone saved me 3 days of work. My teacher was impressed!', avatar:'F' },
  { name:'Omar Malik', role:'Tech Startup, Islamabad', text:'The legal checker helped me understand SECP registration properly. The funding finder found 6 grants I didn\'t know existed.', avatar:'O' },
];

export default function Landing() {
  const [ti, setTi] = useState(0);
  const [product, setProduct] = useState('');
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const iv = setInterval(() => setTi(i => (i+1)%ROTATING.length), 3200);
    return () => clearInterval(iv);
  }, []);

  const handleDemo = async (e) => {
    e.preventDefault();
    if (!product || !city) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/validate-idea-quick', { product, city });
      setResult(res.data.result);
    } catch { setError('Could not analyze right now. Sign up for full access.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <Link to="/" className="land-logo">
            <div className="land-logo-icon">M</div>
            <span>MarketMind</span>
          </Link>
          <div className="land-nav-links">
            <Link to="/explore">Explore</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/login" className="land-signin">Sign In</Link>
            <Link to="/register" className="land-cta-btn">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="hero-bg-glow"/>
        <motion.div className="hero-badge" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
          <span className="badge-pulse"/>
          AI-Powered Startup Intelligence · Made for Pakistan Entrepreneurs
        </motion.div>
        <h1 className="hero-h1">
          <AnimatePresence mode="wait">
            <motion.span key={ti} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} transition={{duration:0.4}}>
              {ROTATING[ti]}
            </motion.span>
          </AnimatePresence>
        </h1>
        <p className="hero-sub">
          From <strong>idea validation</strong> → <strong>market analysis</strong> → <strong>competitor mapping</strong> → <strong>investor pitch</strong> — all in one platform, powered by AI, built for Pakistan.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="hero-primary-btn">Start Analyzing Free →</Link>
          <Link to="/explore" className="hero-ghost-btn">See Live Examples ↗</Link>
        </div>

        {/* Demo box */}
        <motion.div className="demo-card" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
          <p className="demo-title">🔍 Try it right now — no account needed</p>
          <form onSubmit={handleDemo} className="demo-form">
            <input className="demo-input" placeholder="Your business idea (e.g. Coffee Shop)" value={product} onChange={e=>setProduct(e.target.value)}/>
            <input className="demo-input" placeholder="Target city (e.g. Lahore)" value={city} onChange={e=>setCity(e.target.value)}/>
            <button type="submit" className="demo-submit" disabled={loading}>
              {loading ? <span className="btn-spinner"/> : 'Analyze →'}
            </button>
          </form>
          {error && <p style={{color:'#f87171',fontSize:13,marginTop:8}}>{error}</p>}
          <AnimatePresence>
            {result && (
              <motion.div className="demo-result" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                {[{l:'Market Demand',v:result.demandScore,c:'#10b981'},{l:'Viability',v:result.viabilityScore,c:'#6366f1'},{l:'Competition',v:result.competitionScore,c:'#f59e0b'}].map(b=>(
                  <div key={b.l} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4,color:'var(--text-secondary)'}}>
                      <span>{b.l}</span><span style={{color:b.c,fontWeight:700}}>{b.v}/100</span>
                    </div>
                    <div style={{height:6,background:'rgba(255,255,255,.07)',borderRadius:3,overflow:'hidden'}}>
                      <motion.div style={{height:'100%',background:b.c,borderRadius:3}} initial={{width:0}} animate={{width:`${b.v}%`}} transition={{duration:.8}}/>
                    </div>
                  </div>
                ))}
                {result.oneLineVerdict && <p className="demo-verdict">"{result.oneLineVerdict}"</p>}
                <Link to="/register" className="demo-signup-cta">Get Full Analysis — Free →</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="land-stats">
        {STATS.map((s,i)=>(
          <motion.div key={i} className="stat-item" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section className="land-features">
        <div className="section-label">Everything You Need</div>
        <h2 className="section-title">One Platform. Full Startup Intelligence.</h2>
        <p className="section-sub">Stop using 10 different tools. MarketMind has everything a Pakistan entrepreneur needs to go from idea to launch.</p>
        <div className="features-grid">
          {FEATURES.map((f,i)=>(
            <motion.div key={i} className="feat-card" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.05}} whileHover={{y:-4}}>
              <div className="feat-top">
                <div className="feat-icon" style={{background:f.color+'1a',color:f.color}}>{f.icon}</div>
                <span className="feat-badge" style={{background:f.color+'18',color:f.color}}>{f.badge}</span>
              </div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="land-how">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">From Idea to Launch in 4 Steps</h2>
        <div className="steps-row">
          {[
            { n:'01', icon:'💡', title:'Enter Your Idea', desc:'Type your business name, target city, and target customers. Takes 30 seconds.' },
            { n:'02', icon:'⚡', title:'Get AI Analysis', desc:'AI scores your market demand, viability, and competition. See full financial projections.' },
            { n:'03', icon:'🛠️', title:'Use the Tools', desc:'Generate your pitch deck, SWOT, funding sources, legal checklist, and marketing plan.' },
            { n:'04', icon:'📥', title:'Download Everything', desc:'Export professional PDFs of your full business report, pitch deck, and legal checklist.' },
          ].map((s,i)=>(
            <motion.div key={i} className="step-item" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}>
              <div className="step-num">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <h4 className="step-title">{s.title}</h4>
              <p className="step-desc">{s.desc}</p>
              {i < 3 && <div className="step-arrow">›</div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="land-testimonials">
        <div className="section-label">What Entrepreneurs Say</div>
        <h2 className="section-title">Trusted by Pakistan's Next Generation of Founders</h2>
        <div className="testi-grid">
          {TESTIMONIALS.map((t,i)=>(
            <motion.div key={i} className="testi-card" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}>
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">"{t.text}"</p>
              <div className="testi-author">
                <div className="testi-av">{t.avatar}</div>
                <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="land-final-cta">
        <div className="cta-glow"/>
        <h2>Ready to Build Your Dream Business?</h2>
        <p>Join hundreds of Pakistani entrepreneurs using MarketMind to validate, analyze and launch smarter.</p>
        <Link to="/register" className="hero-primary-btn" style={{fontSize:16,padding:'16px 40px'}}>Start for Free — No Credit Card →</Link>
        <p style={{marginTop:14,fontSize:13,color:'var(--text-muted)'}}>Takes 2 minutes to get your first market analysis</p>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="land-logo-icon" style={{width:28,height:28,fontSize:13}}>M</div>
            <span style={{fontWeight:700,fontSize:15}}>MarketMind</span>
          </div>
          <div className="footer-links">
            <Link to="/explore">Explore</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Get Started</Link>
          </div>
          <p className="footer-copy">© 2025 MarketMind · AI-powered startup intelligence for Pakistan</p>
        </div>
      </footer>
    </div>
  );
}
