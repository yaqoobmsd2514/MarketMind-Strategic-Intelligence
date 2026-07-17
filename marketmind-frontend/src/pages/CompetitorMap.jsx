import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import api from '../services/api';
import toast from 'react-hot-toast';
import './CompetitorMap.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const mkIcon = (bg, emoji, size=30) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;background:${bg};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size*0.45}px;box-shadow:0 3px 10px rgba(0,0,0,0.5);">${emoji}</div>`,
  iconSize: [size, size], iconAnchor: [size/2, size/2]
});
const yourIcon = mkIcon('#6366f1', '⭐', 36);
const compIcon = mkIcon('#ef4444', '🏢', 30);

// City coordinate database for Pakistan
const CITY_COORDS = {
  'karachi':   { lat: 24.8607, lng: 67.0011 },
  'lahore':    { lat: 31.5204, lng: 74.3587 },
  'islamabad': { lat: 33.6844, lng: 73.0479 },
  'rawalpindi':{ lat: 33.6007, lng: 73.0679 },
  'peshawar':  { lat: 34.0151, lng: 71.5249 },
  'quetta':    { lat: 30.1798, lng: 66.9750 },
  'multan':    { lat: 30.1575, lng: 71.5249 },
  'faisalabad':{ lat: 31.4504, lng: 73.1350 },
  'hyderabad': { lat: 25.3960, lng: 68.3578 },
  'sialkot':   { lat: 32.4945, lng: 74.5229 },
  'larkana':   { lat: 27.5570, lng: 68.2138 },
  'gujranwala':{ lat: 32.1877, lng: 74.1945 },
  'default':   { lat: 30.3753, lng: 69.3451 },
};

// Generate realistic competitor positions around a center point
function generateCompetitorMarkers(centerLat, centerLng, count, product) {
  const competitors = [];
  const prefixes = {
    burger: ['Hardee\'s','Johnny & Jugnu','Burger Lab','Burger O\'Clock','Lord of the Buns','Smash Burger','Grill House','Fries & Co'],
    coffee: ['Coffee Planet','Espresso Etc','Chai Wala','Nescafe Café','The Coffee Shop','Brewed Café','Coffee House','Chai & More'],
    restaurant: ['Dine In','The Kitchen','Spice Route','Food Palace','Lahori Cuisine','Karahi House','BBQ Tonight','Biryani Center'],
    ice_cream: ['Yummy Cone','Ice Dream','Frosty Treat','Sweet Factory','Coldstone PK','Treat Zone','Chill Factory'],
    gym: ['Fitness Zone','Power Gym','Gold\'s Gym','Iron Paradise','Strength Hub','Fit Club'],
    pharmacy: ['CureMed','PharmaPlus','HealthMart','MedStore','Life Pharmacy','Dawa Khana'],
    default: ['Local Business','Area Shop','Nearby Store','Market Shop','City Business'],
  };
  const p = product.toLowerCase();
  const names = p.includes('burger') ? prefixes.burger :
    p.includes('coffee') || p.includes('cafe') ? prefixes.coffee :
    p.includes('ice cream') || p.includes('dessert') ? prefixes.ice_cream :
    p.includes('gym') || p.includes('fitness') ? prefixes.gym :
    p.includes('pharmacy') || p.includes('medicine') ? prefixes.pharmacy :
    p.includes('restaurant') || p.includes('food') ? prefixes.restaurant : prefixes.default;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
    const dist = (0.008 + Math.random() * 0.025);
    competitors.push({
      name: `${names[i % names.length]} ${i < names.length ? '' : `(Branch ${Math.floor(i/names.length)+1})`}`.trim(),
      lat: centerLat + Math.sin(angle) * dist,
      lng: centerLng + Math.cos(angle) * dist * 1.2,
      address: `Near ${['Main Boulevard', 'University Road', 'Mall Road', 'GT Road', 'Saddar Area', 'Old City', 'New Town', 'Commercial Area'][i % 8]}`,
      distance: Math.round(dist * 111000),
      estimated: true,
    });
  }
  return competitors;
}

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom]);
  return null;
}

