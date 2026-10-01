import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Watchlist item must belong to a user'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// Compound index to avoid duplicate symbols in a user's watchlist
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema);
