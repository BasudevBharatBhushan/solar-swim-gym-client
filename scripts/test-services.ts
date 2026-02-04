
import { discountService } from '../src/services/discountService';
import { emailConfigService } from '../src/services/emailConfigService';

// Force Mock Fetch
console.log("Overwriting global fetch for testing...");
// @ts-ignore
globalThis.fetch = async (url: string, options: any) => {
        console.log(`[MOCK FETCH] Request to: ${url}`);
        console.log(`[MOCK FETCH] Method: ${options?.method || 'GET'}`);
        if(options?.body) console.log(`[MOCK FETCH] Body:`, options.body);

        // Mock responses based on URL
        if (url.includes('/email-config')) {
            return {
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        config_id: "8ea1b337-5ba8-4832-809f-5c07948405e6",
                        location_id: "a6cc6983-966a-47f4-bab6-c97a6ae5f13f",
                        smtp_host: "smtp.gmail.com",
                        smtp_port: 587,
                        sender_email: "admin@solar.com",
                        is_active: true
                    }
                })
            };
        }
        
        if (url.includes('/discounts')) {
             return {
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        {
                            discount_id: "test-discount-1",
                            discount_code: "TESTCODE",
                            discount: "10%",
                            is_active: true
                        }
                    ]
                })
            };
        }

        return {
            ok: false,
            statusText: "Not In Mock",
            json: async () => ({})
        }
    }

async function runTests() {
    console.log("--- STARTING SERVICE TESTS ---");
    const testLocationId = "test-location-id-123";

    try {
        console.log("\n Testing EmailConfigService.getEmailConfig...");
        const emailConfig = await emailConfigService.getEmailConfig(testLocationId);
        console.log(" [SUCCESS] Email Config:", emailConfig);

        console.log("\n Testing EmailConfigService.updateEmailConfig...");
        const updateParams = { smtp_host: "smtp.new.com" };
        const updatedConfig = await emailConfigService.updateEmailConfig(testLocationId, updateParams);
        console.log(" [SUCCESS] Updated Config Response:", updatedConfig);

        console.log("\n Testing DiscountService.getAllDiscounts...");
        const discounts = await discountService.getAllDiscounts(testLocationId);
        console.log(" [SUCCESS] Discounts:", discounts);

        console.log("\n Testing DiscountService.createDiscount...");
        const newDiscount = await discountService.createDiscount(testLocationId, { discount_code: "NEW2025", discount: "20%" });
        console.log(" [SUCCESS] New Discount:", newDiscount);

    } catch (e) {
        console.error(" [FAILED] Test threw error:", e);
    }
    console.log("\n--- TESTS COMPLETED ---");
}

runTests();
