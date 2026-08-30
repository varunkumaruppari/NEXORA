/**
 * Centralized Delivery Domain Data for NEXORA Fast Delivery Intelligence
 */

export const WAREHOUSES = {
  'WH-HYD': {
    warehouseId: 'WH-HYD',
    name: 'Hyderabad Central Fulfillment Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    latitude: 17.3850,
    longitude: 78.4867,
    oneDayEnabled: true,
    openingTime: '08:00', // 8:00 AM
    closingTime: '20:00', // 8:00 PM
    cutoffTime: '15:00',  // 3:00 PM
    maxOneDayCapacity: 50,
    currentReservedCapacity: 12,
    serviceablePincodes: ['500081', '500001', '500002', '500032', '500082', '500033'],
  },
  'WH-BLR': {
    warehouseId: 'WH-BLR',
    name: 'Bengaluru Tech Logistics Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    latitude: 12.9716,
    longitude: 77.5946,
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '21:00',
    cutoffTime: '16:00',  // 4:00 PM
    maxOneDayCapacity: 40,
    currentReservedCapacity: 8,
    serviceablePincodes: ['560100', '560001', '560002', '560034', '560037', '560066'],
  },
  'WH-MUM': {
    warehouseId: 'WH-MUM',
    name: 'Mumbai Coastal Warehousing',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
    oneDayEnabled: false, // One-Day Disabled for Mumbai Maintenance
    openingTime: '08:00',
    closingTime: '19:00',
    cutoffTime: '14:00',  // 2:00 PM
    maxOneDayCapacity: 20,
    currentReservedCapacity: 19,
    serviceablePincodes: ['400001', '400002', '400050', '400051', '400099'],
  },
  'WH-DEL': {
    warehouseId: 'WH-DEL',
    name: 'Delhi NCR Express Center',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    latitude: 28.4595,
    longitude: 77.0266,
    oneDayEnabled: true,
    openingTime: '08:00',
    closingTime: '20:00',
    cutoffTime: '15:30',  // 3:30 PM
    maxOneDayCapacity: 30,
    currentReservedCapacity: 30, // Capacity FULL for testing!
    serviceablePincodes: ['122002', '110001', '110002', '122001', '122018'],
  },
  'WH-CLOSED': {
    warehouseId: 'WH-CLOSED',
    name: 'Maintenance Fulfillment Depot',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500099',
    latitude: 17.4000,
    longitude: 78.4500,
    oneDayEnabled: true,
    openingTime: '09:00',
    closingTime: '10:00', // Closed early for testing!
    cutoffTime: '09:30',
    maxOneDayCapacity: 10,
    currentReservedCapacity: 0,
    serviceablePincodes: ['500099'],
  },
};

