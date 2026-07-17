const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// ─── GEOCODE CITY (Nominatim - free, reliable) ───────────────────────────────
async function geocodeCity(city, country = 'Pakistan') {
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: `${city}, ${country}`, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'MarketMind/2.0 contact@marketmind.pk' },
    timeout: 10000
  });
  if (!res.data?.length) throw new Error(`City "${city}" not found`);
  return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
}

// ─── FOURSQUARE SEARCH (free 1000/day) ───────────────────────────────────────
async function searchFoursquare(query, lat, lng, radius = 5000) {
  if (!process.env.FOURSQUARE_API_KEY) return [];
  try {
    const res = await axios.get('https://api.foursquare.com/v3/places/search', {
      params: { query, ll: `${lat},${lng}`, radius, limit: 20, fields: 'name,location,categories,distance,rating,hours,tel,website' },
      headers: { Authorization: process.env.FOURSQUARE_API_KEY, Accept: 'application/json' },
      timeout: 15000
    });
    return (res.data.results || []).map(p => ({
      name: p.name,
      address: p.location?.formatted_address || p.location?.address || 'Address not listed',
      lat: p.geocodes?.main?.latitude || lat,
      lng: p.geocodes?.main?.longitude || lng,
      type: p.categories?.[0]?.name || query,
      distance: p.distance,
      rating: p.rating || null,
      phone: p.tel || null,
      website: p.website || null,
      hours: p.hours?.display || null,
    }));
  } catch (err) {
    console.error('Foursquare error:', err.response?.data || err.message);
    return [];
  }
}

