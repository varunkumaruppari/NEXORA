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
    cutoffTime: '15:00', // 3:00 PM
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
    cutoffTime: '16:00', // 4:00 PM
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
    cutoffTime: '14:00', // 2:00 PM
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
    cutoffTime: '15:30', // 3:30 PM
    maxOneDayCapacity: 30,
    currentReservedCapacity: 30, // Capacity FULL for testing!
    serviceablePincodes: ['122002', '110001', '110002', '122001', '122018'],
  },
};

export const DELIVERY_ZONES = {
  // Hyderabad
  '500081': { pincode: '500081', city: 'Hyderabad', state: 'Telangana', zoneName: 'Hyderabad Cyberabad Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500001': { pincode: '500001', city: 'Hyderabad', state: 'Telangana', zoneName: 'Hyderabad Central Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500002': { pincode: '500002', city: 'Hyderabad', state: 'Telangana', zoneName: 'Hyderabad South Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  '500032': { pincode: '500032', city: 'Hyderabad', state: 'Telangana', zoneName: 'Hyderabad Gachibowli Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-HYD', standardTransitDays: 2 },
  
  // Bengaluru
  '560100': { pincode: '560100', city: 'Bengaluru', state: 'Karnataka', zoneName: 'Bengaluru Electronic City Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },
  '560001': { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', zoneName: 'Bengaluru MG Road Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },
  '560002': { pincode: '560002', city: 'Bengaluru', state: 'Karnataka', zoneName: 'Bengaluru City Market Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-BLR', standardTransitDays: 2 },

  // Mumbai
  '400001': { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', zoneName: 'Mumbai Fort Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: 'WH-MUM', standardTransitDays: 2 },
  '400002': { pincode: '400002', city: 'Mumbai', state: 'Maharashtra', zoneName: 'Mumbai Kalbadevi Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: 'WH-MUM', standardTransitDays: 2 },

  // Gurugram / Delhi
  '122002': { pincode: '122002', city: 'Gurugram', state: 'Haryana', zoneName: 'Gurugram DLF Phase 2 Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-DEL', standardTransitDays: 2 },
  '110001': { pincode: '110001', city: 'Delhi', state: 'Delhi', zoneName: 'Connaught Place Zone', serviceable: true, oneDayEligible: true, primaryWarehouse: 'WH-DEL', standardTransitDays: 2 },

  // Standard-Only Regional Zones (No One-Day Hub Nearby)
  '700001': { pincode: '700001', city: 'Kolkata', state: 'West Bengal', zoneName: 'Kolkata Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },
  '600001': { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', zoneName: 'Chennai Central Zone', serviceable: true, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 3 },

  // Non-Serviceable Remote Zone
  '999999': { pincode: '999999', city: 'Remote Station', state: 'Jammu & Kashmir', zoneName: 'Restricted Mountain Zone', serviceable: false, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 0 },
};

export const PRODUCT_INVENTORY = {
  'PROD-1001': { // Wireless Headphones
    name: 'Wireless Headphones',
    warehouses: {
      'WH-HYD': { stock: 25, oneDay: true },
      'WH-BLR': { stock: 40, oneDay: true },
      'WH-MUM': { stock: 15, oneDay: false },
      'WH-DEL': { stock: 10, oneDay: true },
    },
  },
  'PROD-1002': { // Premium Phone Case
    name: 'Premium Phone Case',
    warehouses: {
      'WH-HYD': { stock: 50, oneDay: true },
      'WH-BLR': { stock: 0, oneDay: true }, // Out of stock in Bangalore!
      'WH-MUM': { stock: 30, oneDay: false },
      'WH-DEL': { stock: 20, oneDay: true },
    },
  },
  'PROD-1003': { // Smartwatch
    name: 'Smartwatch',
    warehouses: {
      'WH-HYD': { stock: 0, oneDay: true }, // Out of stock in Hyderabad!
      'WH-BLR': { stock: 15, oneDay: true },
      'WH-MUM': { stock: 10, oneDay: false },
      'WH-DEL': { stock: 5, oneDay: true },
    },
  },
  'PROD-1004': { // Premium Smartphone
    name: 'Premium Smartphone',
    warehouses: {
      'WH-HYD': { stock: 8, oneDay: true },
      'WH-BLR': { stock: 12, oneDay: true },
      'WH-MUM': { stock: 0, oneDay: false },
      'WH-DEL': { stock: 2, oneDay: true },
    },
  },
  'PROD-1005': { // Mechanical Gaming Keyboard
    name: 'Mechanical Gaming Keyboard',
    warehouses: {
      'WH-HYD': { stock: 0, oneDay: true },
      'WH-BLR': { stock: 0, oneDay: true },
      'WH-MUM': { stock: 5, oneDay: false }, // Only in Mumbai (Standard only)
      'WH-DEL': { stock: 0, oneDay: true },
    },
  },
  'PROD-1006': { // Wireless Ergonomic Mouse
    name: 'Wireless Ergonomic Mouse',
    warehouses: {
      'WH-HYD': { stock: 30, oneDay: true },
      'WH-BLR': { stock: 20, oneDay: true },
      'WH-MUM': { stock: 0, oneDay: false },
      'WH-DEL': { stock: 0, oneDay: true },
    },
  },
  'PROD-OUT-OF-STOCK': { // Completely out of stock item for testing
    name: 'Discontinued AR Glasses',
    warehouses: {
      'WH-HYD': { stock: 0, oneDay: true },
      'WH-BLR': { stock: 0, oneDay: true },
      'WH-MUM': { stock: 0, oneDay: false },
      'WH-DEL': { stock: 0, oneDay: true },
    },
  },
};
