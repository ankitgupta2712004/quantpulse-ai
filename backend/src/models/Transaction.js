import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: [true, 'Transaction must belong to a portfolio'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Stock ticker symbol is required'],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['BUY', 'SELL'],
        message: 'Transaction type must be either BUY or SELL',
      },
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Transaction quantity is required'],
      min: [0.0001, 'Quantity must be greater than 0'],
    },
    price: {
      type: Number,
      required: [true, 'Execution price is required'],
      min: [0, 'Execution price cannot be negative'],
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Transaction', transactionSchema);
