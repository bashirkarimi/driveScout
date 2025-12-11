# Production Integration Guide

## Backend Integration Options

### Option 1: Direct API Call (Recommended)

Update `App.jsx` to call your backend API:

```javascript
const handleSubmitLead = async (leadData) => {
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit lead');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Lead submission error:', error);
    throw error;
  }
};
```

### Option 2: Via MCP Tool (Current Implementation)

The current implementation logs to console. To make it functional:

1. **Add database connection in `server.js`:**

```javascript
import { Pool } from 'pg'; // or your preferred database client

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// In submit_lead tool handler:
async (args) => {
  try {
    const result = await pool.query(
      `INSERT INTO leads (
        first_name, last_name, email, phone, 
        message, vehicle_title, vehicle_id, 
        request_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        args.firstName,
        args.lastName,
        args.email,
        args.phone,
        args.message || '',
        args.vehicleTitle,
        args.vehicleId,
        args.requestType,
      ]
    );

    const leadId = result.rows[0].id;

    // Send email notification
    await sendLeadNotification(args);

    return {
      content: [{
        type: "text",
        text: `Thank you, ${args.firstName}! Your request has been received (ID: ${leadId}).`
      }],
      structuredContent: {
        success: true,
        leadId: leadId,
        // ... other fields
      }
    };
  } catch (error) {
    console.error("Lead submission failed:", error);
    // Handle error...
  }
}
```

## Database Schema

### PostgreSQL

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  message TEXT,
  vehicle_title VARCHAR(255) NOT NULL,
  vehicle_id VARCHAR(255) NOT NULL,
  request_type VARCHAR(50) DEFAULT 'test_drive',
  status VARCHAR(50) DEFAULT 'new',
  assigned_to INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contacted_at TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) 
    REFERENCES sales_reps(id) ON DELETE SET NULL
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_vehicle_id ON leads(vehicle_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### MongoDB

```javascript
// Schema definition
const leadSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  phone: { type: String, required: true },
  message: String,
  vehicleTitle: { type: String, required: true },
  vehicleId: { type: String, required: true },
  requestType: { 
    type: String, 
    default: 'test_drive',
    enum: ['test_drive', 'contact', 'quote']
  },
  status: {
    type: String,
    default: 'new',
    enum: ['new', 'contacted', 'scheduled', 'completed', 'cancelled']
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRep' },
  contactedAt: Date,
  notes: String,
}, {
  timestamps: true // Creates createdAt and updatedAt automatically
});

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ vehicleId: 1 });

const Lead = mongoose.model('Lead', leadSchema);
```

## Email Notifications

### Using SendGrid

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendLeadNotification(leadData) {
  // Email to customer
  const customerEmail = {
    to: leadData.email,
    from: 'noreply@drivescout.com',
    subject: `Thank you for your interest in ${leadData.vehicleTitle}`,
    html: `
      <h1>Thank you, ${leadData.firstName}!</h1>
      <p>We received your request for a test drive of the <strong>${leadData.vehicleTitle}</strong>.</p>
      <p>A member of our team will contact you within 24 hours at ${leadData.phone}.</p>
      <p>If you have any immediate questions, please reply to this email.</p>
      <br>
      <p>Best regards,<br>Drive Scout Team</p>
    `
  };

  // Email to sales team
  const salesEmail = {
    to: process.env.SALES_EMAIL,
    from: 'leads@drivescout.com',
    subject: `New Lead: ${leadData.vehicleTitle}`,
    html: `
      <h2>New Test Drive Request</h2>
      <ul>
        <li><strong>Name:</strong> ${leadData.firstName} ${leadData.lastName}</li>
        <li><strong>Email:</strong> ${leadData.email}</li>
        <li><strong>Phone:</strong> ${leadData.phone}</li>
        <li><strong>Vehicle:</strong> ${leadData.vehicleTitle}</li>
        <li><strong>Message:</strong> ${leadData.message || 'No message'}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p><a href="${process.env.CRM_URL}/leads/new">View in CRM</a></p>
    `
  };

  await Promise.all([
    sgMail.send(customerEmail),
    sgMail.send(salesEmail)
  ]);
}
```

### Using AWS SES

```javascript
import AWS from 'aws-sdk';

const ses = new AWS.SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function sendLeadNotification(leadData) {
  const params = {
    Source: 'noreply@drivescout.com',
    Destination: {
      ToAddresses: [leadData.email],
      BccAddresses: [process.env.SALES_EMAIL],
    },
    Message: {
      Subject: {
        Data: `Thank you for your interest in ${leadData.vehicleTitle}`,
      },
      Body: {
        Html: {
          Data: `
            <h1>Thank you, ${leadData.firstName}!</h1>
            <p>We received your request for a test drive...</p>
          `,
        },
      },
    },
  };

  await ses.sendEmail(params).promise();
}
```

## CRM Integration

### Salesforce

```javascript
import jsforce from 'jsforce';

const conn = new jsforce.Connection({
  loginUrl: process.env.SALESFORCE_LOGIN_URL,
});

await conn.login(
  process.env.SALESFORCE_USERNAME,
  process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
);

async function createSalesforceLead(leadData) {
  const lead = {
    FirstName: leadData.firstName,
    LastName: leadData.lastName,
    Email: leadData.email,
    Phone: leadData.phone,
    Description: leadData.message,
    Company: 'Drive Scout Lead', // Required field
    LeadSource: 'ChatGPT Widget',
    Status: 'New',
    Product_Interest__c: leadData.vehicleTitle, // Custom field
    Vehicle_ID__c: leadData.vehicleId, // Custom field
  };

  const result = await conn.sobject('Lead').create(lead);
  return result;
}
```

