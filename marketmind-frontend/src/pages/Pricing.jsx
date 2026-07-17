import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Pricing.css';

const PLANS = [
  {
    name:'Free', price:'PKR 0', period:'/forever', color:'#64748b',
    desc:'Perfect for exploring and testing your first idea.',
    features:['3 business ideas','Basic AI analysis','Competitor map','Name generator','Explore ideas'],
    missing:['Revenue simulator','PDF downloads','Marketing plan','Legal checker','Funding finder','AI Mentor chat','Pitch deck generator'],
    cta:'Get Started Free', link:'/register', popular:false,
  },
  {
    name:'Pro', price:'PKR 999', period:'/month', color:'#6366f1',
    desc:'Everything you need to validate and launch your startup.',
    features:['Unlimited ideas','Full AI market analysis','Interactive revenue simulator','PDF downloads (all)','Marketing plan generator','Legal compliance checker','Funding finder (Pakistan)','AI Mentor chat (unlimited)','Investor pitch deck','SWOT & Business Model Canvas','Competitor AI intelligence','Priority support'],
    missing:[],
    cta:'Start Pro Free 7 Days', link:'/register', popular:true,
  },
  {
    name:'Enterprise', price:'Custom', period:'pricing', color:'#10b981',
    desc:'For incubators, universities, and accelerators.',
    features:['Everything in Pro','Unlimited team members','White-label branding','API access','Bulk idea analysis','Custom reporting','Dedicated account manager','Training for your team','SLA guarantee'],
    missing:[],
    cta:'Contact Us', link:'mailto:hello@marketmind.pk', popular:false,
  },
];

const FAQ = [
  { q:'Is MarketMind really free?', a:'Yes — the Free tier is free forever with no credit card required. You get 3 ideas and core analysis features.' },
  { q:'Do I need technical knowledge?', a:'Not at all. MarketMind is built for entrepreneurs of all backgrounds. If you can type your idea, you can get a full analysis.' },
  { q:'Is my data secure?', a:'Yes. All your ideas and analysis data are stored securely and never shared with third parties.' },
  { q:'Can I cancel anytime?', a:'Yes. Pro subscriptions can be cancelled at any time with no penalty. Your data remains accessible.' },
  { q:'Do you support all Pakistan cities?', a:'Yes. MarketMind has data for all major Pakistan cities including Karachi, Lahore, Islamabad, Peshawar, Quetta, Multan, Faisalabad, and more.' },
];

export default function Pricing() {
  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <div className="section-label" style={{justifyContent:'center',display:'flex'}}>Pricing</div>
        <h1>Simple, Honest Pricing</h1>
        <p>Start free. Upgrade when you need more. Built for Pakistani entrepreneurs.</p>
      </div>

      <div className="plans-grid">
        {PLANS.map((plan, i) => (
          <motion.div key={i} className={`plan-card ${plan.popular?'popular':''}`}
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.1}}>
            {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
            <div className="plan-header">
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price-row">
                <span className="plan-price" style={{color:plan.color}}>{plan.price}</span>
                <span className="plan-period">{plan.period}</span>
              </div>
              <p className="plan-desc">{plan.desc}</p>
            </div>
            <Link to={plan.link} className="plan-cta" style={plan.popular?{background:`linear-gradient(135deg,${plan.color},#8b5cf6)`}:{borderColor:plan.color+'40',color:plan.color}}>
              {plan.cta}
            </Link>
            <div className="plan-features">
              {plan.features.map((f,j) => (
                <div key={j} className="pf-item pf-yes"><span>✓</span>{f}</div>
              ))}
              {plan.missing.map((f,j) => (
                <div key={j} className="pf-item pf-no"><span>✗</span>{f}</div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {FAQ.map((f,i) => (
            <div key={i} className="faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-bottom-cta">
        <h2>Ready to build your dream business?</h2>
        <p>Start free today. No credit card required.</p>
        <Link to="/register" className="hero-primary-btn">Start Analyzing Free →</Link>
      </div>
    </div>
  );
}
