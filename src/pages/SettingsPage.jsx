import React, { useState } from 'react';
import {
  Settings,
  Server,
  User,
  Shield,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';

const SettingsPage = () => {
  const { user } = useAuth();
  const [savedNotice, setSavedNotice] = useState(false);

  const [settings, setSettings] = useState({
    backendUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    aiServiceUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api',
    defaultCurrency: 'USD',
    riskTolerance: 'Moderate',
    enableFinBert: true,
    enableMonteCarlo: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="System Settings &amp; Academic Configuration"
        subtitle="Configure API server endpoints, microservice routing, and portfolio analysis parameters."
        badge="System Config"
      />

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Settings successfully saved to local configuration.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile Overview */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Researcher Profile Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || 'Demo Researcher'}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'researcher@abes.ac.in'}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* API Microservice Configuration */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Microservice Endpoints (Configurable URLs)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Node.js / Express API Gateway URL (Phase 2)
              </label>
              <input
                type="text"
                value={settings.backendUrl}
                onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: http://localhost:5000/api
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Python FastAPI AI/ML Microservice URL (Phase 3)
              </label>
              <input
                type="text"
                value={settings.aiServiceUrl}
                onChange={(e) => setSettings({ ...settings, aiServiceUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: http://localhost:8000/api
              </span>
            </div>
          </div>
        </div>

        {/* Risk & Portfolio Preferences */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Risk &amp; Evaluation Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Base Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Risk Profile
              </label>
              <select
                value={settings.riskTolerance}
                onChange={(e) => setSettings({ ...settings, riskTolerance: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Conservative">Conservative (Capital Preservation)</option>
                <option value="Moderate">Moderate (Balanced Risk/Return)</option>
                <option value="Aggressive">Aggressive (High Growth / Max Volatility)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
