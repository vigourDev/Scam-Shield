import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  identifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identifier',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'],
    required: true
  },
  value: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['impersonation', 'phishing', 'ponzi', 'fake_investment', 'romance', 'money_laundering', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  screenshots: [String],
  scamDate: Date,
  amountLost: Number,
  currency: String,
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  approvedBy: mongoose.Schema.Types.ObjectId,
  rejectionReason: String,
  evidence: String,
  linkedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Report', reportSchema);
