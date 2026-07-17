import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadLegalPDF } from '../utils/downloadUtils';
import './LegalChecker.css';

// REAL 2026 Pakistan Registration Roadmap - always shown
const PAKISTAN_ROADMAP = [
  {
    step: 1, title: 'SECP Name Clearance & Digital Signature',
    authority: 'Securities and Exchange Commission of Pakistan (SECP)',
    cost: 'PKR 200–500', timeline: '1–2 business days',
    link: 'https://eservices.secp.gov.pk',
    icon: '🏛️',
    description: 'Search and reserve your company name online. Obtain a Digital Signature Certificate (DSC) for online filing — required for all SECP submissions in 2026.',
    steps: [
      'Go to eservices.secp.gov.pk and create account',
      'Search company name availability (name must be unique)',
      'Submit name reservation form (Form-26) with PKR 200 fee',
      'Apply for Digital Signature Certificate via NIFT or any authorized CA',
      'DSC is required for all subsequent SECP online filings',
    ],
    law: 'Companies Act 2017, Section 12',
    required: true,
  },
  {
    step: 2, title: 'FBR NTN Registration (Iris Portal)',
    authority: 'Federal Board of Revenue (FBR)',
    cost: 'FREE', timeline: '1–3 business days',
    link: 'https://iris.fbr.gov.pk',
    icon: '📋',
    description: 'Register for National Tax Number (NTN) on FBR\'s IRIS portal. Mandatory for all businesses. Required to open a business bank account, file taxes, and operate legally.',
    steps: [
      'Visit iris.fbr.gov.pk and create taxpayer account',
      'Select "Registration" → "Taxpayer Registration"',
      'Upload CNIC, utility bill, and business documents',
      'For companies: upload Memorandum of Association (MOA)',
      'NTN generated instantly upon approval (usually 24–48hrs)',
      'Download NTN certificate from IRIS portal',
    ],
    law: 'Income Tax Ordinance 2001, Section 181',
    required: true,
  },
  {
    step: 3, title: 'MOA & AOA Filing (Company Registration)',
    authority: 'SECP — Company Registration Office (CRO)',
    cost: 'PKR 1,500–7,500 (based on capital)', timeline: '3–7 business days',
    link: 'https://eservices.secp.gov.pk',
    icon: '📄',
    description: 'File Memorandum of Association (MOA) and Articles of Association (AOA) to officially incorporate your company. This step legally creates your business entity.',
    steps: [
      'Draft MOA (company objectives, authorized capital, shareholders)',
      'Draft AOA (internal rules, voting rights, board structure)',
      'Complete Form-I (Incorporation Form) on SECP e-Services',
      'Pay registration fee based on authorized capital',
      'Upload DSC-signed documents to SECP portal',
      'Receive Certificate of Incorporation digitally (3–7 days)',
    ],
    law: 'Companies Act 2017, Section 14–15',
    fees: [
      { capital: 'Up to PKR 100,000', fee: 'PKR 1,500' },
      { capital: 'PKR 100,001 – 500,000', fee: 'PKR 3,500' },
      { capital: 'PKR 500,001 – 1,000,000', fee: 'PKR 5,000' },
      { capital: 'PKR 1M+', fee: 'PKR 7,500+' },
    ],
    required: true,
  },
  {
    step: 4, title: 'Business Bank Account Opening',
    authority: 'Any Scheduled Bank in Pakistan',
    cost: 'Varies (min. deposit PKR 10,000–100,000)', timeline: '3–10 business days',
    icon: '🏦',
    description: 'Open a dedicated business bank account in the company\'s name. Required by law for all registered companies to separate business and personal funds.',
    steps: [
      'Gather required documents (list below)',
      'Visit your chosen bank\'s business banking branch',
      'Submit application with SECP Certificate of Incorporation',
      'Submit MOA, AOA, Form-A (list of directors)',
      'Submit NTN certificate and CNIC copies of all directors',
      'Bank verifies documents (3–10 business days)',
      'Account activated — obtain IBAN for business transactions',
    ],
    documents: [
      'Certificate of Incorporation (SECP)',
      'MOA & AOA (certified copy)',
      'Form-A (list of directors)',
      'NTN Certificate',
      'CNIC copies of all directors/shareholders',
      'Registered office address proof (utility bill)',
      'Board resolution for account opening',
    ],
    required: true,
  },
  {
    step: 5, title: 'Sales Tax Registration (if applicable)',
    authority: 'FBR / Provincial Revenue Authority (PRA/SRB/KPRA/BRA)',
    cost: 'FREE', timeline: '2–5 business days',
    link: 'https://iris.fbr.gov.pk',
    icon: '💸',
    description: 'Required if annual turnover exceeds PKR 8 million (federal) or PKR 4.8 million (provincial services). Register on IRIS portal under Sales Tax.',
    steps: [
      'Login to IRIS portal',
      'Click "Registration" → "Sales Tax Registration"',
      'Select applicable authority (FBR for goods, PRA/SRB/KPRA/BRA for services)',
      'Upload business documents and NTN',
      'Receive Sales Tax Registration Number (STRN)',
    ],
    law: 'Sales Tax Act 1990 / Provincial Finance Acts',
    threshold: 'Federal: PKR 8M/year | Provincial: PKR 4.8M/year',
    required: false,
  },
  {
    step: 6, title: 'Trade License (Local Government)',
    authority: 'District Municipal Corporation / City Council',
    cost: 'PKR 2,000–15,000 (varies by city)', timeline: '5–15 business days',
    icon: '📜',
    description: 'Physical business premises require a trade license from local municipal authority. Required before opening shop, office, or any public-facing location.',
    steps: [
      'Visit your District Municipal Corporation (DMC) / City Council office',
      'Fill trade license application form',
      'Submit CNIC, NTN, rental agreement / property documents',
      'Pay applicable fee (varies by business type and area)',
      'Inspection of premises may be required',
      'License issued — renew annually',
    ],
    required: true,
  },
];

