import mongoose from 'mongoose';

const identifierSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'],
    required: true
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  reportsCount: {
    type: Number,
    default: 0
  },
  blacklisted: {
    type: Boolean,
    default: false
  },
  suspiciousPatterns: [String],
  firstReported: Date,
  lastReported: {
    type: Date,
    default: null
  },
  linkedIdentifiers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identifier'
  }],
  isPublicData: {
    type: Boolean,
    default: false
  },
  source: String,
  category: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index prevents duplicate identifiers of the same type
identifierSchema.index({ type: 1, value: 1 }, { unique: true });

// Auto-calculate risk score when reports or blacklist status changes
identifierSchema.methods.calculateRiskScore = function() {
  let score = (this.reportsCount * 10) + (this.blacklisted ? 20 : 0) + (this.suspiciousPatterns.length * 5);
  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

export default mongoose.model('Identifier', identifierSchema);
