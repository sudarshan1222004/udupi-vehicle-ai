import axios from 'axios';

// 1. SEARCH ADDRESS (Forward Geocoding)
export const searchLocation = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: query, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'in' }
    });
    return res.data.map(item => ({
      name: item.display_name.split(',')[0], 
      full_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch (err) {
    console.error("Search Error:", err);
    return [];
  }
};

// 2. GET ADDRESS FROM COORDINATES (Reverse Geocoding) <-- NEW FEATURE
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon: lng, format: 'json' }
    });
    // Return a short, readable name (e.g., "KMC Hospital, Manipal")
    const shortName = res.data.display_name.split(',')[0]; 
    return { name: shortName, full_name: res.data.display_name };
  } catch (err) {
    console.error("Reverse Geocode Error:", err);
    return { name: "Pinned Location", full_name: "Unknown Location" };
  }
};

// 3. GET ROAD PATH (Blue Line)
export const getRoadRoute = async (start, end) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(url);
    
    if (!res.data.routes || res.data.routes.length === 0) return null;

    const route = res.data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), 
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(0)
    };
  } catch (err) {
    console.error("Routing Error:", err);
    return null;
  }
};

// 4. GET PRICE FROM BACKEND
export const getPricePrediction = async (pickup, drop, distance) => {
  try {
    const res = await axios.post('http://127.0.0.1:8000/predict_ride', {
      start_lat: pickup.lat,
      start_lon: pickup.lng,
      end_lat: drop.lat,
      end_lon: drop.lng,
      road_distance: parseFloat(distance) 
    });
    return res.data;
  } catch (err) {
    console.error("Backend Error:", err);
    return null;
  }
};