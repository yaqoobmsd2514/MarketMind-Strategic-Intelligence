import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if(form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to MarketMind 🎉');
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow"/>
      <motion.div className="auth-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <Link to="/" className="auth-logo"><div className="auth-logo-icon">M</div><span>MarketMind</span></Link>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start analyzing your business idea for free</p>
        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <input type="text" placeholder="Ali Hassan" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
          </div>
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <><span className="btn-spinner"/> Creating account...</> : 'Create Account Free →'}
          </button>
        </form>
        <p className="auth-perks">✓ No credit card required · ✓ Free forever plan · ✓ Cancel anytime</p>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
