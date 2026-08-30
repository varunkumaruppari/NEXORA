/**
 * Centralized Delivery Domain Data for NEXORA Hyderabad Fulfillment Network (Phase 11/12)
 * 10 Hyderabad Fulfillment Hubs, Geocoding Maps, Product Inventory Matrix, and Delivery Agents
 */

export const WAREHOUSES = {
  // -------------------------------------------------------------
  // TIER 1 HUBS
  // -------------------------------------------------------------
  'WH-HYD-001': {
    warehouseId: 'WH-HYD-001',
    code: 'NEXORA-HYD-001',
    name: 'NEXORA Gachibowli Fulfillment Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    latitude: 17.4238,
    longitude: 78.3375,
    tier: 'TIER_1',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '21:00',
    cutoffTime: '16:00', // 4:00 PM
    maxOneDayCapacity: 100,
    currentReservedCapacity: 25,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500032', '500081', '500084', '500019', '500075', '501501'],
  },
  'WH-HYD-002': {
    warehouseId: 'WH-HYD-002',
    code: 'NEXORA-HYD-002',
    name: 'NEXORA HITEC City Express Center',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    latitude: 17.4435,
    longitude: 78.3772,
    tier: 'TIER_1',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '21:00',
    cutoffTime: '15:30', // 3:30 PM
    maxOneDayCapacity: 90,
    currentReservedCapacity: 18,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500081', '500032', '500084', '500033', '500018'],
  },

  // -------------------------------------------------------------
  // TIER 2 HUBS
  // -------------------------------------------------------------
  'WH-HYD-004': {
    warehouseId: 'WH-HYD-004',
    code: 'NEXORA-HYD-004',
    name: 'NEXORA Kukatpally Logistics Center',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500072',
    latitude: 17.4849,
    longitude: 78.4138,
    tier: 'TIER_2',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:00', // 3:00 PM
    maxOneDayCapacity: 60,
    currentReservedCapacity: 60, // Capacity FULL for testing!
    serviceRadiusKm: 35,
    serviceablePincodes: ['500072', '500085', '500090', '500055', '122002'],
  },
  'WH-HYD-005': {
    warehouseId: 'WH-HYD-005',
    code: 'NEXORA-HYD-005',
    name: 'NEXORA Secunderabad Central Depot',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500003',
    latitude: 17.4399,
    longitude: 78.4983,
    tier: 'TIER_2',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '19:00',
    cutoffTime: '14:00', // 2:00 PM
    maxOneDayCapacity: 50,
    currentReservedCapacity: 48,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500003', '500001', '500025', '500061', '400001'],
  },
  'WH-HYD-006': {
    warehouseId: 'WH-HYD-006',
    code: 'NEXORA-HYD-006',
    name: 'NEXORA Begumpet Fulfillment Station',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500016',
    latitude: 17.4448,
    longitude: 78.4661,
    tier: 'TIER_2',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:00',
    maxOneDayCapacity: 55,
    currentReservedCapacity: 12,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500016', '500003', '500082', '500004'],
  },
  'WH-HYD-007': {
    warehouseId: 'WH-HYD-007',
    code: 'NEXORA-HYD-007',
    name: 'NEXORA Uppal East Fulfillment Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500039',
    latitude: 17.4057,
    longitude: 78.5601,
    tier: 'TIER_2',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:00',
    maxOneDayCapacity: 50,
    currentReservedCapacity: 10,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500039', '500007', '500076', '500098'],
  },

  // -------------------------------------------------------------
  // TIER 3 HUBS
  // -------------------------------------------------------------
  'WH-HYD-003': {
    warehouseId: 'WH-HYD-003',
    code: 'NEXORA-HYD-003',
    name: 'NEXORA Madhapur Urban Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    latitude: 17.4483,
    longitude: 78.3915,
    tier: 'TIER_3',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:00',
    maxOneDayCapacity: 40,
    currentReservedCapacity: 14,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500081', '500033'],
  },
  'WH-HYD-008': {
    warehouseId: 'WH-HYD-008',
    code: 'NEXORA-HYD-008',
    name: 'NEXORA LB Nagar South Logistics Depot',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500074',
    latitude: 17.3457,
    longitude: 78.5522,
    tier: 'TIER_3',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '14:30',
    maxOneDayCapacity: 40,
    currentReservedCapacity: 8,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500074', '500035', '500068', '500070'],
  },
  'WH-HYD-009': {
    warehouseId: 'WH-HYD-009',
    code: 'NEXORA-HYD-009',
    name: 'NEXORA Mehdipatnam Express Station',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500028',
    latitude: 17.3916,
    longitude: 78.4398,
    tier: 'TIER_3',
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:00',
    maxOneDayCapacity: 35,
    currentReservedCapacity: 7,
    serviceRadiusKm: 35,
    serviceablePincodes: ['500028', '500008', '500057'],
  },
  'WH-HYD-010': {
    warehouseId: 'WH-HYD-010',
    code: 'NEXORA-HYD-010',
    name: 'NEXORA Shamshabad Airport Fulfillment Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '501218',
    latitude: 17.2403,
    longitude: 78.4294,
    tier: 'TIER_3',
    oneDayEnabled: true,
    openingTime: '09:00',
    closingTime: '10:00', // Closed early for operating hours testing!
    cutoffTime: '09:30',
    maxOneDayCapacity: 30,
    currentReservedCapacity: 0,
    serviceRadiusKm: 35,
    serviceablePincodes: ['501218', '500099'],
  },
};

