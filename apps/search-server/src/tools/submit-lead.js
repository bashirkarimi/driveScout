import { z } from "zod";

/**
 * Zod validation schema for lead submission input
 */
export const leadSubmissionSchema = {
  firstName: z
    .string()
    .min(1, "First name is required")
    .describe("Customer's first name."),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .describe("Customer's last name."),
  email: z
    .string()
    .email("Invalid email address")
    .describe("Customer's email address."),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .describe("Customer's phone number."),
  message: z
    .string()
    .optional()
    .describe("Optional message from the customer."),
  vehicleTitle: z.string().describe("Title of the vehicle of interest."),
  vehicleId: z.string().describe("ID of the vehicle of interest."),
  requestType: z
    .string()
    .default("test_drive")
    .describe("Type of request (e.g., test_drive, contact)."),
  timestamp: z.string().describe("ISO timestamp of the submission."),
};

/**
 * Tool handler for submitting customer leads
 * @param {Object} args - Tool arguments
 * @param {string} args.firstName - Customer's first name
 * @param {string} args.lastName - Customer's last name
 * @param {string} args.email - Customer's email address
 * @param {string} args.phone - Customer's phone number
 * @param {string} [args.message] - Optional message from customer
 * @param {string} args.vehicleTitle - Title of the vehicle of interest
 * @param {string} args.vehicleId - ID of the vehicle of interest
 * @param {string} args.requestType - Type of request (e.g., test_drive)
 * @param {string} args.timestamp - ISO timestamp of submission
 * @returns {Promise<Object>} Tool response with submission result
 */
export async function submitLeadHandler(args) {
  try {
    // Log the lead submission (in production, this would save to a database)
    console.log("Lead submission received:", {
      customer: `${args.firstName} ${args.lastName}`,
      email: args.email,
      phone: args.phone,
      vehicle: args.vehicleTitle,
      vehicleId: args.vehicleId,
      requestType: args.requestType,
      message: args.message,
      timestamp: args.timestamp,
    });

    // In a real application, you would:
    // 1. Save to database
    // 2. Send confirmation email to customer
    // 3. Notify dealer/sales team
    // 4. Create CRM entry

    const responseMessage = `Thank you, ${args.firstName}! Your request for a test drive of the ${args.vehicleTitle} has been received. A dealer representative will contact you at ${args.email} or ${args.phone} shortly.`;

    return {
      content: [
        {
          type: "text",
          text: responseMessage,
        },
      ],
      structuredContent: {
        success: true,
        leadId: `lead_${Date.now()}`, // Mock lead ID
        customerName: `${args.firstName} ${args.lastName}`,
        vehicleTitle: args.vehicleTitle,
        contactEmail: args.email,
        contactPhone: args.phone,
        message: responseMessage,
      },
    };
  } catch (error) {
    console.error("submit_lead failed", error);
    return {
      content: [
        {
          type: "text",
          text: "Failed to submit your request. Please try again or contact us directly.",
        },
      ],
      structuredContent: {
        success: false,
        error: "Submission failed",
      },
    };
  }
}
