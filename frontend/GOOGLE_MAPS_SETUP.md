# Google Maps Integration Setup

## Overview

This project now includes Google Maps integration for displaying properties on an interactive map.

## Prerequisites

1. Google Cloud Platform account
2. Google Maps JavaScript API enabled
3. API key with proper restrictions

## Setup Steps

### 1. Enable Google Maps JavaScript API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Maps JavaScript API"
5. Click on it and press "Enable"

### 2. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 3. Restrict API Key (Recommended)

1. Click on the created API key
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s):
   - `localhost:3000/*` (for development)
   - `yourdomain.com/*` (for production)
4. Under "API restrictions", select "Restrict key"
5. Select "Maps JavaScript API" from the list

### 4. Environment Variables

Create or update your `.env.local` file:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important:** The variable must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 5. Install Dependencies

The required packages are already installed:

```bash
npm install @googlemaps/js-api-loader @types/google.maps
```

## Usage

### Basic Map Component

```tsx
import GoogleMap from "../components/GoogleMap";

<GoogleMap
  center={{ lat: 51.5074, lng: -0.1278 }} // London
  zoom={12}
  properties={propertiesArray}
  onPropertyClick={(propertyId) => console.log(propertyId)}
  height="500px"
/>;
```

### Properties Data Structure

Properties should include `lat` and `lng` coordinates:

```typescript
interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  lat?: number; // Latitude
  lng?: number; // Longitude
  // ... other properties
}
```

## Features

### Interactive Map

- Custom markers for each property
- Info windows with property details
- Click handlers for property selection
- Responsive design

### Custom Markers

- Blue circular markers with white centers
- Hover effects and click interactions
- Info windows with property information

### Map Controls

- Reset to center button
- Zoom controls
- Pan functionality

## Available Pages

### Properties Map Page

- **Route:** `/app/properties/map`
- **Features:** Full-screen map with property list sidebar
- **Interaction:** Click markers to view property details

## Troubleshooting

### Common Issues

1. **"Failed to load map" error**

   - Check if API key is correct
   - Verify API key restrictions
   - Ensure Maps JavaScript API is enabled

2. **Map not displaying**

   - Check browser console for errors
   - Verify environment variable is set
   - Check if API key has proper permissions

3. **Markers not showing**
   - Ensure properties have valid `lat` and `lng` values
   - Check if coordinates are within valid ranges

### Debug Mode

Enable debug logging by checking browser console for:

- API loading status
- Map initialization
- Marker creation
- Error messages

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Restrict API keys** to specific domains
- **Monitor API usage** in Google Cloud Console

## Cost Considerations

- Google Maps JavaScript API has usage-based pricing
- First $200 of usage per month is free
- Monitor usage in Google Cloud Console
- Set up billing alerts for cost control

## Future Enhancements

- Geocoding for address-to-coordinate conversion
- Clustering for large numbers of properties
- Custom map styles and themes
- Integration with property search filters
- Real-time property updates on map
