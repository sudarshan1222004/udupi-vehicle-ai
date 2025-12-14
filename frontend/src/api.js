import axios from 'axios';

// 1. SEARCH LOCATION
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

// 2. REVERSE GEOCODE (Lat/Lng -> Address Name)
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon: lng, format: 'json' }
    });
    const displayName = res.data.display_name || "Unknown Location";
    const shortName = displayName.split(',')[0];
    return { name: shortName, full_name: displayName };
  } catch (err) {
    return { name: "Pinned Location", full_name: "Unknown Location" };
  }
};

// 3. GET ROAD ROUTE (OSRM) WITH WARNING POPUP
export const getRoadRoute = async (start, end) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    // Set a timeout so we don't wait forever (5 seconds)
    const res = await axios.get(url, { timeout: 5000 });
    
    if (!res.data.routes || res.data.routes.length === 0) throw new Error("No route");

    const route = res.data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), // Flip for Leaflet
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(0)
    };
  } catch (err) {
    console.warn("OSRM Failed or timed out, using fallback.");
    
    // --- VISUAL WARNING FOR USER ---
    alert("⚠️ Map Routing Server is busy! Switching to straight-line mode."); 
    // -------------------------------

    // Fallback: Calculate straight line distance
    const dist = getStraightLineDistance(start.lat, start.lng, end.lat, end.lng);
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance_km: dist,
      duration_min: (dist * 2).toFixed(0) // Rough estimate
    };
  }
};

// 4. GET AI PRICE PREDICTION
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
    alert("Backend is offline! Please run: uvicorn main:app --reload");
    return null;
  }
};

// HELPER: Haversine Formula for Straight Line Distance
const getStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth Radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};