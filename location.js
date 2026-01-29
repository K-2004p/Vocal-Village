// Location service for Vocal Village

let currentLocation = null;

// Get current location
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    // Try to get cached location first
    const cachedLocation = localStorage.getItem('cachedLocation');
    const cacheTime = localStorage.getItem('locationCacheTime');
    
    if (cachedLocation && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 5 * 60 * 1000) { // 5 minutes cache
        currentLocation = JSON.parse(cachedLocation);
        resolve(formatLocation(currentLocation));
        return;
      }
    }
    
    // Get fresh location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // In production, use reverse geocoding API
          // const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          // const data = await response.json();
          
          // For demo, simulate reverse geocoding
          const locationData = {
            latitude,
            longitude,
            address: `Laxmi Nagar, Ravet (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            village: "Ravet",
            district: "Pune",
            state: "Maharashtra",
            timestamp: Date.now()
          };
          
          currentLocation = locationData;
          
          // Cache location
          localStorage.setItem('cachedLocation', JSON.stringify(locationData));
          localStorage.setItem('locationCacheTime', Date.now().toString());
          
          resolve(formatLocation(locationData));
        } catch (error) {
          // Fallback to coordinates
          const fallbackLocation = {
            address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          };
          resolve(formatLocation(fallbackLocation));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        // Try IP-based location as fallback
        getIPBasedLocation()
          .then(resolve)
          .catch(() => {
            const manualLocation = localStorage.getItem('manualLocation');
            if (manualLocation) {
              resolve(manualLocation);
            } else {
              reject(new Error('Could not determine location'));
            }
          });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000 // 5 minutes
      }
    );
  });
}

// Get IP-based location (fallback)
async function getIPBasedLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const location = {
      address: `${data.city || 'Unknown'}, ${data.region || 'Unknown'}, ${data.country_name || 'Unknown'}`,
      city: data.city,
      region: data.region,
      country: data.country_name
    };
    
    return formatLocation(location);
  } catch (error) {
    throw new Error('IP location failed');
  }
}

// Format location for display
function formatLocation(locationData) {
  if (!locationData) return 'Location not available';
  
  if (typeof locationData === 'string') {
    return locationData;
  }
  
  if (locationData.address) {
    return locationData.address;
  }
  
  if (locationData.latitude && locationData.longitude) {
    return `Coordinates: ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
  }
  
  return 'Location information available';
}

// Get coordinates
function getCoordinates() {
  if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude
    };
  }
  return null;
}