import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { searchLocation } from '../api'; // Ensure this matches your api.js path

const LocationSearch = ({ placeholder, value, onSelect, onUseCurrent, autoFocus }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync internal text when the parent updates the value (e.g. Map Click)
  useEffect(() => {
    if (value) {
      setQuery(value.name);
    } else {
      setQuery(''); // Clear text if value is null
    }
  }, [value]);

  const handleSearch = async (e) => {
    const txt = e.target.value;
    setQuery(txt);
    
    // Only search if 3+ characters
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
    onSelect(item); // Send selected place back to App.jsx
  };

  return (
    <div className="search-wrapper" style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        placeholder={placeholder}
        value={query}
        onChange={handleSearch}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: '0.95rem',
          fontWeight: '500',
          color: '#1f2937',
          background: 'transparent'
        }}
      />
      
      {/* Search Suggestions Dropdown */}
      {results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          zIndex: 1000,
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '5px',
          border: '1px solid #e5e7eb'
        }}>
          {results.map((item, idx) => (
            <div 
              key={idx} 
              onClick={(e) => { e.stopPropagation(); selectResult(item); }}
              style={{
                padding: '10px',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <MapPin size={14} color="#6b7280" />
              <div>
                <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{item.name}</div>
                <div style={{fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px'}}>
                  {item.full_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;