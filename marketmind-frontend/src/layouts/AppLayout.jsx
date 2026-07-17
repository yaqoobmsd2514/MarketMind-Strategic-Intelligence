import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AppLayout.css';

const NAV = [
  { icon:'🏠', label:'Dashboard', path:'/dashboard' },
  { icon:'💡', label:'New Idea', path:'/ideas/new' },
  { icon:'🧠', label:'AI Mentor', path:'/mentor' },
  { divider:true, label:'TOOLS' },
  { icon:'🛠️', label:'Toolkit', path:'/toolkit' },
  { icon:'🏷️', label:'Name Generator', path:'/names' },
  { icon:'💰', label:'Funding Finder', path:'/funding' },
  { icon:'📊', label:'Revenue Calc', path:'/revenue' },
  { icon:'📣', label:'Marketing Plan', path:'/marketing' },
  { icon:'⚖️', label:'Legal Checker', path:'/legal' },
  { divider:true, label:'EXPLORE' },
  { icon:'🌐', label:'Explore Ideas', path:'/explore' },
  { icon:'💎', label:'Pricing', path:'/pricing' },
  { divider:true, label:'ACCOUNT' },
  { icon:'👤', label:'Profile', path:'/profile' },
];

const TITLES = {'/dashboard':'Dashboard','/ideas/new':'New Idea','/mentor':'AI Mentor','/toolkit':'Startup Toolkit','/names':'Name Generator','/funding':'Funding Finder','/revenue':'Revenue Calculator','/marketing':'Marketing Plan','/legal':'Legal & Compliance','/explore':'Explore Ideas','/pricing':'Pricing','/profile':'Profile'};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'U';
  const title = Object.entries(TITLES).find(([k])=>location.pathname.startsWith(k))?.[1] || 'MarketMind';
  return (
    <div className={`app-layout ${collapsed?'collapsed':''}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/dashboard" className="sidebar-logo">
            <div className="logo-icon-sm">M</div>
            {!collapsed && <span>MarketMind</span>}
          </Link>
          <button className="collapse-btn" onClick={()=>setCollapsed(c=>!c)} title={collapsed?'Expand':'Collapse'}>
            {collapsed?'›':'‹'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item,idx)=>{
            if(item.divider) return collapsed?<div key={idx} className="nav-divider-dot"/>:<div key={idx} className="nav-divider">{item.label}</div>;
            const active=location.pathname===item.path||(item.path!=='/dashboard'&&location.pathname.startsWith(item.path));
            return(
              <Link key={item.path} to={item.path} className={`nav-item ${active?'active':''}`} title={collapsed?item.label:''}>
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            {!collapsed && <div style={{overflow:'hidden'}}><p className="user-name">{user?.name}</p><span className="plan-badge">{user?.plan||'Free'}</span></div>}
          </div>
          <button className="logout-btn" onClick={()=>{logout();navigate('/');}}>
            <span className="nav-icon">🚪</span>{!collapsed&&<span>Logout</span>}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <Link to="/ideas/new" style={{padding:'7px 16px',background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)',borderRadius:'8px',color:'var(--primary-light)',fontSize:'12px',fontWeight:'700'}}>+ New Idea</Link>
          </div>
        </div>
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
