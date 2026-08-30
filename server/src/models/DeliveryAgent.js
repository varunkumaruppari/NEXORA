import mongoose from 'mongoose';

const DeliveryAgentSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  warehouseId: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_DELIVERY'],
    default: 'AVAILABLE',
  },
  activeDeliveries: {
    type: Number,
    default: 0,
  },
  maxCapacity: {
    type: Number,
    default: 5,
  },
  serviceRadiusKm: {
    type: Number,
    default: 25,
  },
  serviceZones: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.DeliveryAgent || mongoose.model('DeliveryAgent', DeliveryAgentSchema);
