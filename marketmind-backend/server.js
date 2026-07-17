require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ===== INLINE AUTH MIDDLEWARE =====
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) { return res.status(401).json({ error: 'Not authorized' }); }
};

// ===== GROQ AI HELPER (FREE) =====
async function callGemini(prompt) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
        },
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    const aiError = err.response?.data?.error?.message || err.message;
    console.error('Groq API Error:', aiError);
    throw new Error('AI failed: ' + aiError);
  }
}
function extractJSON(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found');
  return JSON.parse(match[0]);
}

// ===== HEALTH =====
app.get('/api/health', (req, res) => res.json({ status: 'ok', port: process.env.PORT || 4000 }));

// ===== AUTH ROUTES =====
app.use('/api/auth', require('./routes/auth'));

// ===== IDEA ROUTES =====
app.use('/api/ideas', require('./routes/ideas'));

// ===== USER ROUTES =====
app.use('/api/users', require('./routes/users'));

// ===== MARKET ROUTES =====
app.use('/api/market', require('./routes/market'));

// ===== PITCH ROUTES =====
app.use('/api/pitch', require('./routes/pitch'));

// ===== ANALYSIS ROUTES =====
app.use('/api/analysis', require('./routes/analysis'));

// ===== GEMINI TEST (no auth needed) =====
app.get('/api/ai/test', async (req, res) => {
  try {
    const reply = await callGemini('Say "Gemini is working!" and nothing else.');
    res.json({ success: true, reply, key: process.env.GEMINI_API_KEY ? '✅ Key is set' : '❌ Key is MISSING' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, key: process.env.GEMINI_API_KEY ? '✅ Key is set but failing' : '❌ Key is MISSING' });
  }
});

// ===== AI ROUTES - DEFINED DIRECTLY HERE =====
console.log('Registering AI routes...');

