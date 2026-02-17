const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: String,
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);