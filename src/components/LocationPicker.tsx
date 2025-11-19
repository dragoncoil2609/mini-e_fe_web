import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';

const DEFAULT_CENTER: LatLngExpression = [16.047079, 108.20623]; // Đà Nẵng
const DEFAULT_ZOOM = 5; // Zoom rộng Việt Nam

// Fix icon bị lỗi khi dùng với Vite/React
const defaultIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  address: string;
  lat: string;
  lng: string;
  onChange: (value: { address?: string; lat?: string; lng?: string }) => void;
}

interface ClickMarkerProps {
  position: L.LatLngExpression | null;
  onChangePosition: (lat: number, lng: number) => void;
}

const ClickMarker: React.FC<ClickMarkerProps> = ({
  position,
  onChangePosition,
}) => {
  useMapEvents({
    click(e) {
      onChangePosition(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return <Marker position={position} icon={defaultIcon} draggable />;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  lat,
  lng,
  onChange,
}) => {
  const [query, setQuery] = useState(address || '');
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync từ props lat/lng lúc mở form
  useEffect(() => {
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setPosition([latNum, lngNum]);
      }
    }
  }, [lat, lng]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', query);
      url.searchParams.set('countrycodes', 'vn');
      url.searchParams.set('limit', '1');

      const res = await fetch(url.toString(), {
        headers: {
          // Nominatim yêu cầu User-Agent; ở FE thì khó custom,
          // nhưng ít request test thì vẫn được.
          'Accept-Language': 'vi',
        },
      });

      if (!res.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        setError('Không tìm thấy địa chỉ, thử cụ thể hơn.');
        return;
      }

      const first = data[0];
      const latNum = parseFloat(first.lat);
      const lngNum = parseFloat(first.lon);

      setPosition([latNum, lngNum]);
      onChange({
        address: query,
        lat: String(latNum),
        lng: String(lngNum),
      });
    } catch (err: any) {
      console.error(err);
      setError('Không gọi được OpenStreetMap. Thử lại sau.');
    } finally {
      setSearching(false);
    }
  };

  const handleMapClickChange = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onChange({
      lat: String(newLat),
      lng: String(newLng),
    });
  };

  const center = position || DEFAULT_CENTER;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Ô nhập địa chỉ + nút tìm trên map */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Nhập địa chỉ (ví dụ: 254 Nguyễn Văn Linh, Đà Nẵng)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>
          {searching ? 'Đang tìm...' : 'Tìm trên bản đồ'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      {/* Lat/Lng hiện tại */}
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Lat: {lat || '-'} | Lng: {lng || '-'}
      </div>

      {/* Map */}
      <div style={{ height: 300, width: '100%', marginBottom: 8 }}>
        <MapContainer
          center={center}
          zoom={position ? 15 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickMarker
            position={position}
            onChangePosition={handleMapClickChange}
          />
        </MapContainer>
      </div>

      <div style={{ fontSize: 12, color: '#555' }}>
        * Tip: bạn có thể click trực tiếp lên bản đồ để chọn vị trí, lat/lng sẽ tự cập nhật.
      </div>
    </div>
  );
};

export default LocationPicker;