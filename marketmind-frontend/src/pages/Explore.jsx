import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import './Explore.css';

const INDUSTRIES = ['All','Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech'];

export default function Explore() {
  const [ideas, setIdeas] = useState([]);
  const [webResults, setWebResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(false);
  const [industry, setIndustry] = useState('All');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('community');
  const [webError, setWebError] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => { fetchIdeas('', 'All'); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIdeas(search, industry);
      if (search.trim().length >= 2) fetchWebResults(search);
      else { setWebResults([]); setTab('community'); }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [search, industry]);

  const fetchIdeas = async (q, ind) => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (ind && ind !== 'All') params.industry = ind;
      const res = await api.get('/ideas/explore', { params });
      setIdeas(res.data.ideas || []);
    } catch { setIdeas([]); }
    finally { setLoading(false); }
  };

  const fetchWebResults = async (q) => {
    setWebLoading(true);
    setWebError(false);
    try {
      const res = await api.get('/market/trends', { params: { product: q } });
      const articles = res.data.articles || [];
      setWebResults(articles);
      if (articles.length > 0) setTab('web');
    } catch {
      setWebError(true);
      setWebResults([]);
    }
    finally { setWebLoading(false); }
  };

  const vColor = s => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="explore-page">
      <div className="explore-hero">
        <h1>Explore Ideas</h1>
        <p>Discover community business ideas — or search for real market news & trends from across Pakistan</p>
        <div className="explore-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search businesses, products, cities... (searches web too!)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          {(loading || webLoading) && <div className="search-loader" />}
        </div>
        {search.length >= 2 && (
          <p style={{fontSize:12,color:'var(--text-muted,#64748b)',marginTop:8}}>
            {webLoading ? '🌐 Searching web for market insights...' : webResults.length > 0 ? `✅ Found ${webResults.length} web articles` : ''}
          </p>
        )}
      </div>

      <div className="explore-filters">
        {INDUSTRIES.map(ind => (
          <button key={ind} className={`filter-pill ${industry === ind ? 'active' : ''}`} onClick={() => setIndustry(ind)}>{ind}</button>
        ))}
      </div>

      {webResults.length > 0 && (
        <div className="explore-tabs">
          <button className={`etab ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>
            🇵🇰 Community Ideas {ideas.length > 0 && `(${ideas.length})`}
          </button>
          <button className={`etab ${tab === 'web' ? 'active' : ''}`} onClick={() => setTab('web')}>
            🌐 Web Insights ({webResults.length})
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === 'community' ? (
          <motion.div key="community" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {loading ? (
              <div className="explore-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="explore-skeleton" />)}</div>
            ) : ideas.length === 0 ? (
              <div className="explore-empty">
                <span>🌐</span>
                <h3>{search ? `No community ideas for "${search}"` : 'No public ideas yet'}</h3>
                <p>{webResults.length > 0 ? 'Check the Web Insights tab for market news!' : 'Be the first to share your idea!'}</p>
                <Link to="/ideas/new" className="empty-cta">Analyze & Share Your Idea →</Link>
              </div>
            ) : (
              <div className="explore-grid">
                {ideas.map((idea, i) => (
                  <motion.div key={idea._id} className="explore-card"
                    initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                    transition={{delay:i*0.05}} whileHover={{y:-4}}>
                    <div className="ec-top">
                      <div className="ec-industry">{idea.industry}</div>
                      {idea.analysis?.viabilityScore && (
                        <div className="ec-score" style={{color:vColor(idea.analysis.viabilityScore),borderColor:vColor(idea.analysis.viabilityScore)+'40'}}>
                          {idea.analysis.viabilityScore}/100
                        </div>
                      )}
                    </div>
                    <h3 className="ec-title">{idea.title}</h3>
                    <p className="ec-desc">{idea.description?.slice(0,110)}{(idea.description?.length||0)>110?'...':''}</p>
                    <div className="ec-meta">
                      <span>📍 {idea.targetCity}</span>
                      <span>👥 {idea.targetCustomers?.slice(0,35)}{(idea.targetCustomers?.length||0)>35?'...':''}</span>
                    </div>
                    <div className="ec-footer">
                      <div className="ec-user">
                        <div className="ec-avatar">{idea.user?.name?.charAt(0)||'A'}</div>
                        <span>{idea.user?.name||'Anonymous'}</span>
                      </div>
                      <div className="ec-likes">❤️ {idea.likes?.length||0}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="web" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <p style={{fontSize:13,color:'var(--text-muted,#64748b)',marginBottom:16,paddingLeft:4}}>
              📰 Real market news & trends for <strong>"{search}"</strong> from across the web
            </p>
            <div className="web-results-grid">
              {webResults.map((article, i) => (
                <motion.a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  className="web-card"
                  initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                  transition={{delay:i*0.04}} whileHover={{y:-4}}>
                  {article.urlToImage && (
                    <img src={article.urlToImage} alt="" className="wc-img" onError={e => e.target.style.display='none'} />
                  )}
                  <div className="wc-body">
                    <div className="wc-source">📰 {article.source} · {new Date(article.publishedAt).toLocaleDateString('en-PK')}</div>
                    <h3 className="wc-title">{article.title}</h3>
                    <p className="wc-desc">{article.description?.slice(0,140)}{(article.description?.length||0)>140?'...':''}</p>
                    <div className="wc-link">Read full article →</div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="explore-cta">
        <h2>Have a business idea?</h2>
        <p>Get full AI market analysis — competitor map, financial projections, customer personas — in under 2 minutes.</p>
        <Link to="/register" style={{display:'inline-block',padding:'14px 32px',background:'var(--primary,#6366f1)',color:'#fff',borderRadius:'12px',fontWeight:700,fontSize:16,textDecoration:'none'}}>
          Start Analyzing Free →
        </Link>
      </div>
    </div>
  );
}
