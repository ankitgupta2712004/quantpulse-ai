import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: [true, 'Holding must belong to a portfolio'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    averageBuyPrice: {
      type: Number,
      required: [true, 'Average buy price is required'],
      min: [0, 'Average buy price cannot be negative'],
    },
    sector: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate holding entries per portfolio
holdingSchema.index({ portfolioId: 1, symbol: 1 }, { unique: true });

export default mongoose.model('Holding', holdingSchema);
