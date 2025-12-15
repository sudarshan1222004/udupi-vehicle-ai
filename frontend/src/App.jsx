import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import { User, ShieldCheck, Navigation } from 'lucide-react';
import LocationSearch from './components/LocationSearch';
import { getRoadRoute, getPricePrediction, reverseGeocode } from './api';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';

// --- FIXED LEAFLET IMPORTS: Using static URLs to bypass Node/Vite build errors ---
const DEFAULT_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const DEFAULT_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// 1. Fix Default Map Pin (Updated to use the new constants)
let DefaultIcon = L.icon({ 
    iconUrl: DEFAULT_ICON_URL, 
    shadowUrl: DEFAULT_SHADOW_URL, 
    iconSize: [25, 41], 
    iconAnchor: [12, 41] 
});
L.Marker.prototype.options.icon = DefaultIcon;
// ---------------------------------------------------------------------------------


// 2. STABLE ICON URLs (Icons8 CDN - guaranteed to load)
const IconSize = [48, 48];
const IconAnchor = [24, 24];

const carUrl = 'https://img.icons8.com/fluency/48/sedan.png';
const autoUrl = 'https://img.icons8.com/fluency/48/tuk-tuk.png'; 
const bikeUrl = 'https://img.icons8.com/fluency/48/motorcycle.png';

const carIcon = new L.Icon({ iconUrl: carUrl, iconSize: IconSize, iconAnchor: IconAnchor });
const autoIcon = new L.Icon({ iconUrl: autoUrl, iconSize: IconSize, iconAnchor: IconAnchor });
const bikeIcon = new L.Icon({ iconUrl: bikeUrl, iconSize: IconSize, iconAnchor: IconAnchor });

// 3. Helper: Get Menu Image
const getVehicleImgUrl = (type) => {
  const t = type.toLowerCase();
  if (t.includes('auto')) return autoUrl;
  if (t.includes('bike') || t.includes('honda') || t.includes('activa')) return bikeUrl;
  // Use the general car image for Mini, Sedan, and SUV
  if (t.includes('mini') || t.includes('sedan') || t.includes('suv')) return carUrl; 
  return carUrl;
};

// 4. Helper: Get Map Marker
const getDriverIcon = (vehicleName) => {
  if (!vehicleName) return carIcon;
  const t = vehicleName.toLowerCase();
  if (t.includes('auto')) return autoIcon;
  if (t.includes('activa') || t.includes('bike')) return bikeIcon;
  return carIcon;
};

const DUMMY_DRIVERS = [
  { name: "Ramesh Shetty", plate: "KA 20 AB 1234", vehicle: "Toyota Etios" },
  { name: "Suresh Naik", plate: "KA 19 MD 9988", vehicle: "Suzuki Swift" },
  { name: "Abdul Razzak", plate: "KA 20 Z 5544", vehicle: "Bajaj Auto" }, // Auto Icon
  { name: "Ganesh Acharya", plate: "KA 20 M 7766", vehicle: "Honda Activa" }, // Bike Icon
];

