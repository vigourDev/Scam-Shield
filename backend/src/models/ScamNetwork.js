import mongoose from 'mongoose';

const scamNetworkSchema = new mongoose.Schema({
  identifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identifier',
    required: true,
    unique: true
  },
  linkedIdentifiers: [{
    identifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Identifier'
    },
    strength: {
      type: Number,
      min: 0,
      max: 100
    },
    sharedReports: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    }]
  }],
  networkSize: {
    type: Number,
    default: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ScamNetwork', scamNetworkSchema);
