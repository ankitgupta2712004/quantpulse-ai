import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  Brain,
  Sliders,
  PieChart,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Brain className="w-4 h-4" /> Academic B.Tech CSE (AI &amp; ML) Capstone
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          AI-Driven Advanced Stock <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400">
            Portfolio Management &amp; Risk Analysis
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          An institutional-grade educational decision-support platform combining Modern Portfolio Theory (MPT), Monte Carlo Value-at-Risk (VaR), and FinBERT NLP sentiment intelligence.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            Launch System Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/risk"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all transform hover:-translate-y-0.5"
          >
            Explore Risk Analytics
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 relative group hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Markowitz Optimization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Computes Efficient Frontier &amp; Max Sharpe Ratio allocations using quadratic programming to maximize risk-adjusted returns.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 relative group hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Quantitative Risk (VaR)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates tail risk, Maximum Drawdown, Beta, and 95%/99% parametric and Monte Carlo simulated Value-at-Risk.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 relative group hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">FinBERT Sentiment NLP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transformer-based financial natural language processing to extract market sentiment signals from news and filings.
            </p>
          </div>
        </div>
      </section>

      {/* System Architecture Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Modular Academic Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Built following industry clean-architecture separation: Modern React Client &bull; Node/Express Gateway &bull; Python FastAPI Quantitative Service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-3">
              <Cpu className="w-4 h-4" /> Phase 1: Frontend Client
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> React + Vite SPA</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tailwind CSS Dark Theme</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recharts &amp; Responsive Layouts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Complete 11-Page Route Matrix</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm mb-3">
              <Database className="w-4 h-4" /> Phase 2: Node.js Backend
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Express REST API Gateway</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> MongoDB + Mongoose Portfolio Store</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> JWT Auth &amp; Bcrypt Security</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Live Market Feed Integration</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm mb-3">
              <Brain className="w-4 h-4" /> Phase 3: Python AI/ML
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> FastAPI Microservice</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> SciPy Markowitz Optimizer</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> FinBERT HuggingFace Sentiment</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> NumPy Monte Carlo Simulations</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
