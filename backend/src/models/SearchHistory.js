import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'],
    required: true
  },
  riskScore: Number,
  status: String,
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('SearchHistory', searchHistorySchema);
