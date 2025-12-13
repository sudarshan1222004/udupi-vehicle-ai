import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { searchLocation } from '../api';

const LocationSearch = ({ type, value, onChange, onSelect, onUseCurrent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync internal state if parent changes value (e.g. map click)
  useEffect(() => {
    if (value) setQuery(value.name || `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`);
  }, [value]);

  const handleSearch = async (e) => {
    const txt = e.target.value;
    setQuery(txt);
    if (txt.length > 2) {
      setIsSearching(true);
      const data = await searchLocation(txt);
      setResults(data);
      setIsSearching(false);
    } else {
      setResults([]);
    }
  };

  const selectResult = (item) => {
    setQuery(item.name);
    setResults([]);
    onSelect({ lat: item.lat, lng: item.lon, name: item.name });
  };

  return (
    <div className="search-container">
      <div className={`input-wrapper ${type}`}>
        {type === 'pickup' ? <div className="dot green"></div> : <div className="dot red"></div>}
        <input 
          type="text" 
          placeholder={type === 'pickup' ? "Enter pickup location" : "Enter drop location"}
          value={query}
          onChange={handleSearch}
        />
        {type === 'pickup' && !query && (
          <button className="current-loc-btn" onClick={onUseCurrent} title="Use Current Location">
            <Navigation size={16} />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {results.length > 0 && (
        <div className="search-results">
          {results.map((item, idx) => (
            <div key={idx} className="search-item" onClick={() => selectResult(item)}>
              <MapPin size={14} color="#6b7280" />
              <div>
                <div className="main-text">{item.name}</div>
                <div className="sub-text">{item.full_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;