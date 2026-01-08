import { z } from "zod";
import { getLeadFormWidgetHtml } from "../widget-builder.js";

/**
 * Zod validation schema for loading lead form
 * When calling this tool, extract the data from the vehicle object returned by get_vehicles:
 * - vehicleTitle: vehicle.title
 * - vehicleId: vehicle.id
 * - vehicleSubtitle: vehicle.subtitle
 * - priceFormatted: vehicle.pricing.priceFormatted
 */
export const loadLeadFormSchema = {
  vehicleTitle: z
    .string()
    .describe(
      "REQUIRED: The vehicle's title from the search results (e.g., vehicle.title = 'Tesla Model Y VZ (2019)'). Extract this from the vehicle object."
    ),
  vehicleId: z
    .string()
    .optional()
    .describe(
      "Optional: The vehicle's unique ID from search results (e.g., vehicle.id = 'veh-123'). Extract from vehicle.id if available."
    ),
  vehicleSubtitle: z
    .string()
    .optional()
    .describe(
      "Optional: The vehicle's subtitle from search results (e.g., vehicle.subtitle = 'Q4 e-tron | 627 kW | 302 km WLTP'). Extract from vehicle.subtitle if available."
    ),
  priceFormatted: z
    .string()
    .optional()
    .describe(
      "Optional: The formatted price from search results (e.g., vehicle.pricing.priceFormatted = '€131.982'). Extract from vehicle.pricing.priceFormatted if available."
    ),
};

/**
 * Tool handler for loading a lead form widget for a specific vehicle
 * @param {Object} args - Tool arguments
 * @param {string} args.vehicleTitle - Title of the vehicle
 * @param {string} [args.vehicleId] - ID of the vehicle (optional, defaults to title)
 * @param {string} [args.vehicleSubtitle] - Subtitle of the vehicle
 * @param {string} [args.priceFormatted] - Formatted price
 * @returns {Promise<Object>} Tool response with lead form widget
 */
export async function loadLeadFormHandler(args) {
  try {
    console.log('[load_lead_form] Received args:', JSON.stringify(args, null, 2));
    
    // Generate the HTML directly with the vehicle data
    // Use vehicleTitle as fallback for vehicleId if not provided
    const vehicleData = {
      vehicleId: args.vehicleId || args.vehicleTitle,
      vehicleTitle: args.vehicleTitle,
    };
    
    // Only add optional fields if they have values
    if (args.vehicleSubtitle) {
      vehicleData.vehicleSubtitle = args.vehicleSubtitle;
    }
    if (args.priceFormatted) {
      vehicleData.priceFormatted = args.priceFormatted;
    }
    
    const html = await getLeadFormWidgetHtml(vehicleData);

    // Return the lead form widget with vehicle data embedded
    return {
      content: [
        {
          type: "resource",
          resource: {
            uri: "ui://widget/lead-form-widget.html",
            mimeType: "text/html+skybridge",
            text: html,
          },
        },
      ],
    };
  } catch (error) {
    console.error("load_lead_form failed", error);
    return {
      content: [
        {
          type: "text",
          text: "Failed to load lead form. Please try again.",
        },
      ],
      structuredContent: {
        success: false,
        error: "Failed to load lead form",
      },
    };
  }
}
