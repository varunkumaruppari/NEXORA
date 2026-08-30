import mongoose from 'mongoose';

const DeliveryAuditSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true,
  },
  productId: {
    type: String,
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  eligible: {
    type: Boolean,
    required: true,
  },
  deliveryType: {
    type: String,
    enum: ['ONE_DAY', 'STANDARD', 'NONE'],
    required: true,
  },
  estimatedDeliveryDate: {
    type: String,
    default: null,
  },
  warehouseId: {
    type: String,
    default: null,
  },
  reasonCode: {
    type: String,
    required: true,
  },
  customerMessage: {
    type: String,
    required: true,
  },
  cutoffTime: {
    type: String,
    default: null,
  },
  capacityStatus: {
    type: String,
    default: null,
  },
  evaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.DeliveryAudit || mongoose.model('DeliveryAudit', DeliveryAuditSchema);
