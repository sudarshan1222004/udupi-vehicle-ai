import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { searchLocation } from '../api';

const LocationSearch = ({ type, value, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Force white text by updating query when value changes from Map or Search
    if (value) setQuery(value.name);
  }, [value]);

  const handleSearch = async (e) => {
    const txt = e.target.value;
    setQuery(txt);
    if (txt.length > 2) {
      const data = await searchLocation(txt);
      setResults(data);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="w-full relative group">
      <label className="text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">
        {type === 'pickup' ? 'Pickup Location' : 'Dropoff Location'}
      </label>
      <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-all">
        <input
          type="text"
          className="bg-transparent border-none outline-none w-full text-white font-bold placeholder-slate-500 text-sm"
          placeholder={type === 'pickup' ? "Enter pickup..." : "Enter dropoff..."}
          value={query}
          onChange={handleSearch}
        />
      </div>
      
      {results.length > 0 && (
        <div className="absolute z-[3000] w-full bg-slate-900 border border-slate-700 mt-2 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {results.map((item, idx) => (
            <div 
              key={idx} 
              className="p-4 hover:bg-blue-600/20 cursor-pointer flex items-center gap-3 border-b border-slate-800 last:border-none transition-colors"
              onClick={() => {
                onSelect({ lat: item.lat, lng: item.lng, name: item.name });
                setResults([]);
              }}
            >
              <MapPin size={16} className="text-blue-500" />
              <div>
                <div className="text-white text-sm font-bold">{item.name}</div>
                <div className="text-slate-500 text-[10px] truncate w-60">{item.full_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;