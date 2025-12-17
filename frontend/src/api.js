import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001';

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
      lng: parseFloat(item.lon)
    }));
  } catch (err) { return []; }
};

export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon: lng, format: 'json' }
    });
    return { name: res.data.display_name.split(',')[0] || "Pinned Location" };
  } catch (err) { return { name: "Pinned Location" }; }
};

export const getRoadRoute = async (start, end) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(url);
    const route = res.data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
      distance_km: (route.distance / 1000).toFixed(2)
    };
  } catch (err) { return null; }
};

export const getPricePrediction = async (pickup, drop, distance) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/predict_ride`, null, {
      params: {
        start_lat: pickup.lat,
        start_lon: pickup.lng,
        end_lat: drop.lat,
        end_lon: drop.lng,
        hour: new Date().getHours(),
        preference: 'balanced'
      }
    });
    return res.data;
  } catch (err) { return null; }
};