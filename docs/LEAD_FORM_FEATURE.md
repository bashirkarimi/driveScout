# Lead Form Feature

## Overview

The Lead Form feature allows users to contact dealers/companies directly from the ChatGPT interface by clicking the **"Book Test Drive"** button on any vehicle detail page.

## Features

### User Interface

1. **Book Test Drive Button**
   - Prominent green button displayed on every vehicle detail card
   - Located at the top of the action buttons section
   - Icon-enhanced for better visual appeal

2. **Lead Form Modal**
   - Clean, professional form design
   - Real-time validation
   - Responsive layout for all screen sizes
   - Success confirmation with animation

### Form Fields

- **First Name** (required)
- **Last Name** (required)
- **Email** (required, validated)
- **Phone Number** (required, min 10 characters)
- **Message** (optional, textarea)

### Validation

- Email format validation
- Phone number length validation
- Required field checks
- Real-time error display
- Form submission prevention until all required fields are valid

### User Experience

1. User views vehicle details
2. Clicks "Book Test Drive" button
3. Form opens in a modal with vehicle information displayed
4. User fills out contact information
5. Form validates input in real-time
6. Upon submission:
   - Loading state with spinner
   - Success message with checkmark
   - Auto-close after 2 seconds
7. Lead data is logged and can be processed by backend

## Components Created

### 1. `FormInput` Component
**Location:** `packages/search-widget/src/components/form-input.jsx`

Reusable form input component supporting:
- Text inputs
- Email inputs
- Phone inputs
- Textareas
- Error states
- Required field indicators

### 2. `LeadForm` Component
**Location:** `packages/search-widget/src/components/lead-form.jsx`

Complete lead capture form with:
- Form state management
- Validation logic
- Submit handling
- Success/error states
- Vehicle information display
- Privacy notice

## Backend Integration

### MCP Tool: `submit_lead`

**Location:** `apps/search-server/src/server.js`

A new MCP tool has been added to handle lead submissions:

```javascript
server.registerTool("submit_lead", {
  title: "Submit test drive lead",
  description: "Submits a customer lead for a test drive or vehicle inquiry",
  inputSchema: leadSubmissionSchema,
  // ... handler implementation
});
```

#### Input Schema

```javascript
{
  firstName: string (required),
  lastName: string (required),
  email: string (required, valid email),
  phone: string (required, min 10 chars),
  message: string (optional),
  vehicleTitle: string (required),
  vehicleId: string (required),
  requestType: string (default: "test_drive"),
  timestamp: string (ISO format)
}
```

#### Response

```javascript
{
  content: [{ type: "text", text: "Confirmation message" }],
  structuredContent: {
    success: true,
    leadId: "lead_1234567890",
    customerName: "John Doe",
    vehicleTitle: "2024 Tesla Model 3",
    contactEmail: "john@example.com",
    contactPhone: "+1 555 123 4567",
    message: "Thank you message"
  }
}
```

## Production Implementation Notes

The current implementation logs lead submissions to the console. For production deployment, you should:

1. **Database Integration**
   - Store leads in a database (PostgreSQL, MongoDB, etc.)
   - Create leads table/collection with appropriate schema
   - Add indexes for quick retrieval

2. **Email Notifications**
   - Send confirmation email to customer
   - Notify dealer/sales team of new lead
   - Use email service (SendGrid, AWS SES, etc.)

3. **CRM Integration**
   - Automatically create CRM entries
   - Integrate with Salesforce, HubSpot, or custom CRM
   - Set up lead scoring and routing

4. **Analytics**
   - Track lead conversion rates
   - Monitor form abandonment
   - A/B test form variations

5. **Security**
   - Implement rate limiting
   - Add CAPTCHA for spam prevention
   - Sanitize all input data
   - Encrypt sensitive information

6. **Compliance**
   - GDPR compliance for EU users
   - CCPA compliance for California users
   - Privacy policy updates
   - Data retention policies

## Testing the Feature

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Search for vehicles** in the ChatGPT interface

3. **Click "Open Full Details"** on any vehicle card

4. **Click "Book Test Drive"** button

5. **Fill out the form** with:
   - Valid name
   - Valid email (e.g., test@example.com)
   - Valid phone (e.g., +1 555 123 4567)
   - Optional message

6. **Submit** and verify:
   - Success message appears
   - Console logs show lead data
   - Modal closes automatically

## Future Enhancements

- [ ] Add preferred contact time field
- [ ] Include financing interest option
- [ ] Trade-in vehicle information capture
- [ ] Multiple vehicle comparison leads
- [ ] SMS confirmation option
- [ ] Calendar integration for test drive scheduling
- [ ] File upload for documents (license, insurance)
- [ ] Multi-language support
- [ ] Accessibility improvements (ARIA labels)
- [ ] Progressive form (save partial data)

## Styling

The lead form uses the existing design system:
- Tailwind CSS utility classes
- Consistent with app color scheme (elm-green for primary actions)
- Responsive design (mobile-first approach)
- Smooth transitions and animations
- Accessible focus states

## Error Handling

The form handles various error scenarios:
- Network failures
- Validation errors
- Server errors
- User input errors

All errors are displayed to users with clear, actionable messages.
