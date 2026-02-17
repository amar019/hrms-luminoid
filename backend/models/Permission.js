const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  resource: { type: String, required: true }, // e.g., 'leaves', 'users', 'reports'
  action: { type: String, required: true }, // e.g., 'create', 'read', 'update', 'delete'
  description: String,
  category: { type: String, required: true }, // e.g., 'Leave Management', 'User Management'
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

permissionSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Permission', permissionSchema);