// ─── OVERPASS FALLBACK (multiple servers) ────────────────────────────────────
async function searchOverpass(key, value, lat, lng) {
  const query = `[out:json][timeout:25];(node["${key}"="${value}"](around:5000,${lat},${lng});way["${key}"="${value}"](around:5000,${lat},${lng}););out center;`;
  const servers = [
    'https://overpass.openstreetmap.ru/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];
  for (const server of servers) {
    try {
      const res = await axios.post(server, query, {
        headers: { 'Content-Type': 'text/plain' }, timeout: 20000
      });
      const elements = (res.data?.elements || []).filter(e => (e.lat && e.lon) || e.center);
      if (elements.length >= 0) {
        return elements.slice(0, 20).map(e => ({
          name: e.tags?.name || e.tags?.['name:en'] || `${value} business`,
          address: e.tags?.['addr:street'] || e.tags?.['addr:full'] || 'Local area',
          lat: e.lat || e.center?.lat,
          lng: e.lon || e.center?.lon,
          type: value,
          phone: e.tags?.phone || null,
          website: e.tags?.website || null,
        }));
      }
    } catch (e) { console.log(`Overpass ${server} failed:`, e.message); }
  }
  return [];
}

// ─── PRODUCT → SEARCH TERM MAPPER ────────────────────────────────────────────
function getSearchTerms(product) {
  const p = product.toLowerCase();
  if (p.includes('coffee') || p.includes('cafe')) return { foursquare: 'coffee shop', osm: { key: 'amenity', value: 'cafe' } };
  if (p.includes('restaurant') || p.includes('food') || p.includes('biryani') || p.includes('pizza') || p.includes('burger')) return { foursquare: 'restaurant', osm: { key: 'amenity', value: 'restaurant' } };
  if (p.includes('ice cream') || p.includes('dessert') || p.includes('sweet')) return { foursquare: 'ice cream', osm: { key: 'amenity', value: 'ice_cream' } };
  if (p.includes('pharmacy') || p.includes('medicine')) return { foursquare: 'pharmacy', osm: { key: 'amenity', value: 'pharmacy' } };
  if (p.includes('gym') || p.includes('fitness')) return { foursquare: 'gym', osm: { key: 'leisure', value: 'fitness_centre' } };
  if (p.includes('salon') || p.includes('beauty') || p.includes('hair')) return { foursquare: 'beauty salon', osm: { key: 'shop', value: 'beauty' } };
  if (p.includes('cloth') || p.includes('fashion') || p.includes('dress')) return { foursquare: 'clothing store', osm: { key: 'shop', value: 'clothes' } };
  if (p.includes('grocery') || p.includes('kirana')) return { foursquare: 'grocery store', osm: { key: 'shop', value: 'convenience' } };
  if (p.includes('mobile') || p.includes('phone') || p.includes('electronics')) return { foursquare: 'electronics store', osm: { key: 'shop', value: 'electronics' } };
  if (p.includes('bakery') || p.includes('cake')) return { foursquare: 'bakery', osm: { key: 'shop', value: 'bakery' } };
  if (p.includes('school') || p.includes('academy') || p.includes('tutor')) return { foursquare: 'school tutoring', osm: { key: 'amenity', value: 'school' } };
  if (p.includes('tea') || p.includes('chai')) return { foursquare: 'tea house', osm: { key: 'amenity', value: 'cafe' } };
  return { foursquare: product, osm: { key: 'amenity', value: 'restaurant' } };
}

// ─── COMPETITOR MAP ROUTE ─────────────────────────────────────────────────────
router.get('/competitors', protect, async (req, res, next) => {
  try {
    const { product, city, country = 'Pakistan' } = req.query;
    if (!product || !city) return res.status(400).json({ error: 'product and city required' });

    const { lat, lng } = await geocodeCity(city, country);
    const terms = getSearchTerms(product);

    // Try Foursquare first (best data), fall back to Overpass
    let competitors = [];
    let source = 'map';

    if (process.env.FOURSQUARE_API_KEY) {
      competitors = await searchFoursquare(terms.foursquare, lat, lng);
      source = 'Foursquare';
    }

    if (competitors.length === 0) {
      competitors = await searchOverpass(terms.osm.key, terms.osm.value, lat, lng);
      source = 'OpenStreetMap';
    }

    const saturationScore = Math.min(100, Math.round((competitors.length / 15) * 100));

    res.json({
      success: true,
      source,
      city: { name: city, lat, lng },
      competitors,
      metrics: {
        count: competitors.length,
        saturationScore,
        marketGap: saturationScore < 40 ? 'High' : saturationScore < 70 ? 'Medium' : 'Low',
        recommendation: competitors.length === 0
          ? `No competitors found for "${product}" in ${city}. Either low competition or businesses aren't on the map yet — great opportunity!`
          : saturationScore < 30
          ? `🟢 Great opportunity! Only ${competitors.length} competitors in ${city}. Low market saturation.`
          : saturationScore < 60
          ? `🟡 Moderate competition — ${competitors.length} businesses found. Differentiation is key.`
          : `🔴 High saturation — ${competitors.length} competitors. Strong niche positioning required.`
      }
    });
  } catch (err) {
    console.error('Competitor map error:', err.message);
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ─── MARKET TRENDS / EXPLORE SEARCH ─────────────────────────────────────────
router.get('/trends', async (req, res, next) => {
  try {
    const { product, industry } = req.query;
    const query = `${product || industry} business Pakistan startup 2024`;
    const newsRes = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: query, language: 'en', sortBy: 'relevancy', pageSize: 9, apiKey: process.env.NEWS_API_KEY },
      timeout: 10000
    });
    const articles = (newsRes.data.articles || [])
      .filter(a => a.title && a.description && !a.title.includes('[Removed]'))
      .map(a => ({
        title: a.title,
        description: a.description,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source?.name,
        urlToImage: a.urlToImage,
      }));
    res.json({ success: true, articles });
  } catch (err) {
    console.error('Trends error:', err.message);
    res.json({ success: true, articles: [] }); // Don't fail — just return empty
  }
});

// ─── AI MARKET INSIGHTS (new endpoint) ───────────────────────────────────────
router.post('/ai-insights', protect, async (req, res, next) => {
  try {
    const { product, city, industry } = req.body;
    const callAI = require('../server').callAI;
    const prompt = `Give 5 real market insights for a "${product}" business in ${city}, Pakistan in the ${industry} sector. Format as JSON array: [{"title":"insight title","detail":"2 sentence detail","type":"opportunity|risk|trend"}]`;
    const text = await callAI(prompt);
    const insights = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ success: true, insights });
  } catch (err) { next(err); }
});

router.get('/industries', (req, res) => {
  res.json({ industries: [
    { id: 'Food & Beverage', label: 'Food & Beverage', icon: '🍕' },
    { id: 'Technology & SaaS', label: 'Technology & SaaS', icon: '💻' },
    { id: 'Retail & E-commerce', label: 'Retail & E-commerce', icon: '🛍️' },
    { id: 'Education & Training', label: 'Education & Training', icon: '📚' },
    { id: 'Health & Wellness', label: 'Health & Wellness', icon: '🏥' },
    { id: 'Finance & FinTech', label: 'Finance & FinTech', icon: '💰' },
    { id: 'Agriculture', label: 'Agriculture', icon: '🌾' },
    { id: 'Fashion & Apparel', label: 'Fashion & Apparel', icon: '👗' },
  ]});
});

module.exports = router;