// -------------------------------------------------------------
// LEGACY WAREHOUSE ALIASES (For 100% Backward Compatibility)
// -------------------------------------------------------------
WAREHOUSES['WH-HYD'] = WAREHOUSES['WH-HYD-002'];
WAREHOUSES['WH-BLR'] = WAREHOUSES['WH-HYD-001'];
WAREHOUSES['WH-MUM'] = WAREHOUSES['WH-HYD-005'];
WAREHOUSES['WH-DEL'] = WAREHOUSES['WH-HYD-004'];
WAREHOUSES['WH-CLOSED'] = WAREHOUSES['WH-HYD-010'];

export const DELIVERY_ZONES = {
  // Gachibowli / Cyberabad
  '500032': { pincode: '500032', city: 'Hyderabad', state: 'Telangana', latitude: 17.4401, longitude: 78.3489, zoneName: 'Hyderabad Gachibowli Tech Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-001', standardTransitDays: 2 },
  '500081': { pincode: '500081', city: 'Hyderabad', state: 'Telangana', latitude: 17.4485, longitude: 78.3810, zoneName: 'Hyderabad HITEC City Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-002', standardTransitDays: 2 },
  '500084': { pincode: '500084', city: 'Hyderabad', state: 'Telangana', latitude: 17.4589, longitude: 78.3654, zoneName: 'Kondapur Tech Hub Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-001', standardTransitDays: 2 },

  // Central / Secunderabad / Begumpet
  '500001': { pincode: '500001', city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, zoneName: 'Hyderabad Abids Central Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-006', standardTransitDays: 2 },
  '500003': { pincode: '500003', city: 'Hyderabad', state: 'Telangana', latitude: 17.4399, longitude: 78.4983, zoneName: 'Secunderabad RP Road Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-005', standardTransitDays: 2 },
  '500016': { pincode: '500016', city: 'Hyderabad', state: 'Telangana', latitude: 17.4448, longitude: 78.4661, zoneName: 'Begumpet Airport Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-006', standardTransitDays: 2 },

  // Kukatpally / Miyapur
  '500072': { pincode: '500072', city: 'Hyderabad', state: 'Telangana', latitude: 17.4849, longitude: 78.4138, zoneName: 'Kukatpally KPHB Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-004', standardTransitDays: 2 },

  // Uppal / East
  '500039': { pincode: '500039', city: 'Hyderabad', state: 'Telangana', latitude: 17.4057, longitude: 78.5601, zoneName: 'Uppal Industrial Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-007', standardTransitDays: 2 },

  // LB Nagar / South East
  '500074': { pincode: '500074', city: 'Hyderabad', state: 'Telangana', latitude: 17.3457, longitude: 78.5522, zoneName: 'LB Nagar Junction Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-008', standardTransitDays: 2 },

  // Mehdipatnam / West
  '500028': { pincode: '500028', city: 'Hyderabad', state: 'Telangana', latitude: 17.3916, longitude: 78.4398, zoneName: 'Mehdipatnam Commercial Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-009', standardTransitDays: 2 },

  // Jubilee Hills Busy Agent Testing
  '500033': { pincode: '500033', city: 'Hyderabad', state: 'Telangana', latitude: 17.4300, longitude: 78.4000, zoneName: 'Jubilee Hills Luxury Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-003', standardTransitDays: 2 },

  // Shamshabad / Maintenance Zone
  '501218': { pincode: '501218', city: 'Hyderabad', state: 'Telangana', latitude: 17.2403, longitude: 78.4294, zoneName: 'Shamshabad Airport Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-010', standardTransitDays: 2 },
  '500099': { pincode: '500099', city: 'Hyderabad', state: 'Telangana', latitude: 17.2400, longitude: 78.4200, zoneName: 'Hyderabad Maintenance Depot Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-010', standardTransitDays: 2 },

  // Outskirts Far Distance (>35 km from main hubs)
  '501501': { pincode: '501501', city: 'Vikarabad Outskirts', state: 'Telangana', latitude: 17.3364, longitude: 77.9048, zoneName: 'Telangana Remote Border Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-001', standardTransitDays: 2 },

  // Standard-Only Regional Zones (Outside Hyderabad)
  '560100': { pincode: '560100', city: 'Bengaluru', state: 'Karnataka', latitude: 12.8452, longitude: 77.6602, zoneName: 'Bengaluru Regional Connection', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-001', standardTransitDays: 2 },
  '400001': { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9388, longitude: 72.8353, zoneName: 'Mumbai Regional Connection', serviceable: true, oneDayEligible: false, primaryWarehouse: 'WH-HYD-005', standardTransitDays: 2 },
  '122002': { pincode: '122002', city: 'Gurugram', state: 'Haryana', latitude: 28.4842, longitude: 77.0917, zoneName: 'Gurugram Regional Connection', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD-004', standardTransitDays: 2 },
  '700001': { pincode: '700001', city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, zoneName: 'Kolkata Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },
  '600001': { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, zoneName: 'Chennai Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },

  // Non-Serviceable Remote Zone
  '999999': { pincode: '999999', city: 'Remote Station', state: 'Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973, zoneName: 'Restricted Mountain Zone', serviceable: false, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 0 },
};

export const DELIVERY_AGENTS = [
  // Gachibowli WH-HYD-001 (Tier 1: 18 agents)
  { agentId: 'AGT-HYD-001-A', name: 'Vikram Singh', warehouseId: 'WH-HYD-001', status: 'AVAILABLE', currentLocation: { latitude: 17.4410, longitude: 78.3490 }, activeDeliveries: 2, capacity: 6, serviceRadiusKm: 25, serviceZones: ['500032', '500081', '500084', '560100', '501501'] },
  { agentId: 'AGT-HYD-001-B', name: 'Suresh Kumar', warehouseId: 'WH-HYD-001', status: 'AVAILABLE', currentLocation: { latitude: 17.4420, longitude: 78.3500 }, activeDeliveries: 1, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500032', '500081'] },
  { agentId: 'AGT-HYD-01', name: 'Vikram Singh', warehouseId: 'WH-HYD-001', status: 'AVAILABLE', currentLocation: { latitude: 17.4410, longitude: 78.3490 }, activeDeliveries: 2, capacity: 6, serviceRadiusKm: 25, serviceZones: ['500081', '500032', '501501'] },

  // HITEC City WH-HYD-002 (Tier 1: 20 agents)
  { agentId: 'AGT-HYD-002-A', name: 'Priya Sharma', warehouseId: 'WH-HYD-002', status: 'AVAILABLE', currentLocation: { latitude: 17.4440, longitude: 78.3780 }, activeDeliveries: 1, capacity: 6, serviceRadiusKm: 25, serviceZones: ['500081', '500032', '500084'] },
  { agentId: 'AGT-HYD-002-B', name: 'Rahul Reddy', warehouseId: 'WH-HYD-002', status: 'AVAILABLE', currentLocation: { latitude: 17.4450, longitude: 78.3790 }, activeDeliveries: 3, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500081'] },

  // Kukatpally WH-HYD-004 (Tier 2: 12 agents)
  { agentId: 'AGT-HYD-004-A', name: 'Amit Patel', warehouseId: 'WH-HYD-004', status: 'AVAILABLE', currentLocation: { latitude: 17.4850, longitude: 78.4140 }, activeDeliveries: 2, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500072', '122002'] },
  { agentId: 'AGT-DEL-01', name: 'Manish Verma', warehouseId: 'WH-HYD-004', status: 'AVAILABLE', currentLocation: { latitude: 17.4860, longitude: 78.4150 }, activeDeliveries: 2, capacity: 6, serviceRadiusKm: 25, serviceZones: ['122002', '500072'] },

  // Madhapur WH-HYD-003 (Tier 3: agents set to BUSY for agent capacity testing)
  { agentId: 'AGT-HYD-003-A', name: 'Karthik Rao', warehouseId: 'WH-HYD-003', status: 'BUSY', currentLocation: { latitude: 17.4490, longitude: 78.3920 }, activeDeliveries: 5, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500033'] },
  { agentId: 'AGT-HYD-BUSY', name: 'Suresh Raina', warehouseId: 'WH-HYD-003', status: 'BUSY', currentLocation: { latitude: 17.4300, longitude: 78.4000 }, activeDeliveries: 5, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500033'] },
  { agentId: 'AGT-DEL-FULL', name: 'Amit Patel', warehouseId: 'WH-HYD-004', status: 'BUSY', currentLocation: { latitude: 17.4849, longitude: 78.4138 }, activeDeliveries: 5, capacity: 5, serviceRadiusKm: 25, serviceZones: ['122002', '500072'] },
  { agentId: 'AGT-OFFLINE', name: 'Devendra Prasad', warehouseId: 'WH-HYD-001', status: 'OFFLINE', currentLocation: { latitude: 17.4400, longitude: 78.3400 }, activeDeliveries: 0, capacity: 5, serviceRadiusKm: 25, serviceZones: ['500081'] },
];

export const PRODUCT_INVENTORY = {
  'PROD-1001': { // Wireless Headphones
    name: 'Wireless Headphones',
    warehouses: {
      'WH-HYD-001': { quantity: 35, reservedQuantity: 2, stock: 33, oneDay: true },
      'WH-HYD-002': { quantity: 25, reservedQuantity: 2, stock: 23, oneDay: true },
      'WH-HYD-003': { quantity: 30, reservedQuantity: 1, stock: 29, oneDay: true },
      'WH-HYD-004': { quantity: 15, reservedQuantity: 1, stock: 14, oneDay: true },
      'WH-HYD-005': { quantity: 15, reservedQuantity: 0, stock: 15, oneDay: false },
      'WH-HYD-006': { quantity: 20, reservedQuantity: 0, stock: 20, oneDay: true },
      'WH-HYD-007': { quantity: 10, reservedQuantity: 0, stock: 10, oneDay: true },
      'WH-HYD-008': { quantity: 12, reservedQuantity: 0, stock: 12, oneDay: true },
      'WH-HYD-009': { quantity: 18, reservedQuantity: 0, stock: 18, oneDay: true },
      'WH-HYD-010': { quantity: 10, reservedQuantity: 0, stock: 10, oneDay: true },
    },
  },
  'PROD-1002': { // Premium Phone Case
    name: 'Premium Phone Case',
    warehouses: {
      'WH-HYD-001': { quantity: 50, reservedQuantity: 5, stock: 45, oneDay: true },
      'WH-HYD-002': { quantity: 60, reservedQuantity: 4, stock: 56, oneDay: true },
      'WH-HYD-004': { quantity: 20, reservedQuantity: 1, stock: 19, oneDay: true },
      'WH-HYD-005': { quantity: 30, reservedQuantity: 2, stock: 28, oneDay: false },
      'WH-HYD-006': { quantity: 40, reservedQuantity: 0, stock: 40, oneDay: true },
    },
  },
  'PROD-1003': { // Smartwatch
    name: 'Smartwatch',
    warehouses: {
      'WH-HYD-001': { quantity: 15, reservedQuantity: 3, stock: 12, oneDay: true },
      'WH-HYD-002': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-HYD-003': { quantity: 10, reservedQuantity: 0, stock: 10, oneDay: true },
      'WH-HYD-004': { quantity: 5, reservedQuantity: 0, stock: 5, oneDay: true },
      'WH-HYD-005': { quantity: 10, reservedQuantity: 1, stock: 9, oneDay: false },
    },
  },
  'PROD-1004': { // Premium Smartphone
    name: 'Premium Smartphone',
    warehouses: {
      'WH-HYD-001': { quantity: 12, reservedQuantity: 2, stock: 10, oneDay: true },
      'WH-HYD-002': { quantity: 8, reservedQuantity: 1, stock: 7, oneDay: true },
      'WH-HYD-004': { quantity: 2, reservedQuantity: 0, stock: 2, oneDay: true },
      'WH-HYD-005': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: false },
    },
  },
  'PROD-1005': { // Mechanical Gaming Keyboard
    name: 'Mechanical Gaming Keyboard',
    warehouses: {
      'WH-HYD-001': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-HYD-002': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-HYD-005': { quantity: 5, reservedQuantity: 0, stock: 5, oneDay: false }, // Standard only
    },
  },
  'PROD-1006': { // Wireless Ergonomic Mouse
    name: 'Wireless Ergonomic Mouse',
    warehouses: {
      'WH-HYD-001': { quantity: 20, reservedQuantity: 2, stock: 18, oneDay: true },
      'WH-HYD-002': { quantity: 30, reservedQuantity: 4, stock: 26, oneDay: true },
      'WH-HYD-006': { quantity: 15, reservedQuantity: 0, stock: 15, oneDay: true },
    },
  },
  'PROD-RESERVED-FULL': { // All inventory reserved
    name: 'Limited Collector Edition Headphones',
    warehouses: {
      'WH-HYD-001': { quantity: 10, reservedQuantity: 10, stock: 0, oneDay: true },
      'WH-HYD-002': { quantity: 5, reservedQuantity: 5, stock: 0, oneDay: true },
    },
  },
  'PROD-OUT-OF-STOCK': { // Completely out of stock
    name: 'Discontinued AR Glasses',
    warehouses: {
      'WH-HYD-001': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-HYD-002': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-HYD-005': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: false },
    },
  },
};
