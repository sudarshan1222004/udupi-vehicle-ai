import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import { User, ShieldCheck, Navigation, Clock, ChevronRight, Key, Heart, Wallet } from 'lucide-react';
import LocationSearch from './components/LocationSearch';
import { getRoadRoute, getPricePrediction, reverseGeocode } from './api';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});
const DriverIcon = L.icon({
  iconUrl: 'https://img.icons8.com/fluency/48/taxi.png',
  iconSize: [40, 40], iconAnchor: [20, 20]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo([center.lat, center.lng], 14); }, [center, map]);
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
  const [driverPos, setDriverPos] = useState(null);
  const [otp] = useState(Math.floor(1000 + Math.random() * 9000));
  const [tip, setTip] = useState(0);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: address.name });
      });
    }
  };

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

  useEffect(() => {
    if (activeStep === 'booking' && pickup) {
      let startPos = { lat: pickup.lat + 0.004, lng: pickup.lng + 0.004 };
      setDriverPos(startPos);
      const interval = setInterval(() => {
        setDriverPos(prev => {
          if (!prev) return startPos;
          const latDiff = (pickup.lat - prev.lat) * 0.05;
          const lngDiff = (pickup.lng - prev.lng) * 0.05;
          if (Math.abs(latDiff) < 0.00001) { clearInterval(interval); return pickup; }
          return { lat: prev.lat + latDiff, lng: prev.lng + lngDiff };
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeStep, pickup]);

  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        if (activeStep !== 'search') return;
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng, name: address.name };
        if (!pickup) setPickup(coords); else if (!drop) setDrop(coords);
      },
    });
    return null;
  };

  return (
    <div className="app-layout">
      <div className="sidebar shadow-2xl">
        <div className="brand-section">
          <h1 className="brand-logo tracking-tighter italic">SMART RIDE</h1>
          <p className="brand-tagline">Udupi AI Mobility Console</p>
        </div>

        <div className="content-area scrollbar-hide">
          {activeStep === 'search' && (
            <div className="animate-in space-y-6">
              <div className="input-card glass-effect">
                <div className="flex items-center gap-2">
                  <div className="flex-1"><LocationSearch type="pickup" value={pickup} onSelect={setPickup} /></div>
                  <button onClick={handleCurrentLocation} className="p-3 mt-4 bg-blue-600/20 hover:bg-blue-600 rounded-xl transition-all group">
                    <Navigation size={18} className="text-blue-400 group-hover:text-white" />
                  </button>
                </div>
                <div className="vertical-divider"></div>
                <LocationSearch type="drop" value={drop} onSelect={setDrop} />
              </div>

              {loading && <div className="status-loader"><div className="spinner"></div><span className="text-sm font-bold opacity-60">AI Syncing...</span></div>}

              {rides.length > 0 && !loading && (
                <div className="space-y-4">
                  <h3 className="section-title">Available in Udupi</h3>
                  <div className="rides-grid">
                    {rides.map(ride => (
                      <div key={ride.vehicle} className={`ride-card-new ${selectedRide?.vehicle === ride.vehicle ? 'active' : ''}`} onClick={() => setSelectedRide(ride)}>
                        <div className="ride-card-main">
                          <img src={`https://img.icons8.com/color/48/${ride.vehicle.toLowerCase().includes('auto') ? 'tuk-tuk' : ride.vehicle.toLowerCase().includes('bike') ? 'motorcycle' : 'car'}.png`} alt="v" />
                          <div><span className="vehicle-name">{ride.vehicle}</span><span className="eta-tag">{ride.eta} min away</span></div>
                        </div>
                        <div className="text-right">
                          <span className="price-tag">₹{ride.price}</span>
                          {ride.surge && <span className="surge-badge">SURGE ACTIVE</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="confirm-button shadow-blue" disabled={!selectedRide} onClick={() => setActiveStep('booking')}>
                    Confirm {selectedRide?.vehicle} <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeStep === 'booking' && (
            <div className="animate-in space-y-6">
              <div className="text-center">
                <ShieldCheck size={44} className="text-emerald-500 mx-auto mb-2" />
                <h2 className="text-xl font-black">Ride Dispatched</h2>
              </div>
              
              <div className="otp-card glass-effect">
                 <div className="flex items-center gap-3 justify-center mb-1"><Key size={16} className="text-blue-400" /> <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Start Trip OTP</span></div>
                 <span className="text-4xl font-black tracking-[0.3em] text-white font-mono">{otp}</span>
              </div>

              <div className="tip-section space-y-3 p-4 bg-blue-600/5 rounded-3xl border border-blue-500/10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-center"><Heart size={12} /> Add a Tip</span>
                <div className="flex gap-2">
                  {[20, 30, 50].map(amt => (
                    <button key={amt} onClick={() => setTip(amt)} className={`flex-1 py-3 rounded-2xl border transition-all text-sm font-black ${tip === amt ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="driver-profile-new glass-effect">
                <div className="avatar-circle"><User size={20} /></div>
                <div><span className="driver-name font-black">Ramesh Shetty</span><span className="car-plate">KA 20 AB 9999 • 4.9 ★</span></div>
              </div>
              <button className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-red-500" onClick={() => window.location.reload()}>Cancel Request</button>
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
          {driverPos && <Marker position={[driverPos.lat, driverPos.lng]} icon={DriverIcon} />}
          {pickup && <MapRecenter center={pickup} />}
          {routePath && <Polyline positions={routePath} color="#2563eb" weight={7} opacity={0.6} lineCap="round" />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;