### HubSpot

```javascript
import { Client } from '@hubspot/api-client';

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function createHubSpotContact(leadData) {
  const contactObj = {
    properties: {
      email: leadData.email,
      firstname: leadData.firstName,
      lastname: leadData.lastName,
      phone: leadData.phone,
      message: leadData.message,
      vehicle_interest: leadData.vehicleTitle,
      vehicle_id: leadData.vehicleId,
      lead_source: 'ChatGPT Widget',
    },
  };

  const contact = await hubspotClient.crm.contacts.basicApi.create(contactObj);
  
  // Create a deal
  const dealObj = {
    properties: {
      dealname: `Test Drive - ${leadData.vehicleTitle}`,
      dealstage: 'appointmentscheduled',
      pipeline: 'default',
      amount: '0',
    },
    associations: [
      {
        to: { id: contact.id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
      },
    ],
  };

  await hubspotClient.crm.deals.basicApi.create(dealObj);
  
  return contact;
}
```

## SMS Notifications (Optional)

### Using Twilio

```javascript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMSConfirmation(leadData) {
  await client.messages.create({
    body: `Thank you ${leadData.firstName}! Your test drive request for ${leadData.vehicleTitle} has been received. We'll call you at ${leadData.phone} soon.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: leadData.phone,
  });
}
```

## Analytics Integration

### Google Analytics 4

```javascript
// In your frontend (App.jsx)
import ReactGA from 'react-ga4';

const handleSubmitLead = async (leadData) => {
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });

    if (response.ok) {
      // Track successful lead submission
      ReactGA.event({
        category: 'Lead',
        action: 'Submit',
        label: leadData.vehicleTitle,
        value: 1,
      });

      // Track as conversion
      ReactGA.gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
        value: 1.0,
        currency: 'USD',
      });
    }

    return response.json();
  } catch (error) {
    // Track error
    ReactGA.event({
      category: 'Lead',
      action: 'Error',
      label: error.message,
    });
    throw error;
  }
};
```

## Security Best Practices

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many submissions from this IP, please try again later.',
});

app.post('/api/leads', leadSubmissionLimiter, async (req, res) => {
  // Handle lead submission
});
```

### Input Sanitization

```javascript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

function sanitizeLeadData(data) {
  return {
    firstName: DOMPurify.sanitize(validator.trim(data.firstName)),
    lastName: DOMPurify.sanitize(validator.trim(data.lastName)),
    email: validator.normalizeEmail(data.email),
    phone: validator.trim(data.phone),
    message: data.message ? DOMPurify.sanitize(data.message) : '',
    vehicleTitle: DOMPurify.sanitize(data.vehicleTitle),
    vehicleId: DOMPurify.sanitize(data.vehicleId),
  };
}
```

### CAPTCHA Integration

```javascript
// Frontend - Add to LeadForm.jsx
import ReCAPTCHA from 'react-google-recaptcha';

const [captchaToken, setCaptchaToken] = useState(null);

const handleCaptchaChange = (token) => {
  setCaptchaToken(token);
};

// In form JSX
<ReCAPTCHA
  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
  onChange={handleCaptchaChange}
/>

// Backend verification
import axios from 'axios';

async function verifyCaptcha(token) {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      },
    }
  );

  return response.data.success;
}
```

## Environment Variables

Create a `.env` file with:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drivescout

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
SALES_EMAIL=sales@drivescout.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# CRM (Choose one)
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_USERNAME=your_sf_username
SALESFORCE_PASSWORD=your_sf_password
SALESFORCE_TOKEN=your_sf_token

HUBSPOT_ACCESS_TOKEN=your_hubspot_token

# Security
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# URLs
CRM_URL=https://crm.drivescout.com
```

## Monitoring & Logging

### Using Winston

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'leads.log' }),
  ],
});

// Log all lead submissions
logger.info('Lead submitted', {
  leadId: result.id,
  email: leadData.email,
  vehicleId: leadData.vehicleId,
  timestamp: new Date().toISOString(),
});
```

## Testing

### Unit Tests for Lead Submission

```javascript
import { describe, it, expect, vi } from 'vitest';
import { handleSubmitLead } from './App';

describe('Lead Submission', () => {
  it('should submit valid lead data', async () => {
    const leadData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      vehicleTitle: 'Tesla Model 3',
      vehicleId: 'tesla-model-3',
    };

    const result = await handleSubmitLead(leadData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', async () => {
    const leadData = {
      email: 'invalid-email',
      // ... other fields
    };

    await expect(handleSubmitLead(leadData)).rejects.toThrow();
  });
});
```

## Deployment Checklist

- [ ] Set up production database
- [ ] Configure email service (SendGrid/SES)
- [ ] Set up CRM integration
- [ ] Configure environment variables
- [ ] Implement rate limiting
- [ ] Add CAPTCHA
- [ ] Set up monitoring/logging
- [ ] Test email notifications
- [ ] Test database writes
- [ ] Load test the endpoint
- [ ] Set up error alerting (Sentry, etc.)
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Create admin dashboard for lead management
- [ ] Document API for team

## Next Steps

1. Choose your backend stack
2. Set up database
3. Implement one of the integration options above
4. Test thoroughly in staging environment
5. Deploy to production
6. Monitor lead submissions
7. Iterate based on conversion data
