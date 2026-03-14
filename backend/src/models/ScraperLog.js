import mongoose from 'mongoose';

const scraperLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  recordsFetched: {
    type: Number,
    default: 0
  },
  recordsSaved: {
    type: Number,
    default: 0
  },
  errorMessages: {
    type: [String],
    default: []
  },
  durationMs: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('ScraperLog', scraperLogSchema);
