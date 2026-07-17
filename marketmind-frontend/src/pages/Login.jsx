import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow"/>
      <motion.div className="auth-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <Link to="/" className="auth-logo"><div className="auth-logo-icon">M</div><span>MarketMind</span></Link>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>
        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <><span className="btn-spinner"/> Signing in...</> : 'Sign In →'}
          </button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/register">Sign up free</Link></p>
      </motion.div>
    </div>
  );
}
