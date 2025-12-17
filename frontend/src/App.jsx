import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import { User, ShieldCheck } from 'lucide-react';
import LocationSearch from './components/LocationSearch';
import { getRoadRoute, getPricePrediction, reverseGeocode } from './api';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

// --- RELIABLE ASSET FIX ---
// Using data URIs or direct CDN links for icons to bypass "Tracking Prevention" blocks
const carUrl = 'https://img.icons8.com/fluency/48/sedan.png';
const autoUrl = 'https://img.icons8.com/fluency/48/tuk-tuk.png'; 
const bikeUrl = 'https://img.icons8.com/fluency/48/motorcycle.png';

// Custom Marker Icons
const carIcon = new L.Icon({ iconUrl: carUrl, iconSize: [40, 40], iconAnchor: [20, 20] });
const autoIcon = new L.Icon({ iconUrl: autoUrl, iconSize: [40, 40], iconAnchor: [20, 20] });
const bikeIcon = new L.Icon({ iconUrl: bikeUrl, iconSize: [40, 40], iconAnchor: [20, 20] });

// Default Pin Fix: Overriding Leaflet's default to avoid external storage/cookie blocks
const defaultPin = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapRecenter({ pickup, drop }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && drop) {
      const bounds = L.latLngBounds([pickup, drop]);
      map.fitBounds(bounds, { padding: [50, 50] }); 
    } else if (pickup) {
      map.flyTo(pickup, 14);
    }
  }, [pickup, drop, map]);
  return null;
}

function App() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [rides, setRides] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeStep, setActiveStep] = useState('search');
  const [activeField, setActiveField] = useState('pickup');
  const [selectedRide, setSelectedRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [otp, setOtp] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickup || !drop) return;
      setLoadingRoute(true);
      try {
        const routeData = await getRoadRoute(pickup, drop);
        if (routeData) {
          setRoutePath(routeData.coordinates);
          // Calling Backend on Port 8001
          const priceData = await getPricePrediction(pickup, drop, routeData.distance_km);
          
          if (Array.isArray(priceData)) {
            setRides(priceData.map(r => ({
              vehicle: r.vehicle, 
              price: r.fare,
              distance: r.distance,
              eta: r.eta, 
              demand: r.demand
            })));
            setActiveStep('selecting');
          }
        }
      } catch (err) {
        console.error("AI Backend Error:", err);
      } finally {
        setLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [pickup, drop]);

  const handleBookRide = () => {
    setActiveStep('searching_driver');
    setOtp(Math.floor(1000 + Math.random() * 9000));
    setTimeout(() => {
      setDriver({ name: "Ramesh Shetty", plate: "KA 20 AB 1234", vehicle: selectedRide.vehicle });
      setDriverLocation({ lat: pickup.lat + 0.003, lng: pickup.lng + 0.003 });
      setActiveStep('driver_found');
      setTimeout(() => setHasArrived(true), 5000);
    }, 3000);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng, name: "Pinned Point" };
        if (activeField === 'pickup') { setPickup(coords); setActiveField('drop'); } 
        else { setDrop(coords); }
      },
    });
    return null;
  };

  return (
    <div className="app-container">
      <div className="booking-panel">
        <div className="panel-header">
            <h1>Smart Ride</h1>
            <span style={{fontSize: '0.7rem'}}>Santhekatte, Udupi AI Hub [cite: 2]</span>
        </div>
        
        <div className="panel-content">
          {activeStep === 'search' && (
            <div className="input-group">
              <div className={`location-input-row ${activeField === 'pickup' ? 'active' : ''}`} onClick={() => setActiveField('pickup')}>
                <div className="dot green"></div>
                <div className="input-text">
                  <span className="label">Pickup Location</span>
                  <LocationSearch value={pickup} onSelect={(val) => { setPickup(val); setActiveField('drop'); }} />
                </div>
              </div>
              <div className={`location-input-row ${activeField === 'drop' ? 'active' : ''}`} onClick={() => setActiveField('drop')}>
                <div className="dot red"></div>
                <div className="input-text">
                  <span className="label">Dropoff Location</span>
                  <LocationSearch value={drop} onSelect={(val) => setDrop(val)} />
                </div>
              </div>
            </div>
          )}

          {loadingRoute && <div className="loader">Running ML Inference... [cite: 8]</div>}

          {activeStep === 'selecting' && !loadingRoute && (
            <div className="rides-list">
              <h3>Available Options</h3>
              {rides.map(ride => (
                <div key={ride.vehicle} className={`ride-item ${selectedRide?.vehicle === ride.vehicle ? 'selected' : ''}`} onClick={() => setSelectedRide(ride)}>
                  <img src={ride.vehicle.toLowerCase().includes('auto') ? autoUrl : ride.vehicle.toLowerCase().includes('bike') ? bikeUrl : carUrl} alt="icon" />
                  <div className="ride-info">
                    <h4>{ride.vehicle}</h4>
                    <p>{ride.eta} min • {ride.distance} km</p>
                    {ride.demand === 'High' && <span style={{color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold'}}>Surge Active [cite: 11]</span>}
                  </div>
                  <div className="price">₹{ride.price}</div>
                </div>
              ))}
              <button className="action-btn" disabled={!selectedRide} onClick={handleBookRide}>Book {selectedRide?.vehicle}</button>
            </div>
          )}

          {activeStep === 'driver_found' && (
            <div className="success-view">
              <h2>{hasArrived ? "Driver Arrived!" : "Matching Driver..."}</h2>
              {hasArrived && <div className="otp-box">OTP: {otp}</div>}
              <div className="driver-card">
                <User size={24} />
                <div>
                  <h4>{driver?.name}</h4>
                  <p>{driver?.vehicle} • {driver?.plate}</p>
                </div>
              </div>
              <button className="action-btn" onClick={() => window.location.reload()}>New Request</button>
            </div>
          )}
        </div>
      </div>

      <div className="map-layer">
        <MapContainer center={[13.3409, 74.7421]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapClickHandler />
          {pickup && <Marker position={pickup} icon={defaultPin} />}
          {drop && <Marker position={drop} icon={defaultPin} />}
          {driverLocation && <Marker position={driverLocation} icon={selectedRide?.vehicle.toLowerCase().includes('auto') ? autoIcon : selectedRide?.vehicle.toLowerCase().includes('bike') ? bikeIcon : carIcon} />}
          <MapRecenter pickup={pickup} drop={drop} />
          {routePath && <Polyline positions={routePath} color="#2563eb" weight={4} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;