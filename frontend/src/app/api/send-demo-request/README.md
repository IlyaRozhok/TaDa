# EmailJS Client-Side Integration

This integration sends demo requests to support@ta-da.co using EmailJS client-side SDK.

## 📧 EmailJS Configuration

### Setup Steps:

1. **Create EmailJS Account**

   - Go to https://www.emailjs.com/
   - Sign up or log in

2. **Create Email Service**

   - Go to Email Services → Add New Service
   - Choose Gmail (or your preferred provider)
   - Connect your email account
   - Note the Service ID (e.g., `service_6pn9c83`)

3. **Create Email Template**

   - Go to Email Templates → Create New Template
   - Use Template ID: `template_bgp9fyr`
   - Configure template with these variables:
     - `{{from_name}}` - Sender's full name
     - `{{from_email}}` - Sender's email
     - `{{phone}}` - Sender's phone number
     - `{{submitted_at}}` - Submission timestamp

4. **Get Public Key**
   - Go to Account → General
   - Copy your Public Key (e.g., `n0_0RE2RxeO-ugY3W`)

### Environment Variables

Create `frontend/.env.local` file with your EmailJS credentials (note the `NEXT_PUBLIC_` prefix):

```bash
# EmailJS Configuration (Client-Side)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_6pn9c83
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_bgp9fyr
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=n0_0RE2RxeO-ugY3W
```

### Template Configuration

Your EmailJS template should be configured as follows:

**Subject:**

```
New Demo Request from {{from_name}}
```

**Content:**

```html
<h2>New Demo Request from TA-DA Website</h2>

<div
  style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;"
>
  <h3>Contact Information:</h3>
  <p><strong>Name:</strong> {{from_name}}</p>
  <p><strong>Email:</strong> {{from_email}}</p>
  <p><strong>Phone:</strong> {{phone}}</p>
</div>

<div
  style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;"
>
  <p><strong>Submitted at:</strong> {{submitted_at}}</p>
  <p><strong>Source:</strong> TA-DA Website Demo Request Form</p>
</div>

<hr style="margin: 30px 0;" />

<p style="color: #666; font-size: 14px;">
  This is an automated message from the TA-DA website contact form. Please
  respond to the customer at: {{from_email}}
</p>
```

**Settings:**

- **To Email:** `support@ta-da.co`
- **From Name:** `TA-DA Website`
- **Reply To:** `{{from_email}}`

## 🧪 Testing

1. **Restart Development Server**

   ```bash
   npm run dev
   ```

2. **Test the Form**
   - Open the demo request modal
   - Fill out all fields
   - Submit the form
   - Check browser console for logs
   - Check support@ta-da.co for email

## 🔧 Troubleshooting

### Common Issues:

1. **"EmailJS not loaded"**

   - Check browser console for script loading errors
   - Verify EmailJS CDN is accessible
   - Ensure environment variables have `NEXT_PUBLIC_` prefix

2. **"EmailJS Error: 400"**

   - Check template variables match exactly
   - Verify template ID is correct
   - Test template in EmailJS dashboard

3. **"EmailJS Error: 401/403"**

   - Check Public Key is correct
   - Verify service is connected properly
   - Try reconnecting Gmail service

4. **Gmail Authentication Issues**
   - Disconnect and reconnect Gmail service
   - Ensure all permissions are granted
   - Check Gmail service status in EmailJS

## 📊 Features

- ✅ Client-side EmailJS integration
- ✅ Environment variable configuration
- ✅ Input validation
- ✅ Error handling with detailed logs
- ✅ Success/error status messages
- ✅ Auto-hide messages after 3 seconds
- ✅ Professional email template
- ✅ Timestamp in UK timezone
- ✅ No server-side dependencies

## 🔄 Migration from Server-Side

This implementation uses client-side EmailJS instead of server-side API calls because:

- EmailJS blocks non-browser applications (403 error)
- Client-side integration is the recommended approach
- Reduces server load and complexity
- Direct browser-to-EmailJS communication
