import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const LocationSearch = ({ placeholder, onSelect, autoFocus }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Debounce search to save API calls
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: query, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'in' }
          });
          setResults(res.data);
          setIsOpen(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item) => {
    setQuery(item.display_name.split(',')[0]); // Show short name in input
    setIsOpen(false);
    onSelect({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
      full_name: item.display_name
    });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '8px', padding: '0 10px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: '100%', padding: '10px 5px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem'
          }}
        />
        {query && <button onClick={() => setQuery('')} style={{border:'none', background:'transparent', cursor:'pointer'}}>✕</button>}
      </div>

      {isOpen && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, width: '100%',
          background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          listStyle: 'none', padding: '0', margin: '5px 0', zIndex: 1000, maxHeight: '200px', overflowY: 'auto'
        }}>
          {results.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', display: 'flex', gap: '8px' }}
            >
              <span>📍</span>
              <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;