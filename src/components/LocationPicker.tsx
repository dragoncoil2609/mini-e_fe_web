// src/components/LocationPicker.tsx
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';

const DEFAULT_CENTER: LatLngExpression = [16.047079, 108.20623]; // Đà Nẵng
const DEFAULT_ZOOM = 5;

// icon mặc định cho marker
const defaultIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  address: string; // địa chỉ đầy đủ (shopAddress)
  lat: string;
  lng: string;
  /** chỉ cần trả lat/lng, address đã được quản lý ở ngoài */
  onChange: (value: { lat?: string; lng?: string }) => void;
}

interface ClickMarkerProps {
  position: LatLngExpression | null;
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

  return <Marker position={position} icon={defaultIcon} draggable={false} />;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  lat,
  lng,
  onChange,
}) => {
  const [position, setPosition] = useState<LatLngExpression | null>(
    null,
  );
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sync lat/lng truyền từ ngoài (VD: đã lưu trước đó)
  useEffect(() => {
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setPosition([latNum, lngNum]);
        return;
      }
    }
    // nếu chưa có lat/lng thì để null, map sẽ dùng DEFAULT_CENTER
  }, [lat, lng]);

  // Mỗi khi địa chỉ đầy đủ đổi → tự geocode để định vị trên map
  useEffect(() => {
    const trimmed = address?.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setGeocoding(true);
        setError(null);

        const url = new URL(
          'https://nominatim.openstreetmap.org/search',
        );
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('countrycodes', 'vn');
        url.searchParams.set('limit', '1');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'vi',
          },
        });

        if (!res.ok) throw new Error('Geocoding failed');

        const data: any[] = await res.json();
        if (!data || data.length === 0) {
          setError('Không tìm thấy vị trí trên bản đồ từ địa chỉ.');
          return;
        }

        const first = data[0];
        const latNum = parseFloat(first.lat);
        const lngNum = parseFloat(first.lon);

        if (!isNaN(latNum) && !isNaN(lngNum)) {
          setPosition([latNum, lngNum]);
          onChange({
            lat: String(latNum),
            lng: String(lngNum),
          });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
          setError('Không thể định vị trên bản đồ.');
        }
      } finally {
        setGeocoding(false);
      }
    }, 500); // debounce 500ms khi địa chỉ thay đổi

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, onChange]);

  const handleMapClickChange = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onChange({
      lat: String(newLat),
      lng: String(newLng),
    });
  };

  const center = position || DEFAULT_CENTER;
  const zoom = position ? 15 : DEFAULT_ZOOM;

  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Lat: {lat || '-'} | Lng: {lng || '-'}
      </div>
      {error && (
        <div style={{ color: 'red', marginBottom: 4, fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ height: 300, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickMarker
            position={position}
            onChangePosition={handleMapClickChange}
          />
        </MapContainer>
      </div>

      {geocoding && (
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Đang định vị trên bản đồ...
        </div>
      )}

      <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
        * Bạn có thể click trực tiếp lên bản đồ để điều chỉnh vị trí. Lat/Lng
        sẽ tự cập nhật.
      </div>
    </div>
  );
};

export default LocationPicker;