function MapRecenter({ pickup, drop, driverLoc }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && drop) {
      const bounds = L.latLngBounds([pickup, drop]);
      if (driverLoc) bounds.extend(driverLoc);
      map.fitBounds(bounds, { padding: [80, 80] }); 
    } else if (pickup) {
      map.flyTo(pickup, 14);
    }
  }, [pickup, drop, driverLoc, map]);
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
  const [tip, setTip] = useState(0);
  
  const [otp, setOtp] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  const [driverLocation, setDriverLocation] = useState(null);
  const [driverPath, setDriverPath] = useState(null);

  const handleCurrentLocation = (e) => {
    e.stopPropagation();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: address.name });
        setActiveField('drop');
      }, () => alert("GPS Error"));
    }
  };

  // ==========================================================
  // FIX: Robust Route Fetching and Price Prediction with Key Mapping
  // ==========================================================
  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickup || !drop) {
        setRides([]); 
        return;
      }

      setLoadingRoute(true);
      setRides([]); 

      try {
        const routeData = await getRoadRoute(pickup, drop);
        
        if (routeData && routeData.coordinates.length > 0) {
          setRoutePath(routeData.coordinates);
          
          const priceData = await getPricePrediction(pickup, drop, routeData.distance_km);
          
          if (priceData && priceData.rides && priceData.rides.length > 0) {
            
            console.log("SUCCESS: Received", priceData.rides.length, "rides from backend."); 
            
            const mappedRides = priceData.rides.map(ride => ({
              vehicle: ride.vehicle_type, 
              price: ride.price,
              distance_km: ride.distance_km,
              eta_minutes: ride.estimated_time_min, 
              surge_active: ride.surge_active || false,
            }));
            
            setRides(mappedRides);
            setActiveStep('selecting'); 
            
          } else {
             console.error("ERROR: Backend returned empty or invalid ride array. Check backend logs:", priceData);
             setRides([]);
             // *** CRITICAL FALLBACK FIX: If we have a route but no price, still transition the state ***
             // This ensures the input boxes are replaced by the 'Calculating...' message, 
             // even if the ride list itself is empty, preventing the "search" state from sticking.
             setActiveStep('selecting'); 
          }
        } else {
          console.error("ERROR: Route service (OSRM) failed to return coordinates.");
          setRoutePath(null);
        }
      } catch (error) {
        console.error("CRITICAL ERROR during route/price fetch (API or network failure):", error);
        setRides([]);
      } finally {
        setLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [pickup, drop]);
  // ==========================================================
  // END FIX
  // ==========================================================


  const handleBookRide = async () => {
    if (!selectedRide) return;
    setActiveStep('searching_driver');
    setHasArrived(false); 
    setDriverLocation(null);
    setOtp(Math.floor(1000 + Math.random() * 9000));

    // FILTER DRIVERS
    let eligibleDrivers = DUMMY_DRIVERS;
    const vType = selectedRide.vehicle.toLowerCase();
    
    // Updated driver filtering logic to match all 5 types more broadly
    if (vType.includes('auto')) {
        eligibleDrivers = DUMMY_DRIVERS.filter(d => d.vehicle.toLowerCase().includes('auto'));
    } else if (vType.includes('bike')) {
        eligibleDrivers = DUMMY_DRIVERS.filter(d => d.vehicle.toLowerCase().includes('activa'));
    } else {
        // Assume Mini/Sedan/SUV map to the general car drivers
        eligibleDrivers = DUMMY_DRIVERS.filter(d => !d.vehicle.toLowerCase().includes('auto') && !d.vehicle.toLowerCase().includes('activa'));
    }
    
    if (eligibleDrivers.length === 0) eligibleDrivers = DUMMY_DRIVERS;

    setTimeout(async () => {
      const randomDriver = eligibleDrivers[Math.floor(Math.random() * eligibleDrivers.length)];
      setDriver(randomDriver);

      const offsetLat = (Math.random() - 0.5) * 0.015; 
      const offsetLng = (Math.random() - 0.5) * 0.015;
      const driverStart = { lat: pickup.lat + offsetLat, lng: pickup.lng + offsetLng };
      setDriverLocation(driverStart);

      const pathToPickup = await getRoadRoute(driverStart, pickup);
      if (pathToPickup) {
        setDriverPath(pathToPickup.coordinates);
        animateDriver(pathToPickup.coordinates);
      } else {
        setDriverLocation(driverStart);
        setHasArrived(true); 
      }

      setActiveStep('driver_found');
    }, 4000);
  };

  const animateDriver = (pathCoords) => {
    let index = 0;
    const totalPoints = pathCoords.length;
    const animationDuration = 10000;
    const stepDelay = animationDuration / totalPoints;

    const interval = setInterval(() => {
      if (index >= totalPoints) {
        clearInterval(interval);
        setHasArrived(true);
        return;
      }
      setDriverLocation({ lat: pathCoords[index][0], lng: pathCoords[index][1] });
      index++;
    }, stepDelay);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        if (activeStep !== 'search' && activeStep !== 'selecting') return;
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng, name: address.name };
        if (activeField === 'pickup') { setPickup(coords); setActiveField('drop'); } 
        else { setDrop(coords); }
      },
    });
    return null;
  };

  const resetApp = () => {
    setPickup(null); setDrop(null); setRoutePath(null); setRides([]);
    setSelectedRide(null); setDriver(null); setDriverLocation(null); setDriverPath(null);
    setTip(0); setActiveStep('search'); setActiveField('pickup'); setHasArrived(false);
  };

  return (
    <div className="app-container">
      <div className="booking-panel">
        <div className="panel-header">
            <h1>Smart Ride</h1>
            {/* --- DEBUG: Direct Visual Confirmation --- */}
            {activeStep} | RIDES: {rides.length}
            {/* --- END DEBUG --- */}
        </div>
        <div className="panel-content">
          
          {(activeStep === 'search' || activeStep === 'selecting') && (
            <>
              {/* This entire section is the content shown during the 'search'/'selecting' steps */}
              
              {/* Only show input boxes if we are still searching/selecting locations */}
              {activeStep === 'search' && (
                <div className="input-group">
                  <div className={`location-input-row ${activeField === 'pickup' ? 'active' : ''}`} onClick={() => setActiveField('pickup')}>
                    <div style={{width:'20px', display:'flex', justifyContent:'center'}}><div className="dot green"></div></div>
                    <div className="input-text">
                      <span className="label">Pickup</span>
                      <LocationSearch placeholder="Search pickup..." value={pickup} onSelect={(val) => { setPickup(val); setActiveField('drop'); }} autoFocus={activeField === 'pickup'} />
                    </div>
                    <button className="current-loc-btn" onClick={handleCurrentLocation}><Navigation size={18} /></button>
                  </div>
                  <div className={`location-input-row ${activeField === 'drop' ? 'active' : ''}`} onClick={() => setActiveField('drop')}>
                    <div style={{width:'20px', display:'flex', justifyContent:'center'}}><div className="dot red"></div></div>
                    <div className="input-text">
                      <span className="label">Dropoff</span>
                      <LocationSearch placeholder="Search dropoff..." value={drop} onSelect={(val) => setDrop(val)} autoFocus={activeField === 'drop'} />
                    </div>
                  </div>
                </div>
              )}

              {loadingRoute && <div style={{padding:'20px', textAlign:'center'}}>Calculating route...</div>}

              {/* If we have a route but no rides, this is the error state */}
              {activeStep === 'selecting' && !loadingRoute && rides.length === 0 && (
                 <div style={{padding:'20px', textAlign:'center', color:'red'}}>
                    Could not find ride options for this route. Try a longer distance.
                 </div>
              )}

              {/* === TEMPORARY DEBUG MESSAGE START: FORCED VISUAL CONFIRMATION === */}
              {rides.length > 0 && <h3 style={{color:'red', background:'yellow', padding:'10px', textAlign: 'center'}}>RIDES ARE HERE! Count: {rides.length}</h3>}
              {/* === TEMPORARY DEBUG MESSAGE END === */}

              {rides.length > 0 && !loadingRoute && (
                <div className="rides-list" style={{marginTop:'20px'}}>
                  <h3>Choose a ride</h3>
                  {rides.map(ride => (
                    // *** FIX: Inline styles to FORCE visibility and test data flow ***
                    <div key={ride.vehicle} 
                         style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: selectedRide?.vehicle === ride.vehicle ? '2px solid #2563eb' : '1px solid #ddd', borderRadius: '5px', marginBottom: '8px', cursor: 'pointer', backgroundColor: selectedRide?.vehicle === ride.vehicle ? '#f0f4ff' : 'white'}}
                         onClick={() => setSelectedRide(ride)}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <img src={getVehicleImgUrl(ride.vehicle)} alt={ride.vehicle} style={{width: '40px', height: '40px', objectFit: 'contain'}}/>
                        <div className="ride-details">
                          <h4 style={{margin: 0, fontSize: '1rem'}}>{ride.vehicle}</h4>
                          <p style={{margin: 0, fontSize: '0.8rem', color: '#6b7280'}}>{ride.eta_minutes} mins • {ride.distance_km} km</p>
                        </div>
                      </div>
                      <div className="price" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>₹{ride.price}</div>
                    </div>
                  ))}
                  <button className="action-btn" disabled={!selectedRide} onClick={handleBookRide}>{selectedRide ? `Book ${selectedRide.vehicle}` : 'Select a Vehicle'}</button>
                </div>
              )}
            </>
          )}

          {activeStep === 'searching_driver' && (
            <div className="searching-view">
              <div className="pulse-ring"></div>
              <h2>Connecting...</h2>
              <p>Finding the best driver for you.</p>
            </div>
          )}

          {activeStep === 'driver_found' && driver && (
            <div className="success-view">
              <div style={{display:'flex', alignItems:'center', gap:'10px', color: hasArrived ? '#000' : '#10b981', marginBottom:'10px'}}>
                <ShieldCheck size={28} />
                <h2 style={{margin:0}}>{hasArrived ? "Driver Arrived!" : "Driver on the way"}</h2>
              </div>
              
              {hasArrived && (
                <div className="otp-box" style={{animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
                  OTP: {otp}
                </div>
              )}

              <div className="driver-card">
                <div className="driver-avatar"><User size={24}/></div>
                <div style={{flex:1}}>
                  <h4 style={{margin:0}}>{driver.name}</h4>
                  <p style={{margin:0, fontSize:'0.8rem', color:'#6b7280'}}>{driver.vehicle} • {driver.plate}</p>
                </div>
                <div className={`eta-badge ${hasArrived ? 'arrived' : ''}`}>
                  {hasArrived ? "HERE" : "Arriving..."}
                </div>
              </div>
              
              {!hasArrived && <p style={{fontSize:'0.9rem', color:'#6b7280', margin:0}}>Your ride is arriving in ~10 seconds...</p>}
              
              {hasArrived && (
                <div className="tip-section">
                    <p style={{fontSize:'0.9rem', color:'#10b981', fontWeight:'600', margin:0}}>Share OTP to start ride.</p>
                    <span className="label" style={{marginTop:'10px', display:'block'}}>Add a Tip</span>
                    <div className="tip-options">
                      {[10, 20, 50].map(amt => (
                        <button key={amt} className={`tip-btn ${tip === amt ? 'active' : ''}`} onClick={() => setTip(amt === tip ? 0 : amt)}>+₹{amt}</button>
                      ))}
                    </div>
                </div>
              )}

              <div style={{marginTop:'auto', paddingTop:'20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontWeight:'700'}}>
                    <span>Total Fare</span>
                    <span>₹{selectedRide ? selectedRide.price + tip : tip}</span>
                  </div>
                  <button className="action-btn" onClick={resetApp}>{hasArrived ? "Complete Ride" : "Cancel Ride"}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="map-layer">
        <MapContainer center={[13.3409, 74.7421]} zoom={13} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="CARTO" />
          <MapClickHandler />
          
          {pickup && <Marker position={pickup}><Popup>Pickup</Popup></Marker>}
          {drop && <Marker position={drop}><Popup>Drop</Popup></Marker>}
          
          {driverLocation && (
              <Marker position={driverLocation} icon={getDriverIcon(driver?.vehicle)}>
                <Popup>Your Driver</Popup>
             </Marker>
          )}

          <MapRecenter pickup={pickup} drop={drop} driverLoc={driverLocation} />
          {routePath && <Polyline positions={routePath} color="#2563eb" weight={5} opacity={0.6} />}
          {driverPath && <Polyline positions={driverPath} color="black" weight={3} dashArray="5, 10" opacity={0.4} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;