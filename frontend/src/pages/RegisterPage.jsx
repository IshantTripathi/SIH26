import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, Building2, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const [activeTab, setActiveTab] = useState('customer'); // customer | worker | society_admin | federation_admin
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: 'password123',
    address: '',
    serviceArea: 'Central Metro',
    primarySkill: 'Plumbing',
    experienceYears: '3',
    societyId: 'SOC-DEMO-001',
    federationId: 'FED-DEMO-001'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...formData,
      role: activeTab,
      experienceYears: Number(formData.experienceYears) || 2
    };

    const res = await register(payload);
    setSubmitting(false);

    if (res.success) {
      if (activeTab === 'customer') navigate('/customer');
      else if (activeTab === 'worker') navigate('/worker');
      else if (activeTab === 'society_admin') navigate('/society');
      else if (activeTab === 'federation_admin') navigate('/federation');
      else navigate('/');
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Create Cooperative Account</h1>
        <p className="text-xs text-slate-500">
          Register with the National Cooperative Gig Infrastructure (Ministry of Cooperation / NCCT)
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('customer')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'customer' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('worker')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'worker' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Worker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('society_admin')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'society_admin' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Society</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('federation_admin')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'federation_admin' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Federation</span>
        </button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Official Name / Title</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Worker Demo 11"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@demo.coop"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="9876543210"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm font-mono"
              />
            </div>
          </div>

          {/* Customer Specific Fields */}
          {activeTab === 'customer' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address / Service Location</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="B-12, Green Avenue, Central Metro"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>
          )}

          {/* Worker Specific Fields */}
          {activeTab === 'worker' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Skill Trade</label>
                  <select
                    name="primarySkill"
                    value={formData.primarySkill}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                    <option value="Caregiving">Caregiving</option>
                    <option value="Gardening">Gardening</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Affiliated Society</label>
                  <select
                    name="societyId"
                    value={formData.societyId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="SOC-DEMO-001">Central Metro Labour Society</option>
                    <option value="SOC-DEMO-002">Eastern Suburban Labour Society</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Area / District</label>
                <input
                  type="text"
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleChange}
                  placeholder="e.g. Connaught Place, Central Metro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}

          {/* Society Admin Specific */}
          {activeTab === 'society_admin' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Society Identifier</label>
              <select
                name="societyId"
                value={formData.societyId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="SOC-DEMO-001">Central Metro Labour Society (SOC-DEMO-001)</option>
                <option value="SOC-DEMO-002">Eastern Suburban Labour Society (SOC-DEMO-002)</option>
              </select>
            </div>
          )}

          {/* Federation Admin Specific */}
          {activeTab === 'federation_admin' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Federation Identifier</label>
              <input
                type="text"
                name="federationId"
                value={formData.federationId}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 font-mono text-slate-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white py-2.5 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Creating Account...' : `Register as ${activeTab.replace('_', ' ').toUpperCase()}`}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-900 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