const INDUSTRY_EXTRAS = {
  'Food & Beverage': [
    { title: 'PSQCA Food Safety License', authority: 'Pakistan Standards & Quality Control Authority', cost: 'PKR 5,000–25,000', required: true, link: 'https://psqca.com.pk' },
    { title: 'Punjab Food Authority (PFA) Registration', authority: 'PFA / KPKFSA / SFA (provincial)', cost: 'PKR 3,000–10,000', required: true },
    { title: 'Health Department NOC', authority: 'District Health Authority', cost: 'PKR 1,000–5,000', required: true },
  ],
  'Health & Wellness': [
    { title: 'Drug Regulatory Authority (DRAP) License', authority: 'DRAP', cost: 'PKR 10,000–50,000', required: true, link: 'https://dra.gov.pk' },
    { title: 'Pakistan Medical & Dental Council (PMDC)', authority: 'PMDC', cost: 'Varies', required: false },
  ],
  'Education & Training': [
    { title: 'HEC Registration (if degree programs)', authority: 'Higher Education Commission', cost: 'PKR 50,000+', required: false, link: 'https://hec.gov.pk' },
    { title: 'Private School Registration', authority: 'Provincial Education Department', cost: 'PKR 5,000–20,000', required: true },
  ],
  'Finance & FinTech': [
    { title: 'State Bank of Pakistan (SBP) License', authority: 'SBP', cost: 'PKR 100,000+', required: true, link: 'https://sbp.org.pk' },
    { title: 'SECP EMI License (for e-money)', authority: 'SECP', cost: 'PKR 5,000,000 min capital', required: false },
  ],
};

