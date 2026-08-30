import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Shield, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration submit:', formData);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1">Get started with RESOLV AI platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Account Role
            </label>
            <div className="relative">
              <Shield className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="customer">Customer</option>
                <option value="agent">Customer Service Agent</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <span>Register Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
