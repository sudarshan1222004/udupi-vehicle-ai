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
    console.error("Search API Error:", err);
    return [];
  }
};

// 2. GET ROAD PATH (The Blue Line)
export const getRoadRoute = async (start, end) => {
  try {
    // Console log to debug
    console.log("Fetching route for:", start, end);
    
    // OSRM requires "Longitude,Latitude" order
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const res = await axios.get(url);
    
    if (!res.data.routes || res.data.routes.length === 0) {
      console.warn("No route found by OSRM.");
      return null;
    }

    const route = res.data.routes[0];
    
    return {
      // Leaflet needs [Lat, Lon], but OSRM gives [Lon, Lat]. We swap them here:
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), 
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(0)
    };
  } catch (err) {
    console.error("Routing Error (OSRM might be busy):", err);
    return null;
  }
};

// 3. GET PRICE FROM BACKEND
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