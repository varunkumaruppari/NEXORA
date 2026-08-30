import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema({
  warehouseId: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    default: 'Hyderabad',
  },
  state: {
    type: String,
    default: 'Telangana',
  },
  country: {
    type: String,
    default: 'India',
  },
  zone: {
    type: String,
    required: true,
  },
  tier: {
    type: String,
    enum: ['TIER_1', 'TIER_2', 'TIER_3'],
    default: 'TIER_2',
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  serviceRadiusKm: {
    type: Number,
    default: 35,
  },
  inventoryCapacity: {
    type: Number,
    default: 5000,
  },
  currentInventoryUnits: {
    type: Number,
    default: 1200,
  },
  dailyOrderCapacity: {
    type: Number,
    default: 100,
  },
  currentDailyOrders: {
    type: Number,
    default: 25,
  },
  fastDeliveryEnabled: {
    type: Boolean,
    default: true,
  },
  operatingHours: {
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '20:00' },
  },
  cutoffTime: {
    type: String,
    default: '15:00',
  },
  demandLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
    default: 'LOW',
  },
  active: {
    type: Boolean,
    default: true,
  },
  assignedAgentIds: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
