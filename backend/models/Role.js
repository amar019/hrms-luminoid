const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false }, // System roles cannot be deleted
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);