export default function CompetitorMap() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [aiIntel, setAiIntel] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([30.3753, 69.3451]);
  const [useAI, setUseAI] = useState(false);

  useEffect(() => {
    api.get(`/ideas/${id}`).then(r => setIdea(r.data.idea)).catch(() => toast.error('Failed to load idea'));
  }, [id]);

  const findCompetitors = async () => {
    if (!idea) return;
    setLoading(true); setData(null); setAiIntel(null); setSelected(null);

    // Step 1: Geocode
    const city = idea.targetCity?.toLowerCase().trim();
    let coords = CITY_COORDS[city] || null;

    if (!coords) {
      // Try Nominatim
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(idea.targetCity + ', Pakistan')}&format=json&limit=1`, {
          headers: { 'User-Agent': 'MarketMind/2.0' }
        }).then(r => r.json());
        if (geo?.[0]) coords = { lat: parseFloat(geo[0].lat), lng: parseFloat(geo[0].lon) };
      } catch {}
    }

    if (!coords) coords = CITY_COORDS.default;
    setMapCenter([coords.lat, coords.lng]);

    // Step 2: Try real Overpass API (multiple servers)
    let realCompetitors = [];
    const p = idea.product.toLowerCase();
    const osmTag = p.includes('burger') || p.includes('pizza') || p.includes('food') ? ['amenity', 'restaurant'] :
      p.includes('coffee') || p.includes('cafe') || p.includes('chai') ? ['amenity', 'cafe'] :
      p.includes('ice cream') || p.includes('dessert') ? ['amenity', 'ice_cream'] :
      p.includes('pharmacy') ? ['amenity', 'pharmacy'] :
      p.includes('gym') ? ['leisure', 'fitness_centre'] :
      p.includes('bakery') ? ['shop', 'bakery'] :
      p.includes('clothes') || p.includes('fashion') ? ['shop', 'clothes'] :
      ['amenity', 'restaurant'];

    const overpassServers = [
      'https://overpass.openstreetmap.ru/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];
    const query = `[out:json][timeout:20];(node["${osmTag[0]}"="${osmTag[1]}"](around:4000,${coords.lat},${coords.lng});way["${osmTag[0]}"="${osmTag[1]}"](around:4000,${coords.lat},${coords.lng}););out center;`;

    for (const server of overpassServers) {
      try {
        const res = await fetch(server, {
          method: 'POST', body: query,
          headers: { 'Content-Type': 'text/plain' }
        }).then(r => r.json());
        const elements = res.elements || [];
        if (elements.length > 0) {
          realCompetitors = elements.slice(0, 20).map(e => ({
            name: e.tags?.name || e.tags?.['name:en'] || `${idea.product} Business`,
            lat: e.lat || e.center?.lat,
            lng: e.lon || e.center?.lon,
            address: e.tags?.['addr:street'] || 'Local area',
            distance: null, phone: e.tags?.phone, hours: e.tags?.opening_hours,
          })).filter(c => c.lat && c.lng);
          if (realCompetitors.length > 0) break;
        }
      } catch {}
    }

    // Step 3: If OSM found nothing, generate intelligent mock markers + AI intel
    const competitors = realCompetitors.length > 0 ? realCompetitors :
      generateCompetitorMarkers(coords.lat, coords.lng, Math.floor(5 + Math.random() * 8), idea.product);

    const isEstimated = realCompetitors.length === 0;
    const satScore = Math.min(100, Math.round((competitors.length / 15) * 100));

    setData({
      city: { name: idea.targetCity, lat: coords.lat, lng: coords.lng },
      competitors,
      isEstimated,
      metrics: {
        count: competitors.length,
        saturationScore: satScore,
        marketGap: satScore < 35 ? 'High' : satScore < 65 ? 'Medium' : 'Low',
        recommendation: isEstimated
          ? `${competitors.length} estimated competitors in ${idea.targetCity} area. Map data is limited — showing intelligent estimates. See AI Intelligence below for real competitor names.`
          : satScore < 35
          ? `🟢 Only ${competitors.length} mapped competitors! Great entry opportunity in ${idea.targetCity}.`
          : satScore < 65
          ? `🟡 ${competitors.length} competitors found. Solid differentiation needed to stand out.`
          : `🔴 ${competitors.length} competitors mapped. High saturation — strong niche required.`
      }
    });

    // Always load AI competitor intelligence
    setAiLoading(true);
    try {
      const ir = await api.post('/ai/competitor-intel', { product: idea.product, targetCity: idea.targetCity, industry: idea.industry });
      setAiIntel(ir.data);
    } catch {}
    finally { setAiLoading(false); }

    toast.success(isEstimated
      ? `Showing ${competitors.length} estimated competitors + AI intelligence`
      : `Found ${competitors.length} real competitors on map!`
    );
    setLoading(false);
  };

  const satColor = s => s < 35 ? '#10b981' : s < 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="cmap-page">
      <div className="cmap-header">
        <div>
          <div className="ap-breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <span>{idea?.title || '...'}</span><span>/</span><span>Competitor Map</span>
          </div>
          <h1>Live Competitor Map</h1>
          <p style={{color:'var(--text-secondary)',fontSize:14}}>
            {idea?.product} in {idea?.targetCity} · Leaflet + OpenStreetMap + AI Intelligence
          </p>
        </div>
        <button className="fetch-btn" onClick={findCompetitors} disabled={loading || !idea}>
          {loading ? <><span className="btn-spinner"/> Searching...</> : '🗺️ Find Competitors'}
        </button>
      </div>

      <div className="cmap-body">
        {/* Map */}
        <div className="cmap-map">
          <MapContainer center={mapCenter} zoom={14} style={{height:'100%',width:'100%',borderRadius:12}}>
            <MapUpdater center={mapCenter} zoom={14}/>
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data && <>
              <Marker position={[data.city.lat, data.city.lng]} icon={yourIcon}>
                <Popup><strong style={{color:'#6366f1'}}>⭐ Your Location</strong><br/>{idea?.product}</Popup>
              </Marker>
              <Circle center={[data.city.lat, data.city.lng]} radius={4000}
                pathOptions={{color:'#6366f1',fillColor:'#6366f1',fillOpacity:0.04,weight:1,dashArray:'8 4'}}/>
              {data.competitors.map((c,i) => c.lat && c.lng && (
                <Marker key={i} position={[c.lat, c.lng]} icon={compIcon}
                  eventHandlers={{click:()=>setSelected(c)}}>
                  <Popup>
                    <strong>{c.name}</strong><br/>
                    <span style={{fontSize:12,color:'#64748b'}}>{c.address}</span>
                    {c.estimated && <><br/><span style={{fontSize:11,color:'#f59e0b'}}>📍 Estimated position</span></>}
                  </Popup>
                </Marker>
              ))}
            </>}
            {!data && (
              <Marker position={mapCenter} icon={yourIcon}>
                <Popup>Click "Find Competitors" to search</Popup>
              </Marker>
            )}
          </MapContainer>
          {!data && (
            <div className="cmap-overlay">
              <span>🗺️</span>
              <p>Click <strong>"Find Competitors"</strong> to search the map</p>
              <p style={{fontSize:12,opacity:.6,marginTop:4}}>Uses OpenStreetMap + AI intelligence</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="cmap-sidebar">
          {!data ? (
            <div className="cmap-empty-side">
              <div style={{fontSize:32,marginBottom:12}}>🔍</div>
              <p>Competitor analysis will appear here after search.</p>
            </div>
          ) : (
            <>
              <div className="cmap-metrics">
                <div className="cm">
                  <span className="cm-val">{data.metrics.count}</span>
                  <span className="cm-lbl">{data.isEstimated ? 'Estimated' : 'Found'}</span>
                </div>
                <div className="cm">
                  <span className="cm-val" style={{color:satColor(data.metrics.saturationScore)}}>{data.metrics.saturationScore}%</span>
                  <span className="cm-lbl">Saturation</span>
                </div>
                <div className="cm">
                  <span className="cm-val" style={{color:satColor(data.metrics.saturationScore)}}>{data.metrics.marketGap}</span>
                  <span className="cm-lbl">Market Gap</span>
                </div>
              </div>
              <div className="sat-bar-wrap">
                <div className="sat-bar"><div style={{width:`${data.metrics.saturationScore}%`,background:satColor(data.metrics.saturationScore)}}/></div>
              </div>
              <div className="rec-box"><p>{data.metrics.recommendation}</p></div>

              {data.isEstimated && (
                <div className="est-notice">📍 <strong>Map positions are estimated.</strong> Pakistani businesses are underrepresented on OpenStreetMap. AI intelligence below shows real names.</div>
              )}

              {/* Competitor list */}
              <h3 className="comp-list-title">
                {data.isEstimated ? '📍 Area Competitors (estimated)' : '📍 Mapped Competitors'}
              </h3>
              <div className="comp-list">
                {data.competitors.map((c,i) => (
                  <motion.div key={i} className={`comp-item ${selected?.name===c.name?'sel':''}`}
                    onClick={()=>setSelected(c)}
                    initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                    <div className="ci-top">
                      <p className="comp-name">{c.name}</p>
                      {c.distance && <span className="comp-dist">{c.distance < 1000 ? `${c.distance}m` : `${(c.distance/1000).toFixed(1)}km`}</span>}
                    </div>
                    <p className="comp-addr">{c.address}</p>
                    {c.phone && <p className="comp-phone">📞 {c.phone}</p>}
                    {c.hours && <p className="comp-hours">🕐 {c.hours}</p>}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* AI Competitor Intelligence */}
          <AnimatePresence>
            {(aiLoading || aiIntel) && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="ai-intel">
                <h3>🤖 AI Competitor Intelligence</h3>
                {aiLoading ? (
                  <div className="ai-loading"><span className="btn-spinner"/> Loading AI analysis...</div>
                ) : aiIntel && (
                  <>
                    {aiIntel.marketGap && <div className="intel-gap">💡 <strong>Market Gap:</strong> {aiIntel.marketGap}</div>}
                    {(aiIntel.competitors || []).map((c,i) => (
                      <div key={i} className="intel-comp">
                        <div className="ic-top">
                          <span className="ic-name">{c.name}</span>
                          <span className={`ic-threat t-${c.threat?.toLowerCase()}`}>{c.threat}</span>
                        </div>
                        <div className="ic-type">{c.type} · {c.strength}</div>
                        <div className="ic-weak">Weakness: {c.weakness}</div>
                      </div>
                    ))}
                    {aiIntel.differentiationIdeas?.length > 0 && (
                      <div className="intel-diff">
                        <strong>💡 How to differentiate:</strong>
                        <ul>{aiIntel.differentiationIdeas.map((d,i)=><li key={i}>{d}</li>)}</ul>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
