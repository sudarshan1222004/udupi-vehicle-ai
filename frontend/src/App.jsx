import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import { User, ShieldCheck, Navigation, Clock, ChevronRight } from 'lucide-react';
import LocationSearch from './components/LocationSearch';
import { getRoadRoute, getPricePrediction, reverseGeocode } from './api';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

// Leaflet Icon Fix
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 14);
  }, [center, map]);
  return null;
}

function App() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [routePath, setRoutePath] = useState(null); 
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('search'); 
  const [selectedRide, setSelectedRide] = useState(null);

  // GPS Current Location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: address.name });
      });
    }
  };

  // Logic to fetch Route and AI Predictions
  useEffect(() => {
    const fetchAI = async () => {
      if (pickup && drop) {
        setLoading(true);
        const routeData = await getRoadRoute(pickup, drop);
        if (routeData) {
          setRoutePath(routeData.coordinates); 
          const priceData = await getPricePrediction(pickup, drop, routeData.distance_km);
          if (Array.isArray(priceData)) {
            setRides(priceData.map(r => ({
              vehicle: r.vehicle, price: r.fare, eta: r.eta, dist: routeData.distance_km, surge: r.demand === 'High'
            })));
          }
        }
        setLoading(false);
      }
    };
    fetchAI();
  }, [pickup, drop]);

  // Map Click Logic
  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        if (activeStep !== 'search') return;
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng, name: address.name };
        if (!pickup) setPickup(coords);
        else if (!drop) setDrop(coords);
      },
    });
    return null;
  };

  return (
    <div className="app-layout">
      {/* Sidebar - Left Docked */}
      <div className="sidebar shadow-2xl">
        <div className="brand-section">
          <h1 className="brand-logo italic">SMART RIDE</h1>
          <p className="brand-tagline">Udupi AI Mobility Engine</p>
        </div>

        <div className="content-area">
          {activeStep === 'search' && (
            <div className="animate-in space-y-6">
              <div className="input-card">
                <LocationSearch type="pickup" value={pickup} onSelect={setPickup} onUseCurrent={handleCurrentLocation} />
                <div className="vertical-divider"></div>
                <LocationSearch type="drop" value={drop} onSelect={setDrop} />
              </div>

              {loading && <div className="status-loader"><div className="spinner"></div><span>AI Analysis...</span></div>}

              {rides.length > 0 && !loading && (
                <div className="space-y-4">
                  <h3 className="section-title">Suggested Rides</h3>
                  {rides.map(ride => (
                    <div 
                      key={ride.vehicle} 
                      className={`ride-card-new ${selectedRide?.vehicle === ride.vehicle ? 'active' : ''}`}
                      onClick={() => setSelectedRide(ride)}
                    >
                      <div className="ride-card-main">
                        <img src={`https://img.icons8.com/color/48/${ride.vehicle.toLowerCase().includes('auto') ? 'tuk-tuk' : ride.vehicle.toLowerCase().includes('bike') ? 'motorcycle' : 'car'}.png`} alt="icon" />
                        <div>
                          <span className="vehicle-name">{ride.vehicle}</span>
                          <span className="eta-tag">{ride.eta} min • {ride.dist} km</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="price-tag">₹{ride.price}</span>
                        {ride.surge && <span className="surge-badge">SURGE</span>}
                      </div>
                    </div>
                  ))}
                  <button className="confirm-button" disabled={!selectedRide} onClick={() => setActiveStep('booking')}>
                    Confirm {selectedRide?.vehicle} <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeStep === 'booking' && (
            <div className="text-center py-10 space-y-6 animate-in">
              <ShieldCheck size={48} className="mx-auto text-emerald-400" />
              <h2 className="text-2xl font-bold">Ride Dispatched!</h2>
              <div className="driver-profile-new">
                <div className="avatar-circle"><User /></div>
                <div><span className="driver-name">Ramesh Shetty</span><span className="car-plate">KA 20 AB 9999 • 4.9 ★</span></div>
              </div>
              <button className="confirm-button" style={{background: '#334155'}} onClick={() => window.location.reload()}>Book Another Ride</button>
            </div>
          )}
        </div>
      </div>

      <div className="map-container-full">
        <MapContainer center={[13.3409, 74.7421]} zoom={13} zoomControl={false} className="full-map">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapClickHandler />
          {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
          {drop && <Marker position={[drop.lat, drop.lng]} />}
          {pickup && <MapRecenter center={pickup} />}
          {routePath && <Polyline positions={routePath} color="#2563eb" weight={6} opacity={0.8} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;