export default function LegalChecker() {
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [industry, setIndustry] = useState('Food & Beverage');
  const [city, setCity] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [expanded, setExpanded] = useState({ 0: true });

  useEffect(() => {
    api.get('/ideas').then(r => setIdeas(r.data.ideas || [])).catch(() => {});
  }, []);

  const autofill = (id) => {
    const idea = ideas.find(i => i._id === id);
    if (idea) { setSelectedIdea(idea); setIndustry(idea.industry || 'Food & Beverage'); setCity(idea.targetCity || ''); }
  };

  const getAIChecklist = async () => {
    if (!selectedIdea && !city) return toast.error('Select an idea or enter a city first');
    setAiLoading(true); setAiData(null);
    try {
      const res = await api.post('/ai/legal-check', {
        product: selectedIdea?.product || industry, industry, targetCity: city || selectedIdea?.targetCity || 'Karachi'
      });
      setAiData(res.data);
      toast.success('AI compliance check complete!');
    } catch { toast.error('AI check failed — showing standard roadmap'); }
    finally { setAiLoading(false); }
  };

  const toggle = (key) => setCheckedItems(p => ({ ...p, [key]: !p[key] }));
  const toggleExpand = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const totalSteps = PAKISTAN_ROADMAP.length;
  const doneCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((doneCount / totalSteps) * 100);

  const extras = INDUSTRY_EXTRAS[industry] || [];

  const mockIdea = selectedIdea || { product: industry, targetCity: city || 'Karachi' };

  return (
    <div className="legal-page">
      <div className="lg-header">
        <div>
          <h1>⚖️ Legal & Compliance Checker</h1>
          <p>Complete 2026 Pakistan Business Registration Roadmap — SECP, FBR, NTN, MOA/AOA & more</p>
        </div>
        <button className="dl-btn-legal" onClick={() => downloadLegalPDF({ registrations: PAKISTAN_ROADMAP, licenses: extras, totalEstimatedCost: 'PKR 25,000–75,000', timeToLegal: '3–6 weeks' }, mockIdea)}>
          ⬇️ Download PDF Checklist
        </button>
      </div>

      {/* Setup bar */}
      <div className="lg-setup">
        {ideas.length > 0 && (
          <div className="lg-field">
            <label>Autofill from idea</label>
            <select onChange={e => autofill(e.target.value)} defaultValue="">
              <option value="">— Select idea —</option>
              {ideas.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
            </select>
          </div>
        )}
        <div className="lg-field">
          <label>Industry</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}>
            {['Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="lg-field">
          <label>City</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lahore" />
        </div>
        <button className="lg-ai-btn" onClick={getAIChecklist} disabled={aiLoading}>
          {aiLoading ? <><span className="spinner-sm"/>Loading...</> : '🤖 AI Custom Check'}
        </button>
      </div>

      {/* Progress */}
      <div className="lg-progress-card">
        <div className="lgp-top">
          <div>
            <div className="lgp-title">Registration Progress</div>
            <div className="lgp-sub">{doneCount} of {totalSteps} core steps completed</div>
          </div>
          <div className="lgp-pct" style={{color: progress >= 100 ? '#10b981' : progress > 50 ? '#f59e0b' : '#6366f1'}}>{progress}%</div>
        </div>
        <div className="lgp-bar-bg"><div className="lgp-bar-fill" style={{width:`${progress}%`,background: progress >= 100 ? '#10b981' : '#6366f1'}}/></div>
        <div className="lgp-summary">
          <span>Est. Total Cost: <strong>PKR 25,000 – 75,000</strong></span>
          <span>Est. Time: <strong>3–6 weeks</strong></span>
          <span>Legal Entity: <strong>SMC / Private Limited</strong></span>
        </div>
      </div>

      {/* AI result if available */}
      {aiData?.warnings?.length > 0 && (
        <div className="ai-warnings">
          {aiData.warnings.map((w,i) => <div key={i} className="lg-warn">⚠️ {w}</div>)}
        </div>
      )}

      {/* Main roadmap */}
      <div className="lg-roadmap-title">📋 2026 Pakistan Business Registration Roadmap</div>

      {PAKISTAN_ROADMAP.map((item, idx) => {
        const key = `step-${idx}`;
        const done = !!checkedItems[key];
        const open = !!expanded[idx];
        return (
          <motion.div key={idx} className={`lg-step-card ${done ? 'done' : ''}`}
            initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}}>
            <div className="lsc-header" onClick={() => toggleExpand(idx)}>
              <div className="lsc-left">
                <div className="lsc-num" style={{background: done ? '#10b981' : '#6366f1'}}>{done ? '✓' : item.step}</div>
                <div>
                  <div className="lsc-title">{item.icon} {item.title}</div>
                  <div className="lsc-meta">{item.authority} · {item.cost} · ⏱ {item.timeline}</div>
                </div>
              </div>
              <div className="lsc-right">
                <span className={`lsc-badge ${item.required ? 'req' : 'opt'}`}>{item.required ? '🔴 Required' : '🟡 Optional'}</span>
                <span className="lsc-expand">{open ? '▲' : '▼'}</span>
              </div>
            </div>

            <AnimatePresence>
              {open && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden'}}>
                  <div className="lsc-body">
                    <p className="lsc-desc">{item.description}</p>
                    {item.law && <div className="lsc-law">📖 Legal basis: {item.law}</div>}
                    {item.threshold && <div className="lsc-threshold">📊 Threshold: {item.threshold}</div>}

                    <div className="lsc-steps-title">Step-by-step:</div>
                    <ol className="lsc-steps-list">
                      {item.steps.map((s,i) => <li key={i}>{s}</li>)}
                    </ol>

                    {item.fees && (
                      <div className="lsc-fees">
                        <strong>Fee Schedule:</strong>
                        <div className="fees-grid">
                          {item.fees.map((f,i) => (
                            <div key={i} className="fee-row">
                              <span>{f.capital}</span><span className="fee-amt">{f.fee}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.documents && (
                      <div className="lsc-docs">
                        <strong>Required Documents:</strong>
                        <ul>{item.documents.map((d,i) => <li key={i}>{d}</li>)}</ul>
                      </div>
                    )}

                    <div className="lsc-footer">
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="lsc-link">🔗 Official Portal →</a>}
                      <label className="lsc-check-wrap">
                        <input type="checkbox" checked={done} onChange={() => toggle(key)} />
                        <span>{done ? '✅ Completed' : 'Mark as done'}</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Industry-specific extras */}
      {extras.length > 0 && (
        <div className="lg-extras">
          <div className="lg-roadmap-title">🏭 {industry} — Additional Requirements</div>
          {extras.map((e,i) => (
            <div key={i} className={`lg-step-card ${checkedItems[`extra-${i}`] ? 'done' : ''}`}>
              <div className="lsc-header">
                <div className="lsc-left">
                  <div className="lsc-num" style={{background: checkedItems[`extra-${i}`] ? '#10b981' : '#f59e0b'}}>
                    {checkedItems[`extra-${i}`] ? '✓' : '+'}</div>
                  <div>
                    <div className="lsc-title">{e.title}</div>
                    <div className="lsc-meta">{e.authority} · {e.cost}</div>
                  </div>
                </div>
                <div className="lsc-right">
                  <span className={`lsc-badge ${e.required ? 'req' : 'opt'}`}>{e.required ? '🔴 Required' : '🟡 Optional'}</span>
                  <label className="lsc-check-wrap-sm">
                    <input type="checkbox" checked={!!checkedItems[`extra-${i}`]} onChange={() => toggle(`extra-${i}`)} />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax section */}
      <div className="lg-tax-section">
        <div className="lg-roadmap-title">💸 2026 Tax Obligations (Pakistan)</div>
        <div className="tax-info-grid">
          {[
            { name: 'Income Tax (SME)', rate: '20–29%', auth: 'FBR', note: 'Reduced rate for SMEs under PKR 100M turnover' },
            { name: 'Sales Tax (Goods)', rate: '18%', auth: 'FBR', note: 'Applies if turnover > PKR 8M/year' },
            { name: 'Provincial Services Tax', rate: '13–16%', auth: 'PRA/SRB/KPRA', note: 'Varies by province' },
            { name: 'Withholding Tax', rate: '3–7%', auth: 'FBR', note: 'On payments to suppliers and contractors' },
            { name: 'Professional Tax', rate: 'PKR 200–10,000', auth: 'Provincial', note: 'Annual, paid to provincial revenue authority' },
            { name: 'EOBI Contribution', rate: '5% employer + 1% employee', auth: 'EOBI', note: 'Required if you have permanent employees' },
          ].map((t,i) => (
            <div key={i} className="tax-item">
              <div className="tax-name">{t.name}</div>
              <div className="tax-rate">{t.rate}</div>
              <div className="tax-auth">{t.auth}</div>
              <div className="tax-note">{t.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
