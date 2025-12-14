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

// --- HELPER: Straight Line Distance ---
const getStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return (R * c).toFixed(2); 
};

// 3. GET ROAD PATH (With User Alert on Fail)
export const getRoadRoute = async (start, end) => {
  try {
    // Standard Global OSRM Server
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    // 8 Second Timeout
    const res = await axios.get(url, { timeout: 8000 });
    
    if (!res.data.routes || res.data.routes.length === 0) throw new Error("No route found");

    const route = res.data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), 
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(0)
    };
  } catch (err) {
    console.warn("Global OSRM Server is busy. Using fallback.");
    
    // ⚠️ NEW: POPUP ALERT FOR USER ⚠️
    alert("⚠️ Note: The free map server is busy. Showing a straight-line path instead.");

    // Fallback straight line
    const dist = getStraightLineDistance(start.lat, start.lng, end.lat, end.lng);
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]], 
      distance_km: dist,
      duration_min: (dist * 2).toFixed(0) 
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