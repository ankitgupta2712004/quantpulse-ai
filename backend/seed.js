/**
 * QuantPulse AI - Demo Data Seed Script
 * ======================================
 * Creates:
 *  - 1 demo user  (demo@quantpulse.ai / Demo@12345)
 *  - 1 demo portfolio  ("Demo Portfolio - Tech Growth")
 *  - 5 holdings  (AAPL, MSFT, GOOGL, AMZN, NVDA)
 *
 * SAFE: idempotent - will NOT create duplicates on re-runs.
 *
 * Usage:
 *   cd backend
 *   node seed.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const holdingSchema = new mongoose.Schema(
  {
    portfolioId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    symbol:          { type: String, required: true, uppercase: true, trim: true },
    quantity:        { type: Number, required: true, min: 0 },
    averageBuyPrice: { type: Number, required: true, min: 0 },
    sector:          { type: String, trim: true, default: 'General' },
  },
  { timestamps: true }
);
holdingSchema.index({ portfolioId: 1, symbol: 1 }, { unique: true });

const transactionSchema = new mongoose.Schema(
  {
    portfolioId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    symbol:          { type: String, required: true, uppercase: true, trim: true },
    type:            { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity:        { type: Number, required: true },
    price:           { type: Number, required: true },
    transactionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User        = mongoose.model('User',        userSchema);
const Portfolio   = mongoose.model('Portfolio',   portfolioSchema);
const Holding     = mongoose.model('Holding',     holdingSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

const DEMO_USER = {
  name:     'Demo User',
  email:    'demo@quantpulse.ai',
  password: 'Demo@12345',
};

const DEMO_PORTFOLIO = {
  name:        'Demo Portfolio - Tech Growth',
  description: '[DEMO DATA] Diversified technology growth portfolio for demonstration purposes. averageBuyPrice values are approximate historical cost-basis figures and do NOT represent live market prices.',
};

// averageBuyPrice = approximate historical weighted average cost basis (2022-2024).
// These are DEMO/HISTORICAL values - not guaranteed future prices.
const DEMO_HOLDINGS = [
  { symbol: 'AAPL', quantity: 50, averageBuyPrice: 155.00, sector: 'Technology' },
  { symbol: 'MSFT', quantity: 30, averageBuyPrice: 310.00, sector: 'Technology' },
  { symbol: 'GOOGL', quantity: 40, averageBuyPrice: 130.00, sector: 'Communication Services' },
  { symbol: 'AMZN', quantity: 35, averageBuyPrice: 145.00, sector: 'Consumer Discretionary' },
  { symbol: 'NVDA', quantity: 25, averageBuyPrice: 420.00, sector: 'Technology' },
];

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quantpulse';
  console.log('\n[Seed] Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('[Seed] Connected.\n');

  let user = await User.findOne({ email: DEMO_USER.email }).select('+password');
  if (user) {
    console.log('[Seed] Demo user already exists. Skipping user creation.');
  } else {
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(DEMO_USER.password, salt);
    user = await User.create({ name: DEMO_USER.name, email: DEMO_USER.email, password: hashed });
    console.log('[Seed] Created demo user:', user.email, '(id:', user._id + ')');
  }

  let portfolio = await Portfolio.findOne({ userId: user._id, name: DEMO_PORTFOLIO.name });
  if (portfolio) {
    console.log('[Seed] Demo portfolio already exists. Skipping portfolio creation.');
  } else {
    portfolio = await Portfolio.create({ userId: user._id, name: DEMO_PORTFOLIO.name, description: DEMO_PORTFOLIO.description });
    console.log('[Seed] Created demo portfolio:', portfolio.name, '(id:', portfolio._id + ')');
  }

  for (const h of DEMO_HOLDINGS) {
    const existing = await Holding.findOne({ portfolioId: portfolio._id, symbol: h.symbol });
    if (existing) { console.log('[Seed]   Holding', h.symbol, 'already exists. Skipping.'); continue; }
    await Holding.create({ portfolioId: portfolio._id, symbol: h.symbol, quantity: h.quantity, averageBuyPrice: h.averageBuyPrice, sector: h.sector });
    await Transaction.create({ portfolioId: portfolio._id, symbol: h.symbol, type: 'BUY', quantity: h.quantity, price: h.averageBuyPrice, transactionDate: new Date('2024-01-15') });
    console.log('[Seed]   Added', h.symbol, 'qty=' + h.quantity, 'avgPrice=$' + h.averageBuyPrice, 'sector=' + h.sector);
  }

  const allHoldings = await Holding.find({ portfolioId: portfolio._id });
  const totalCostBasis = allHoldings.reduce((s, h) => s + h.quantity * h.averageBuyPrice, 0);

  console.log('\n--- Seed complete ---');
  console.log('User:       ', DEMO_USER.name, '<' + DEMO_USER.email + '>');
  console.log('Password:    Demo@12345');
  console.log('Portfolio:  ', portfolio.name);
  console.log('Holdings:   ', allHoldings.length, 'positions');
  console.log('Cost Basis: $' + totalCostBasis.toFixed(2), '(DEMO/historical approximation)');
  allHoldings.forEach(h => console.log(' ', h.symbol, 'qty=' + h.quantity, '$' + h.averageBuyPrice, h.sector));
  console.log('NOTE: averageBuyPrice values are DEMO/historical approximations, not live prices.\n');

  await mongoose.disconnect();
  console.log('[Seed] Done.\n');
}

seed().catch(err => { console.error('[Seed] Fatal:', err.message); process.exit(1); });
