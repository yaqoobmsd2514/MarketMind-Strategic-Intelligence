import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './NewIdea.css';
const INDUSTRIES = ['Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech','Logistics & Delivery','Agriculture & AgriTech','Fashion & Apparel','Beauty & Personal Care','Events & Entertainment','Travel & Hospitality','Automotive Services','Media & Content','Construction & Real Estate'];
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad','Mardan','Sukkur','Larkana'];
const STEPS = ['Basics','Market','Financials','Review'];
export default function NewIdea() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title:'',description:'',product:'',industry:'',targetCity:'',targetCountry:'Pakistan',targetCustomers:'',priceMin:'',priceMax:'',currency:'PKR',businessModel:'b2c',stage:'idea',tags:'',isPublic:false });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const nextStep = () => {
    if(step===0&&(!form.title||!form.product||!form.industry||!form.description)){toast.error('Fill all required fields');return;}
    if(step===1&&(!form.targetCity||!form.targetCustomers)){toast.error('Fill all required fields');return;}
    if(step===2&&(!form.priceMin||!form.priceMax)){toast.error('Enter your price range');return;}
    setStep(s=>s+1);
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ideas', {...form,priceMin:Number(form.priceMin),priceMax:Number(form.priceMax),tags:form.tags?form.tags.split(',').map(t=>t.trim()):[]});
      toast.success('Idea saved! Running analysis...');
      navigate(`/ideas/${res.data.idea._id}/analysis`);
    } catch(err) { toast.error(err.response?.data?.error||'Failed to save idea'); }
    finally { setLoading(false); }
  };
  return (
    <div className="new-idea-page">
      <div className="ni-header"><h1>Analyze a New Idea</h1><p>Tell us about your business idea and get full market intelligence.</p></div>
      <div className="ni-steps">
        {STEPS.map((s,i)=>(
          <div key={i} className={`ni-step ${i<step?'done':i===step?'active':''}`}>
            <div className="ni-step-circle">{i<step?'✓':i+1}</div><span>{s}</span>
            {i<STEPS.length-1&&<div className="ni-step-line"/>}
          </div>
        ))}
      </div>
      <div className="ni-card">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.2}}>
            {step===0&&(
              <div>
                <h2>What's your idea?</h2>
                <div className="ni-field" ><label>Idea Title *</label><input placeholder="e.g. Coffee Shop in Lahore for Students" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
                <div className="ni-grid" >
                  <div className="ni-field"><label>Product / Service *</label><input placeholder="e.g. Coffee Shop" value={form.product} onChange={e=>set('product',e.target.value)}/></div>
                  <div className="ni-field"><label>Industry *</label><select value={form.industry} onChange={e=>set('industry',e.target.value)}><option value="">Select industry</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select></div>
                </div>
                <div className="ni-field" ><label>Description *</label><textarea placeholder="Describe your business idea in detail..." value={form.description} onChange={e=>set('description',e.target.value)} rows={4}/></div>
                <div className="ni-grid">
                  <div className="ni-field"><label>Business Model</label><select value={form.businessModel} onChange={e=>set('businessModel',e.target.value)}><option value="b2c">B2C</option><option value="b2b">B2B</option><option value="marketplace">Marketplace</option><option value="saas">SaaS</option><option value="other">Other</option></select></div>
                  <div className="ni-field"><label>Current Stage</label><select value={form.stage} onChange={e=>set('stage',e.target.value)}><option value="idea">Just an Idea</option><option value="validation">Validating</option><option value="mvp">Building MVP</option><option value="growth">Growing</option><option value="scale">Scaling</option></select></div>
                </div>
              </div>
            )}
            {step===1&&(
              <div>
                <h2>Who's your market?</h2>
                <div className="ni-grid" >
                  <div className="ni-field"><label>Target City *</label><select value={form.targetCity} onChange={e=>set('targetCity',e.target.value)}><option value="">Select city</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}<option value="Other">Other</option></select></div>
                  <div className="ni-field"><label>Country</label><input value={form.targetCountry} onChange={e=>set('targetCountry',e.target.value)}/></div>
                </div>
                <div className="ni-field" ><label>Target Customers *</label><input placeholder="e.g. University students aged 18-25" value={form.targetCustomers} onChange={e=>set('targetCustomers',e.target.value)}/></div>
                <div className="ni-field" ><label>Tags (comma separated)</label><input placeholder="e.g. food, students, affordable" value={form.tags} onChange={e=>set('tags',e.target.value)}/></div>
                <label className="checkbox-label"><input type="checkbox" checked={form.isPublic} onChange={e=>set('isPublic',e.target.checked)}/><span>Make this idea public in Explore section</span></label>
              </div>
            )}
            {step===2&&(
              <div>
                <h2>Pricing & Financials</h2>
                <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:'1.5rem'}}>Provide your expected price range. This helps calculate revenue projections.</p>
                <div className="ni-grid" >
                  <div className="ni-field"><label>Minimum Price (PKR) *</label><input type="number" placeholder="e.g. 200" value={form.priceMin} onChange={e=>set('priceMin',e.target.value)} min="0"/></div>
                  <div className="ni-field"><label>Maximum Price (PKR) *</label><input type="number" placeholder="e.g. 800" value={form.priceMax} onChange={e=>set('priceMax',e.target.value)} min="0"/></div>
                </div>
                <div className="ni-field"><label>Currency</label><select value={form.currency} onChange={e=>set('currency',e.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option></select></div>
                {form.priceMin&&form.priceMax&&<div className="price-preview">Price range: <strong>{Number(form.priceMin).toLocaleString()} – {Number(form.priceMax).toLocaleString()} {form.currency}</strong></div>}
              </div>
            )}
            {step===3&&(
              <div>
                <h2>Review your idea</h2>
                <div className="review-list">
                  {[['Title',form.title],['Product',form.product],['Industry',form.industry],['City',form.targetCity],['Customers',form.targetCustomers],['Price Range',`${form.priceMin} – ${form.priceMax} ${form.currency}`],['Model',form.businessModel.toUpperCase()],['Stage',form.stage]].map(([l,v],i)=>(
                    <div key={i} className="review-row"><span>{l}</span><span>{v}</span></div>
                  ))}
                </div>
                <div style={{marginTop:'1rem',fontSize:14,color:'var(--text-secondary)',lineHeight:1.6}}><strong style={{color:'var(--text-muted)',fontSize:12,textTransform:'uppercase',letterSpacing:'0.5px'}}>Description</strong><br/>{form.description}</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="ni-nav">
          {step>0&&<button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Back</button>}
          <div style={{flex:1}}/>
          {step<STEPS.length-1?<button className="btn-next" onClick={nextStep}>Continue →</button>
          :<button className="btn-submit" onClick={handleSubmit} disabled={loading}>{loading?<><span className="btn-spinner"/> Saving...</>:'⚡ Save & Analyze Now'}</button>}
        </div>
      </div>
    </div>
  );
}
