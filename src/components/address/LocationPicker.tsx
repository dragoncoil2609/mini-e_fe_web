import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';

const DEFAULT_CENTER: LatLngExpression = [16.047079, 108.20623];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 16;

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  address: string;
  lat: string;
  lng: string;
  onChange: (value: { lat?: string; lng?: string }) => void;
}

interface MarkerControllerProps {
  position: [number, number] | null;
  onChangePosition: (lat: number, lng: number) => void;
}

function ChangeView({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
    });
  }, [center, map, zoom]);

  return null;
}

function MarkerController({ position, onChangePosition }: MarkerControllerProps) {
  useMapEvents({
    click(e) {
      onChangePosition(e.latlng.lat, e.latlng.lng);
    },
  });

  const markerEvents = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      dragend(event) {
        const marker = event.target as L.Marker;
        const next = marker.getLatLng();
        onChangePosition(next.lat, next.lng);
      },
    }),
    [onChangePosition],
  );

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={defaultIcon}
      draggable
      eventHandlers={markerEvents}
    />
  );
}

async function geocodeVietnamAddress(address: string, signal: AbortSignal) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', address);
  url.searchParams.set('countrycodes', 'vn');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      'Accept-Language': 'vi',
    },
  });

  if (!res.ok) {
    throw new Error('Geocoding failed');
  }

  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  if (!data.length) {
    return null;
  }

  const latNum = Number.parseFloat(data[0].lat ?? '');
  const lngNum = Number.parseFloat(data[0].lon ?? '');

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return null;
  }

  return {
    lat: latNum,
    lng: lngNum,
  };
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  lat,
  lng,
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  const hasValidExternalCoords =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  useEffect(() => {
    if (hasValidExternalCoords) {
      setPosition([parsedLat, parsedLng]);
      setError(null);
      return;
    }

    setPosition(null);
  }, [hasValidExternalCoords, parsedLat, parsedLng]);

  useEffect(() => {
    const trimmed = address.trim();

    if (!trimmed || hasValidExternalCoords) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setGeocoding(true);
        setError(null);

        const result = await geocodeVietnamAddress(trimmed, controller.signal);
        if (!result) {
          setError('Không tìm thấy vị trí trên bản đồ từ địa chỉ hiện tại.');
          return;
        }

        setPosition([result.lat, result.lng]);
        onChange({
          lat: String(result.lat),
          lng: String(result.lng),
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
          setError('Không thể định vị trên bản đồ.');
        }
      } finally {
        setGeocoding(false);
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address, hasValidExternalCoords, onChange]);

  const handleMapPositionChange = (nextLat: number, nextLng: number) => {
    setPosition([nextLat, nextLng]);
    setError(null);
    onChange({
      lat: String(nextLat),
      lng: String(nextLng),
    });
  };

  const center = position ?? DEFAULT_CENTER;
  const zoom = position ? FOCUSED_ZOOM : DEFAULT_ZOOM;

  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Lat: {lat || '-'} | Lng: {lng || '-'}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 4, fontSize: 12 }}>{error}</div>
      )}

      <div style={{ height: 300, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <ChangeView center={center} zoom={zoom} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerController
            position={position}
            onChangePosition={handleMapPositionChange}
          />
        </MapContainer>
      </div>

      {geocoding && (
        <div style={{ fontSize: 12, marginTop: 4 }}>Đang định vị trên bản đồ...</div>
      )}

      <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
        * Bạn có thể click trực tiếp lên bản đồ hoặc kéo marker để điều chỉnh vị trí.
        Lat/Lng sẽ tự cập nhật.
      </div>
    </div>
  );
};

export default LocationPicker;