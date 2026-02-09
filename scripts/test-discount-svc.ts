// Polyfill localStorage and sessionStorage for Node environment
if (typeof sessionStorage === "undefined" || sessionStorage === null) {
  (global as any).sessionStorage = {
    _data: {} as Record<string, string>,
    setItem: function(id: string, val: string) { return this._data[id] = String(val); },
    getItem: function(id: string) { return Object.prototype.hasOwnProperty.call(this._data, id) ? this._data[id] : null; },
    removeItem: function(id: string) { return delete this._data[id]; },
    clear: function() { return this._data = {}; }
  };
}

import { authService } from '../src/services/authService';
import { discountService, Discount } from '../src/services/discountService';
import { serviceCatalog } from '../src/services/serviceCatalog';

async function runTest() {
    console.log("--- TESTING DISCOUNT WITH SERVICE_ID ---");
    
    try {
        console.log("Logging in...");
        await authService.loginStaff('superadmin@solar.com', 'password123');
        console.log("Login successful.");

        // Fetch locations to get a valid one
        const { configService } = await import('../src/services/configService');
        const locations = await configService.getLocations();
        if (locations.length === 0) {
            console.log("No locations found.");
            return;
        }
        const testLocationId = locations[0].location_id;
        console.log(`Using location: ${locations[0].name} (${testLocationId})`);

        console.log("Fetching services...");
        const services = await serviceCatalog.getServices(testLocationId);
        const serviceList = services.data || services;
        
        if (!Array.isArray(serviceList) || serviceList.length === 0) {
            console.log("No services found to test with.");
            return;
        }

        const targetService = serviceList[0];
        console.log(`Using service: ${targetService.name} (${targetService.service_id})`);

        const newDiscount: Partial<Discount> = {
            discount_code: "SVC_TEST_" + Math.floor(Math.random() * 1000),
            discount: "10%",
            is_active: true,
            service_id: targetService.service_id,
        };

        console.log("Creating discount with service_id...");
        const created = await discountService.createDiscount(testLocationId, newDiscount);
        console.log("Created successfully:", created);

        console.log("Fetching all discounts...");
        const all = await discountService.getAllDiscounts(testLocationId);
        const found = all.find(d => d.discount_id === created.discount_id);
        
        if (found && found.service_id === targetService.service_id) {
            console.log("Test Passed: service_id saved and retrieved.");
        } else {
            console.error("Test Failed: service_id mismatch or not found.", found);
        }

    } catch (e: any) {
        console.error("Test failed with error:", e.message);
    }
}

runTest();
