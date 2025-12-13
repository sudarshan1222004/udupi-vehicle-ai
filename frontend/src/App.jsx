import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import { User, ShieldCheck } from 'lucide-react';
import LocationSearch from './components/LocationSearch';
import { getRoadRoute, getPricePrediction } from './api';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix Icons for Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to Move Map Camera automatically
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14);
  }, [center, map]);
  return null;
}

function App() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [routePath, setRoutePath] = useState(null); // Stores the blue line path
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('search'); // 'search' or 'booking'

  // 1. Get Current Location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Current Location" };
        setPickup(coords);
      }, () => alert("Could not fetch location. Ensure GPS is on."));
    }
  };

  // 2. Fetch Route & Prices when both points are set
  useEffect(() => {
    const fetchRoute = async () => {
      if (pickup && drop) {
        setLoading(true);
        // Get Real Road Path (The Blue Line)
        const routeData = await getRoadRoute(pickup, drop);
        if (routeData) {
          setRoutePath(routeData.coordinates); // Save the blue line coordinates
          // Get Price from Backend using Real Distance
          const priceData = await getPricePrediction(pickup, drop, routeData.distance_km);
          if (priceData) setRides(priceData.rides);
        }
        setLoading(false);
      }
    };
    fetchRoute();
  }, [pickup, drop]);

  // 3. Handle Map Clicks to set pins
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (activeStep !== 'search') return;
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng, name: "Pinned Location" };
        if (!pickup) setPickup(coords);
        else if (!drop) setDrop(coords);
      },
    });
    return null;
  };

  return (
    <div className="app-container">
      {/* MAP LAYER */}
      <div className="map-layer">
        <MapContainer center={[13.3409, 74.7421]} zoom={13} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="CARTO" />
          <MapClickHandler />
          
          {/* Markers */}
          {pickup && <Marker position={pickup}><Popup>Pickup</Popup></Marker>}
          {drop && <Marker position={drop}><Popup>Drop</Popup></Marker>}
          
          {/* Recenter Map */}
          {pickup && <MapRecenter center={pickup} />}
          
          {/* THE BLUE ROUTE LINE */}
          {routePath && <Polyline positions={routePath} color="blue" weight={5} opacity={0.7} />}
        </MapContainer>
      </div>

      {/* UI PANEL */}
      <div className="booking-panel">
        
        {/* STEP 1: SEARCH & RESULTS */}
        {activeStep === 'search' && (
          <div className="panel-content">
            <h1>Smart Ride Udupi</h1>
            <div className="inputs-container">
              <LocationSearch type="pickup" value={pickup} onSelect={setPickup} onUseCurrent={handleCurrentLocation} />
              <div className="connector-line"></div>
              <LocationSearch type="drop" value={drop} onSelect={setDrop} />
            </div>

            {loading && <div className="loading-bar">Finding best route...</div>}

            {rides.length > 0 && !loading && (
              <div className="rides-list">
                <h3>Recommended Rides</h3>
                {rides.map(ride => (
                  <div key={ride.vehicle} className="ride-card" onClick={() => setActiveStep('booking')}>
                    <div className="ride-left">
                      {/* Vehicle Icons */}
                      <img src={`https://img.icons8.com/color/48/${ride.vehicle === 'Auto' ? 'tuk-tuk' : ride.vehicle === 'Bike' ? 'motorcycle' : 'car'}.png`} alt={ride.vehicle} width="40"/>
                      <div>
                        <h4>{ride.vehicle}</h4>
                        <p>{ride.eta_minutes} min • {ride.distance_km} km</p>
                      </div>
                    </div>
                    <div className="price">₹{ride.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DRIVER FOUND */}
        {activeStep === 'booking' && (
          <div className="panel-content success-view">
            <ShieldCheck size={64} color="#10b981" />
            <h2>Driver Found!</h2>
            <div className="driver-profile">
               <div className="avatar"><User /></div>
               <div>
                  <h3>Ramesh Shetty</h3>
                  <p>KA 20 AB 9999 • 4.9 ★</p>
               </div>
            </div>
            <p className="arrival-text">Arriving in 5 minutes</p>
            <button className="reset-btn" onClick={() => {
              setPickup(null); setDrop(null); setRides([]); setRoutePath(null); setActiveStep('search');
            }}>Book Another Ride</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;