export const DELIVERY_ZONES = {
  // Hyderabad
  '500081': { pincode: '500081', city: 'Hyderabad', state: 'Telangana', latitude: 17.4401, longitude: 78.3489, zoneName: 'Hyderabad Cyberabad Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500001': { pincode: '500001', city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, zoneName: 'Hyderabad Central Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500002': { pincode: '500002', city: 'Hyderabad', state: 'Telangana', latitude: 17.3616, longitude: 78.4747, zoneName: 'Hyderabad South Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500032': { pincode: '500032', city: 'Hyderabad', state: 'Telangana', latitude: 17.4399, longitude: 78.3481, zoneName: 'Hyderabad Gachibowli Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500033': { pincode: '500033', city: 'Hyderabad', state: 'Telangana', latitude: 17.4300, longitude: 78.4000, zoneName: 'Hyderabad Jubilee Hills Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500099': { pincode: '500099', city: 'Hyderabad', state: 'Telangana', latitude: 17.4000, longitude: 78.4500, zoneName: 'Hyderabad Maintenance Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-CLOSED', standardTransitDays: 2 },
  
  // Bengaluru
  '560100': { pincode: '560100', city: 'Bengaluru', state: 'Karnataka', latitude: 12.8452, longitude: 77.6602, zoneName: 'Bengaluru Electronic City Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },
  '560001': { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9756, longitude: 77.6066, zoneName: 'Bengaluru MG Road Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },
  '560002': { pincode: '560002', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9634, longitude: 77.5855, zoneName: 'Bengaluru City Market Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },

  // Mumbai
  '400001': { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9388, longitude: 72.8353, zoneName: 'Mumbai Fort Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: 'WH-MUM', standardTransitDays: 2 },
  '400002': { pincode: '400002', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9500, longitude: 72.8300, zoneName: 'Mumbai Kalbadevi Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: 'WH-MUM', standardTransitDays: 2 },

  // Gurugram / Delhi
  '122002': { pincode: '122002', city: 'Gurugram', state: 'Haryana', latitude: 28.4842, longitude: 77.0917, zoneName: 'Gurugram DLF Phase 2 Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-DEL', standardTransitDays: 2 },
  '110001': { pincode: '110001', city: 'Delhi', state: 'Delhi', latitude: 28.6304, longitude: 77.2177, zoneName: 'Connaught Place Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-DEL', standardTransitDays: 2 },

  // Far Distance Pincode (> 35km from closest warehouse)
  '501501': { pincode: '501501', city: 'Vikarabad Outskirts', state: 'Telangana', latitude: 17.3364, longitude: 77.9048, zoneName: 'Outskirts Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },

  // Standard-Only Regional Zones (No One-Day Hub Nearby)
  '700001': { pincode: '700001', city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, zoneName: 'Kolkata Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },
  '600001': { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, zoneName: 'Chennai Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },

  // Non-Serviceable Remote Zone
  '999999': { pincode: '999999', city: 'Remote Station', state: 'Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973, zoneName: 'Restricted Mountain Zone', serviceable: false, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 0 },
};

export const DELIVERY_AGENTS = [
  {
    agentId: 'AGT-HYD-01',
    name: 'Vikram Singh',
    warehouseId: 'WH-HYD',
    status: 'AVAILABLE',
    currentLocation: { latitude: 17.3900, longitude: 78.4800 },
    activeDeliveries: 2,
    capacity: 5,
    serviceZones: ['500081', '500001', '500002', '500032', '501501'],
  },
  {
    agentId: 'AGT-HYD-02',
    name: 'Priya Sharma',
    warehouseId: 'WH-HYD',
    status: 'AVAILABLE',
    currentLocation: { latitude: 17.4400, longitude: 78.3500 },
    activeDeliveries: 1,
    capacity: 6,
    serviceZones: ['500081', '500032'],
  },
  {
    agentId: 'AGT-BLR-01',
    name: 'Rohan Kumar',
    warehouseId: 'WH-BLR',
    status: 'AVAILABLE',
    currentLocation: { latitude: 12.9700, longitude: 77.6000 },
    activeDeliveries: 3,
    capacity: 6,
    serviceZones: ['560100', '560001', '560002'],
  },
  {
    agentId: 'AGT-DEL-01',
    name: 'Manish Verma',
    warehouseId: 'WH-DEL',
    status: 'AVAILABLE',
    currentLocation: { latitude: 28.4600, longitude: 77.0300 },
    activeDeliveries: 2,
    capacity: 6,
    serviceZones: ['122002', '110001', '110002'],
  },
  {
    agentId: 'AGT-DEL-FULL',
    name: 'Amit Patel',
    warehouseId: 'WH-DEL',
    status: 'BUSY',
    currentLocation: { latitude: 28.4500, longitude: 77.0200 },
    activeDeliveries: 5,
    capacity: 5, // Full capacity!
    serviceZones: ['122002', '110001'],
  },
  {
    agentId: 'AGT-HYD-BUSY',
    name: 'Suresh Raina',
    warehouseId: 'WH-HYD',
    status: 'BUSY',
    currentLocation: { latitude: 17.3800, longitude: 78.4800 },
    activeDeliveries: 5,
    capacity: 5, // Capacity full!
    serviceZones: ['500033'],
  },
];

export const PRODUCT_INVENTORY = {
  'PROD-1001': { // Wireless Headphones
    name: 'Wireless Headphones',
    warehouses: {
      'WH-HYD': { quantity: 25, reservedQuantity: 2, stock: 23, oneDay: true },
      'WH-BLR': { quantity: 40, reservedQuantity: 5, stock: 35, oneDay: true },
      'WH-MUM': { quantity: 15, reservedQuantity: 0, stock: 15, oneDay: false },
      'WH-DEL': { quantity: 10, reservedQuantity: 1, stock: 9, oneDay: true },
    },
  },
  'PROD-1002': { // Premium Phone Case
    name: 'Premium Phone Case',
    warehouses: {
      'WH-HYD': { quantity: 50, reservedQuantity: 5, stock: 45, oneDay: true },
      'WH-BLR': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-MUM': { quantity: 30, reservedQuantity: 2, stock: 28, oneDay: false },
      'WH-DEL': { quantity: 20, reservedQuantity: 1, stock: 19, oneDay: true },
    },
  },
  'PROD-1003': { // Smartwatch
    name: 'Smartwatch',
    warehouses: {
      'WH-HYD': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-BLR': { quantity: 15, reservedQuantity: 3, stock: 12, oneDay: true },
      'WH-MUM': { quantity: 10, reservedQuantity: 1, stock: 9, oneDay: false },
      'WH-DEL': { quantity: 5, reservedQuantity: 0, stock: 5, oneDay: true },
    },
  },
  'PROD-1004': { // Premium Smartphone
    name: 'Premium Smartphone',
    warehouses: {
      'WH-HYD': { quantity: 8, reservedQuantity: 1, stock: 7, oneDay: true },
      'WH-BLR': { quantity: 12, reservedQuantity: 2, stock: 10, oneDay: true },
      'WH-MUM': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: false },
      'WH-DEL': { quantity: 2, reservedQuantity: 0, stock: 2, oneDay: true },
    },
  },
  'PROD-1005': { // Mechanical Gaming Keyboard
    name: 'Mechanical Gaming Keyboard',
    warehouses: {
      'WH-HYD': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-BLR': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-MUM': { quantity: 5, reservedQuantity: 0, stock: 5, oneDay: false },
      'WH-DEL': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
    },
  },
  'PROD-1006': { // Wireless Ergonomic Mouse
    name: 'Wireless Ergonomic Mouse',
    warehouses: {
      'WH-HYD': { quantity: 30, reservedQuantity: 4, stock: 26, oneDay: true },
      'WH-BLR': { quantity: 20, reservedQuantity: 2, stock: 18, oneDay: true },
      'WH-MUM': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: false },
      'WH-DEL': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
    },
  },
  'PROD-RESERVED-FULL': { // Item where all inventory is reserved for pending orders
    name: 'Limited Collector Edition Headphones',
    warehouses: {
      'WH-HYD': { quantity: 10, reservedQuantity: 10, stock: 0, oneDay: true },
      'WH-BLR': { quantity: 5, reservedQuantity: 5, stock: 0, oneDay: true },
    },
  },
  'PROD-OUT-OF-STOCK': { // Completely out of stock item for testing
    name: 'Discontinued AR Glasses',
    warehouses: {
      'WH-HYD': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-BLR': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
      'WH-MUM': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: false },
      'WH-DEL': { quantity: 0, reservedQuantity: 0, stock: 0, oneDay: true },
    },
  },
};
