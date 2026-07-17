import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div style={{fontSize:80,marginBottom:16}}>🔍</div>
        <h1 style={{fontSize:64,fontWeight:900,color:'var(--primary)',marginBottom:8,lineHeight:1}}>404</h1>
        <h2 style={{fontSize:22,fontWeight:700,color:'var(--text-primary)',marginBottom:12}}>Page not found</h2>
        <p style={{fontSize:15,color:'var(--text-secondary)',marginBottom:32,maxWidth:380}}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/dashboard" style={{padding:'12px 28px',background:'linear-gradient(135deg,var(--primary),#8b5cf6)',color:'#fff',borderRadius:12,fontWeight:700,fontSize:15}}>
            Go to Dashboard →
          </Link>
          <Link to="/" style={{padding:'12px 24px',border:'1px solid var(--border)',borderRadius:12,color:'var(--text-secondary)',fontWeight:600,fontSize:14}}>
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
