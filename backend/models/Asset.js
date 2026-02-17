const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET', 'OTHER'],
    required: true 
  },
  brand: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  purchasePrice: Number,
  warrantyExpiry: Date,
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'],
    default: 'AVAILABLE'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDate: Date,
  returnDate: Date,
  condition: { type: String, enum: ['NEW', 'GOOD', 'FAIR', 'POOR'] },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);