/**
 * Idempotent Seeding Script for NEXORA Hyderabad Fulfillment Network (Phase 11/12)
 * Seeds 10 Hyderabad Fulfillment Hubs, Delivery Agents, and Product Inventory into MongoDB Atlas
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WAREHOUSES, DELIVERY_AGENTS, PRODUCT_INVENTORY } from '../data/deliveryData.js';
import WarehouseModel from '../models/Warehouse.js';
import DeliveryAgentModel from '../models/DeliveryAgent.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://uvarunsagar_db_user:5CoweFeFBVTOMVg6@cluster0.i4ngxra.mongodb.net/NEXORA?retryWrites=true&w=majority&appName=Cluster0';

export async function seedHyderabadNetwork() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB Atlas for Hyderabad Network Seeding.');
    }

    // 1. Seed Warehouses (10 Hyderabad Hubs)
    const warehouseOps = Object.values(WAREHOUSES)
      .filter((w) => w.code) // Filter out legacy string aliases
      .map((w) => ({
        updateOne: {
          filter: { warehouseId: w.warehouseId },
          update: {
            $set: {
              warehouseId: w.warehouseId,
              code: w.code,
              name: w.name,
              city: w.city || 'Hyderabad',
              state: w.state || 'Telangana',
              country: 'India',
              zone: `${w.name} Zone`,
              tier: w.tier || 'TIER_2',
              latitude: w.latitude,
              longitude: w.longitude,
              serviceRadiusKm: w.serviceRadiusKm || 35,
              inventoryCapacity: 5000,
              currentInventoryUnits: 1500,
              dailyOrderCapacity: w.maxOneDayCapacity || 50,
              currentDailyOrders: w.currentReservedCapacity || 10,
              fastDeliveryEnabled: w.oneDayEnabled !== false,
              operatingHours: {
                openingTime: w.openingTime || '08:00',
                closingTime: w.closingTime || '20:00',
              },
              cutoffTime: w.cutoffTime || '15:00',
              demandLevel: w.currentReservedCapacity / w.maxOneDayCapacity > 0.7 ? 'HIGH' : 'LOW',
              active: w.warehouseId !== 'WH-CLOSED',
              assignedAgentIds: DELIVERY_AGENTS.filter((a) => a.warehouseId === w.warehouseId).map((a) => a.agentId),
            },
          },
          upsert: true,
        },
      }));

    if (warehouseOps.length > 0) {
      await WarehouseModel.bulkWrite(warehouseOps);
      console.log(`✅ Seeded ${warehouseOps.length} Hyderabad Fulfillment Hubs into MongoDB.`);
    }

    // 2. Seed Delivery Agents
    const agentOps = DELIVERY_AGENTS.map((agent) => ({
      updateOne: {
        filter: { agentId: agent.agentId },
        update: {
          $set: {
            agentId: agent.agentId,
            name: agent.name,
            warehouseId: agent.warehouseId,
            latitude: agent.currentLocation.latitude,
            longitude: agent.currentLocation.longitude,
            status: agent.status,
            activeDeliveries: agent.activeDeliveries,
            maxCapacity: agent.capacity,
            serviceRadiusKm: 25,
            serviceZones: agent.serviceZones,
          },
        },
        upsert: true,
      },
    }));

    if (agentOps.length > 0) {
      await DeliveryAgentModel.bulkWrite(agentOps);
      console.log(`✅ Seeded ${agentOps.length} Delivery Agents into MongoDB.`);
    }

    console.log('🎉 Hyderabad Fulfillment Network Seeding Complete!');
  } catch (error) {
    console.error('❌ [Seeding Error]', error.message);
  }
}

// Run standalone if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seedHyderabadNetwork().then(() => process.exit(0));
}
