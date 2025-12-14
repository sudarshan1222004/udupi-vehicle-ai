import axios from 'axios';

// 1. SEARCH ADDRESS
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

// 2. REVERSE GEOCODING
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon: lng, format: 'json' }
    });
    const shortName = res.data.display_name.split(',')[0]; 
    return { name: shortName, full_name: res.data.display_name };
  } catch (err) {
    return { name: "Pinned Location", full_name: "Unknown Location" };
  }
};

// --- HELPER: Calculate Straight Line Distance (Haversine Formula) ---
const getStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return (R * c).toFixed(2); // Distance in km
};

// 3. GET ROAD PATH (With Fallback)
export const getRoadRoute = async (start, end) => {
  try {
    // Try OSRM (Real Road Path)
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(url);
    
    if (!res.data.routes || res.data.routes.length === 0) throw new Error("No route found");

    const route = res.data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), 
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(0)
    };
  } catch (err) {
    console.warn("OSRM Failed, using fallback straight line:", err);
    
    // FALLBACK: Return a straight line so the app doesn't break
    const dist = getStraightLineDistance(start.lat, start.lng, end.lat, end.lng);
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]], // Straight line
      distance_km: dist,
      duration_min: (dist * 2).toFixed(0) // Rough guess: 2 mins per km
    };
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
    alert("Backend is not running! Please run 'uvicorn main:app --reload'");
    return null;
  }
};