app.post('/api/ai/validate-idea-quick', async (req, res) => {
  try {
    const { product, city } = req.body;
    if (!product || !city) return res.status(400).json({ error: 'product and city required' });
    const prompt = `Evaluate this business idea quickly. Return ONLY valid JSON no extra text.
Idea: "${product}" in ${city}, Pakistan.
Return ONLY: {"demandScore":72,"competitionScore":55,"viabilityScore":68,"oneLineVerdict":"short honest verdict","topOpportunity":"one specific opportunity","topRisk":"one specific risk"}`;
    const rawText = await callGemini(prompt);
    const result = extractJSON(rawText);
    res.json({ success: true, result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/analyze-idea', protect, async (req, res) => {
  try {
    console.log('analyze-idea called for:', req.body.product);
    const { ideaId, product, industry, targetCity, targetCountry, targetCustomers, priceMin, priceMax, description } = req.body;
    const city = targetCity || 'Karachi';
    const country = targetCountry || 'Pakistan';

    const prompt = `You are an expert business analyst for Pakistan startups. Analyze this business and return ONLY a JSON object. No markdown, no explanation, just JSON.

Business: ${product}
Industry: ${industry}
City: ${city}, ${country}
Customers: ${targetCustomers}
Price: PKR ${priceMin}-${priceMax}
Description: ${description || 'Not provided'}

Return this exact JSON structure with REAL content (no placeholders like "strength 1"):
{
  "demandScore": 72,
  "competitionScore": 55,
  "viabilityScore": 68,
  "tamEstimate": 50000000,
  "samEstimate": 15000000,
  "somEstimate": 3000000,
  "revenueProjection": {"year1": 1200000, "year2": 3600000, "year3": 7200000},
  "keyStrengths": ["Write actual strength 1 for ${product} in ${city}", "Write actual strength 2", "Write actual strength 3"],
  "keyRisks": ["Write actual risk 1 for this business in Pakistan", "Write actual risk 2", "Write actual risk 3"],
  "opportunities": ["Write actual opportunity 1 in ${city}", "Write actual opportunity 2", "Write actual opportunity 3"],
  "suggestedPositioning": "Write a real positioning statement for ${product} targeting ${targetCustomers} in ${city}",
  "customerPersonas": [
    {
      "name": "Write real primary customer type name",
      "age": "18-25",
      "description": "Write real description of this customer in ${city}",
      "painPoints": ["Write real pain point 1 related to ${product}", "Write real pain point 2"],
      "willingnessToPay": "${priceMin}-${priceMax} PKR",
      "adoptionType": "early_adopter"
    },
    {
      "name": "Write real secondary customer type name",
      "age": "25-40",
      "description": "Write real description of secondary customer in ${city}",
      "painPoints": ["Write real pain point 1", "Write real pain point 2"],
      "willingnessToPay": "${priceMin}-${priceMax} PKR",
      "adoptionType": "mainstream"
    }
  ],
  "marketTrends": ["Write real current trend 1 for ${industry} in Pakistan", "Write real trend 2", "Write real trend 3"],
  "entryStrategy": "Write a real 2-sentence strategy for launching ${product} in ${city}",
  "criticalSuccessFactors": ["Write real success factor 1 for ${product}", "Write real factor 2", "Write real factor 3"],
  "overallVerdict": "Write an honest 2-sentence verdict about ${product} in ${city} mentioning the product and target customers specifically."
}`;

    const rawText = await callGemini(prompt);
    const analysis = extractJSON(rawText);
    analysis.analyzedAt = new Date();
    if (ideaId) {
      const Idea = require('./models/Idea');
      await Idea.findOneAndUpdate({ _id: ideaId, user: req.user._id }, { analysis }, { new: true });
    }
    res.json({ success: true, analysis });
  } catch (err) { console.error('analyze-idea error:', err.message); res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/generate-swot', protect, async (req, res) => {
  try {
    const { product, industry, targetCity, targetCustomers, description } = req.body;
    const prompt = `You are a business analyst. Generate a detailed SWOT analysis for this Pakistani startup.\nBusiness: ${product}\nIndustry: ${industry}\nCity: ${targetCity}\nCustomers: ${targetCustomers}\nDescription: ${description || 'Not provided'}\n\nReturn ONLY valid JSON with NO extra text or markdown. Fill in REAL specific content:\n{"strengths":["real strength 1","real strength 2","real strength 3","real strength 4","real strength 5"],"weaknesses":["real weakness 1","real weakness 2","real weakness 3","real weakness 4"],"opportunities":["real opportunity 1","real opportunity 2","real opportunity 3","real opportunity 4","real opportunity 5"],"threats":["real threat 1","real threat 2","real threat 3","real threat 4"],"strategicRecommendations":{"SO":"real SO strategy","ST":"real ST strategy","WO":"real WO strategy","WT":"real WT strategy"}}`;
    const rawText = await callGemini(prompt);
    const swot = extractJSON(rawText);
    res.json({ success: true, swot });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/generate-bmc', protect, async (req, res) => {
  try {
    const { product, industry, targetCustomers, priceMin, priceMax, description } = req.body;
    const prompt = `You are a business strategist. Create a detailed Business Model Canvas for this Pakistani startup.\nBusiness: ${product}\nIndustry: ${industry}\nCustomers: ${targetCustomers}\nPrice Range: ${priceMin}-${priceMax} PKR\nDescription: ${description || 'Not provided'}\n\nReturn ONLY valid JSON with NO extra text or markdown. Fill in REAL specific content for this business:\n{"valueProposition":"Write real unique value this business offers","customerSegments":["real segment 1","real segment 2","real segment 3"],"channels":["real channel 1","real channel 2","real channel 3"],"customerRelationships":"Write real customer relationship approach","revenueStreams":["real revenue stream 1","real revenue stream 2"],"keyActivities":["real activity 1","real activity 2","real activity 3"],"keyResources":["real resource 1","real resource 2","real resource 3"],"keyPartnerships":["real partner 1","real partner 2","real partner 3"],"costStructure":["real cost 1","real cost 2","real cost 3"],"unfairAdvantage":"Write real competitive advantage"}`;
    const rawText = await callGemini(prompt);
    const bmc = extractJSON(rawText);
    res.json({ success: true, bmc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/generate-pitch', protect, async (req, res) => {
  try {
    const { idea, analysis } = req.body;
    const product = idea.product;
    const city = idea.targetCity;
    const customers = idea.targetCustomers;
    const industry = idea.industry;
    const viability = analysis?.viabilityScore || 70;
    const tam = analysis?.tamEstimate ? `$${(analysis.tamEstimate/1000000).toFixed(0)}M` : '$50M';
    const sam = analysis?.samEstimate ? `$${(analysis.samEstimate/1000000).toFixed(0)}M` : '$15M';
    const revenue1 = analysis?.revenueProjection?.year1 ? `PKR ${(analysis.revenueProjection.year1/1000000).toFixed(1)}M` : 'PKR 1.2M';
    const revenue3 = analysis?.revenueProjection?.year3 ? `PKR ${(analysis.revenueProjection.year3/1000000).toFixed(1)}M` : 'PKR 7.2M';

    const prompt = `You are a top startup pitch coach. Create a compelling 10-slide investor pitch deck for this REAL Pakistan startup.

Business: ${product}
Industry: ${industry}
City: ${city}, Pakistan
Target Customers: ${customers}
Price Range: PKR ${idea.priceMin}-${idea.priceMax}
Viability Score: ${viability}/100
Market Size: TAM ${tam}, SAM ${sam}
Year 1 Revenue Projection: ${revenue1}
Year 3 Revenue Projection: ${revenue3}
Description: ${idea.description || 'Not provided'}

Write a REAL, COMPELLING pitch deck with specific facts about ${product} in ${city}. Every bullet point must be specific to this business — NO generic placeholders.

Return ONLY valid JSON:
{
  "pitchTitle": "Write a compelling title for ${product} startup pitch",
  "tagline": "Write a memorable one-line tagline for ${product}",
  "askAmount": "Write realistic PKR funding ask for ${product} at this stage",
  "slides": [
    {"slideNumber": 1, "title": "Problem", "heading": "Write the specific problem ${product} solves in ${city}", "bullets": ["Write specific pain point 1 for ${customers} in ${city}", "Write specific pain point 2 with real data", "Write the cost of this problem"], "speakerNotes": "Write what to say when presenting this slide"},
    {"slideNumber": 2, "title": "Solution", "heading": "How ${product} uniquely solves this in ${city}", "bullets": ["Write your specific solution approach", "Write what makes it different from alternatives", "Write the key innovation"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 3, "title": "Market Size", "heading": "Write market size headline with real PKR numbers", "bullets": ["TAM: ${tam} - Write what this covers", "SAM: ${sam} - Write your serviceable market", "SOM: Write your realistic 3-year capture"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 4, "title": "Product Demo", "heading": "How ${product} works step by step", "bullets": ["Write step 1 of how customer uses ${product}", "Write step 2 - the key feature", "Write step 3 - the outcome for customer"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 5, "title": "Business Model", "heading": "How ${product} makes money in ${city}", "bullets": ["Write primary revenue stream with PKR amounts", "Write secondary revenue stream", "Write unit economics: cost vs revenue per customer"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 6, "title": "Traction", "heading": "Write current traction or launch plan for ${product}", "bullets": ["Write current milestone or early customer number", "Write validation proof or market test result", "Write next 90-day target"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 7, "title": "Competition", "heading": "Why ${product} wins against competition in ${city}", "bullets": ["Write real competitor in ${industry} and your advantage", "Write your key differentiator", "Write why competitors cannot easily copy you"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 8, "title": "Team", "heading": "The team behind ${product}", "bullets": ["Write founder background relevant to ${industry}", "Write team's unfair advantage for this market", "Write key hire or advisor needed"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 9, "title": "Financials", "heading": "Path to ${revenue3} in 3 years", "bullets": ["Year 1: ${revenue1} - Write how you get there", "Year 2: Write projection with key driver", "Year 3: ${revenue3} - Write scale assumption"], "speakerNotes": "Write speaking notes"},
    {"slideNumber": 10, "title": "The Ask", "heading": "Raising [amount] to dominate ${city} market", "bullets": ["Write specific use of funds item 1 with PKR %", "Write specific use of funds item 2 with PKR %", "Write what you will achieve with this funding"], "speakerNotes": "Write speaking notes"}
  ],
  "useOfFunds": ["Write real fund use 1 with percentage", "Write real fund use 2 with percentage", "Write real fund use 3 with percentage"],
  "exitStrategy": "Write realistic exit strategy for ${product} in Pakistan market"
}`;

    const rawText = await callGemini(prompt);
    const pitch = extractJSON(rawText);
    res.json({ success: true, pitch });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/mentor-chat', protect, async (req, res) => {
  try {
    const { message, conversationHistory, ideaContext } = req.body;
    const ctx = ideaContext ? `User business: ${ideaContext.product} in ${ideaContext.targetCity}` : '';
    const history = (conversationHistory||[]).slice(-6).map(m=>`${m.role==='user'?'Entrepreneur':'Mentor'}: ${m.content}`).join('\n');
    const prompt = `You are a warm startup mentor for Pakistan entrepreneurs. Give practical advice in 3-5 sentences.
${ctx}
${history}
Entrepreneur: ${message}
Mentor:`;
    const reply = await callGemini(prompt);
    res.json({ success: true, reply });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

console.log('✅ All AI routes registered!');

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketmind')
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 MarketMind running on port ${PORT}`));
})
.catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });

module.exports = app;
// ════════════════════════════════════════════════
// NEW GAME-CHANGER ROUTES
// ════════════════════════════════════════════════

// 1. Business Name Generator
app.post('/api/ai/generate-names', protect, async (req, res) => {
  try {
    const { product, industry, targetCity, style } = req.body;
    const prompt = `Generate 10 unique, catchy business names for a ${product} startup in ${targetCity}, Pakistan (${industry} industry). Style preference: ${style || 'modern and memorable'}.
Return ONLY valid JSON, no markdown:
{"names":[{"name":"BusinessName","tagline":"Short catchy tagline","meaning":"Why this name works","domain":"businessname.com","score":85},{"name":"BusinessName2","tagline":"tagline","meaning":"reason","domain":"domain.com","score":80}],"tips":"One tip for choosing a business name in Pakistan"}
Generate exactly 10 names with real scores 60-95.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Funding Finder
app.post('/api/ai/find-funding', protect, async (req, res) => {
  try {
    const { product, industry, stage, amount } = req.body;
    const prompt = `List real funding sources for a ${product} startup in Pakistan at ${stage} stage seeking PKR ${amount}.
Return ONLY valid JSON:
{"sources":[{"name":"Real funder name","type":"Grant|VC|Angel|Incubator|Bank","amount":"PKR range","eligibility":"Who qualifies","howToApply":"Specific steps","deadline":"If known or Rolling","link":"Real website URL","difficulty":"Easy|Medium|Hard","matchScore":85}],"totalPotential":"Total PKR range available","topRecommendation":"Best option for this startup and why"}
Include 8 REAL Pakistan-specific sources: SMEDA, NIC, i2i Ventures, Invest2Innovate, Karandaaz, LUMS CORE, P@SHA, etc.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Revenue & Break-even Calculator
app.post('/api/ai/calculate-revenue', protect, async (req, res) => {
  try {
    const { product, priceMin, priceMax, industry, targetCity, targetCustomers, initialInvestment } = req.body;
    const avgPrice = (Number(priceMin) + Number(priceMax)) / 2;
    const prompt = `Calculate realistic financial projections for a ${product} business in ${targetCity}, Pakistan.
Price: PKR ${avgPrice} avg, Target: ${targetCustomers}, Initial Investment: PKR ${initialInvestment || 500000}.
Return ONLY valid JSON:
{"breakEven":{"monthsToBreakEven":8,"unitsPerMonth":150,"revenueAtBreakEven":450000},"monthly":[{"month":1,"revenue":120000,"costs":380000,"profit":-260000,"customers":40},{"month":3,"revenue":280000,"costs":420000,"profit":-140000,"customers":93},{"month":6,"revenue":480000,"costs":460000,"profit":20000,"customers":160},{"month":12","revenue":850000,"costs":520000,"profit":330000,"customers":283}],"yearly":{"year1":{"revenue":5200000,"costs":4800000,"profit":400000},"year2":{"revenue":9600000,"costs":6200000,"profit":3400000},"year3":{"revenue":16000000,"costs":8400000,"profit":7600000}},"keyMetrics":{"cac":"Customer acquisition cost PKR","ltv":"Customer lifetime value PKR","grossMargin":"percent","paybackPeriod":"months"},"assumptions":["assumption 1","assumption 2","assumption 3"],"risks":["financial risk 1","financial risk 2"]}
Use REAL numbers for ${targetCity} Pakistan market.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Marketing Plan Generator
app.post('/api/ai/marketing-plan', protect, async (req, res) => {
  try {
    const { product, targetCity, targetCustomers, budget, industry } = req.body;
    const prompt = `Create a complete digital marketing plan for a ${product} business in ${targetCity}, Pakistan targeting ${targetCustomers}. Monthly budget: PKR ${budget || 30000}.
Return ONLY valid JSON:
{"channels":[{"name":"Instagram","budget":10000,"expectedReach":5000,"tactics":["tactic1","tactic2"],"contentIdeas":["idea1","idea2"],"kpis":["kpi1"]}],"contentCalendar":[{"week":1,"theme":"theme","posts":["post idea 1","post idea 2"],"platform":"Instagram/Facebook"}],"seoKeywords":["keyword1","keyword2","keyword3"],"influencerStrategy":"Strategy for Pakistan micro-influencers","monthlyBudgetBreakdown":{"socialMedia":10000,"content":5000,"ads":10000,"tools":5000},"week1Actions":["action1","action2","action3"],"expectedResults":{"month1":"result","month3":"result","month6":"result"}}
Make it specific to Pakistan digital marketing landscape.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Legal & Compliance Checker
app.post('/api/ai/legal-check', protect, async (req, res) => {
  try {
    const { product, industry, targetCity } = req.body;
    const prompt = `List all legal requirements to start a ${product} business in ${targetCity}, Pakistan (${industry}).
Return ONLY valid JSON:
{"registrations":[{"name":"SECP Registration","authority":"SECP","cost":"PKR 1500-5000","timeline":"2-4 weeks","required":true,"link":"secp.gov.pk","steps":["step1","step2"]}],"licenses":[{"name":"License name","authority":"Authority name","cost":"PKR amount","required":true}],"taxes":[{"name":"Tax type","rate":"percentage","authority":"FBR","notes":"important note"}],"totalEstimatedCost":"PKR range","timeToLegal":"weeks/months","priorityOrder":["First do this","Then this","Then this"],"warnings":["Important warning 1","Warning 2"]}
Be specific to Pakistan laws: SECP, FBR, PRA, local municipality.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Competitor Intelligence (AI-powered when map data is empty)
app.post('/api/ai/competitor-intel', protect, async (req, res) => {
  try {
    const { product, targetCity, industry } = req.body;
    const prompt = `Analyze the competitive landscape for a ${product} business in ${targetCity}, Pakistan.
Return ONLY valid JSON:
{"competitors":[{"name":"Real competitor name in Pakistan","type":"Direct|Indirect","strength":"Strong|Medium|Weak","marketShare":"estimated %","strategy":"their strategy","weakness":"their weakness","threat":"High|Medium|Low"}],"marketGap":"Specific gap in ${targetCity} market","differentiationIdeas":["idea1","idea2","idea3"],"competitiveAdvantageScore":65,"summary":"2 sentence competitive overview for ${targetCity}"}
Name REAL competitors that exist in Pakistan for ${product}.`;
    const raw = await callGemini(prompt);
    const result = extractJSON(raw);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
