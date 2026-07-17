import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';
const INDUSTRIES = ['Food & Beverage','Technology & SaaS','Retail & E-commerce','Education & Training','Health & Wellness','Finance & FinTech','Agriculture & AgriTech','Other'];
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', profile: { bio: user?.profile?.bio || '', location: user?.profile?.location || '', industry: user?.profile?.industry || '', experience: user?.profile?.experience || 'idea' } });
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const saveProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.put('/users/profile', form); updateUser(res.data.user); toast.success('Profile updated!'); }
    catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPass !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPass.length < 6) return toast.error('Password must be at least 6 characters');
    setPwLoading(true);
    try { await api.put('/users/password', { currentPassword: pwForm.current, newPassword: pwForm.newPass }); toast.success('Password updated!'); setPwForm({ current: '', newPass: '', confirm: '' }); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to update password'); }
    finally { setPwLoading(false); }
  };
  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <div className="profile-body">
        <div className="profile-left">
          <div className="profile-card">
            <div className="profile-avatar">{initials}</div>
            <h3>{user?.name}</h3>
            <p className="profile-email">{user?.email}</p>
            <span className="plan-badge-lg">{user?.plan} plan</span>
            <div className="profile-stats">
              <div><span>{user?.stats?.ideasAnalyzed || 0}</span><small>Ideas</small></div>
              <div><span>{user?.stats?.reportsGenerated || 0}</span><small>Reports</small></div>
              <div><span>{user?.stats?.streak || 0}</span><small>Streak</small></div>
            </div>
            <p className="profile-joined">Joined {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="profile-right">
          <div className="profile-section">
            <h2>Edit Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="ps-field"><label>Full Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></div>
              <div className="ps-field"><label>Bio</label><textarea value={form.profile.bio} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, bio: e.target.value } }))} placeholder="Tell us about yourself..." rows={3}/></div>
              <div className="ps-grid">
                <div className="ps-field"><label>Location</label><input value={form.profile.location} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, location: e.target.value } }))} placeholder="e.g. Lahore, Pakistan"/></div>
                <div className="ps-field"><label>Industry Focus</label><select value={form.profile.industry} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, industry: e.target.value } }))}><option value="">Select</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
              </div>
              <div className="ps-field"><label>Stage</label><select value={form.profile.experience} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, experience: e.target.value } }))}><option value="idea">Just an Idea</option><option value="early">Early Stage</option><option value="growth">Growth</option><option value="scale">Scale</option></select></div>
              <button type="submit" className="save-btn" disabled={loading}>{loading ? <span className="btn-spinner"/> : 'Save Changes'}</button>
            </form>
          </div>
          <div className="profile-section">
            <h2>Change Password</h2>
            <form onSubmit={changePassword}>
              <div className="ps-field"><label>Current Password</label><input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••"/></div>
              <div className="ps-grid">
                <div className="ps-field"><label>New Password</label><input type="password" value={pwForm.newPass} onChange={e => setPwForm(f => ({ ...f, newPass: e.target.value }))} placeholder="Min. 6 characters"/></div>
                <div className="ps-field"><label>Confirm New Password</label><input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat"/></div>
              </div>
              <button type="submit" className="save-btn" disabled={pwLoading}>{pwLoading ? <span className="btn-spinner"/> : 'Update Password'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
