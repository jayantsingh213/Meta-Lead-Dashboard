const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    metaLeadId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: 'N/A'
    },
    email: {
      type: String,
      default: 'N/A'
    },
    phone: {
      type: String,
      default: 'N/A'
    },
    createdTime: {
      type: String
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    rawFields: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Lead', leadSchema);
