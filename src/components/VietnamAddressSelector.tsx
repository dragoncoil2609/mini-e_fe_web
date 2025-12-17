// src/components/VietnamAddressSelector.tsx
import React, { useEffect, useState, useRef } from 'react';

// Interface cho dữ liệu từ esgoo.net
interface LocationItem {
  id: string;
  name: string;
  full_name?: string;
  latitude?: number;
  longitude?: number;
}

interface VietnamAddressSelectorProps {
  fullAddress: string;
  onFullAddressChange: (fullAddress: string) => void;
  onLatLngChange?: (lat: string, lng: string) => void;
}

interface SuggestItem {
  label: string;
  lat: string;
  lon: string;
}

const VietnamAddressSelector: React.FC<VietnamAddressSelectorProps> = ({
  fullAddress,
  onFullAddressChange,
  onLatLngChange,
}) => {
  // State danh sách
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  // State đang chọn
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [wardId, setWardId] = useState('');
  const [detail, setDetail] = useState('');

  // Loading & Error
  const [loadingProv, setLoadingProv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Nominatim Suggestion States ---
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Tải danh sách Tỉnh/Thành khi Mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProv(true);
        // API lấy danh sách Tỉnh (esgoo)
        const res = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
        const data = await res.json();
        if (data.error === 0) {
          setProvinces(data.data);
        } else {
          setError('Lỗi tải tỉnh thành.');
        }
      } catch (e) {
        console.error(e);
        setError('Không kết nối được API hành chính.');
      } finally {
        setLoadingProv(false);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Tải Quận/Huyện khi chọn Tỉnh
  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
        const data = await res.json();
        if (data.error === 0) setDistricts(data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDistricts();
  }, [provinceId]);

  // 3. Tải Phường/Xã khi chọn Quận/Huyện
  useEffect(() => {
    if (!districtId) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const res = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
        const data = await res.json();
        if (data.error === 0) setWards(data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWards();
  }, [districtId]);

  // 4. Cập nhật chuỗi địa chỉ đầy đủ (gửi ra ngoài cho Parent)
  useEffect(() => {
    // Nếu chưa chọn gì cả thì không update để tránh xóa địa chỉ cũ khi mới mount
    // Tuy nhiên logic này tuỳ thuộc vào requirement. 
    // Ở đây ta chỉ update khi người dùng có thao tác chọn ít nhất 1 cấp.
    
    const pName = provinces.find(p => p.id === provinceId)?.name || '';
    const dName = districts.find(d => d.id === districtId)?.name || '';
    const wName = wards.find(w => w.id === wardId)?.name || '';

    // Nếu người dùng chưa chọn gì, giữ nguyên logic (hoặc có thể parse fullAddress ngược lại - nâng cao)
    if (!pName && !dName && !wName && !detail) return;

    const parts = [detail, wName, dName, pName].filter(Boolean);
    const result = parts.join(', ');
    
    // Chỉ gọi callback khi thực sự có thay đổi so với prop đầu vào để tránh loop
    if (result !== fullAddress) {
       onFullAddressChange(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, districtId, wardId, detail]); // Bỏ fullAddress ra khỏi deps để tránh loop

  // 5. Logic Gợi ý địa chỉ (Nominatim) - Giữ nguyên logic cũ
  useEffect(() => {
    if (!detail || detail.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const q = `${detail}, Việt Nam`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=vn&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data)) {
           setSuggestions(data.map((item: any) => ({
             label: item.display_name,
             lat: item.lat,
             lon: item.lon
           })));
           setShowSuggest(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [detail]);

  const handleSelectSuggestion = (item: SuggestItem) => {
    setDetail(item.label.split(',')[0]); // Lấy phần đầu làm detail
    setShowSuggest(false);
    if (onLatLngChange) {
      onLatLngChange(item.lat, item.lon);
    }
  };

  return (
    <div ref={wrapperRef} className="vn-address-selector">
      {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Tỉnh */}
        <select
          className="form-input" // Dùng class chung của bạn
          value={provinceId}
          onChange={(e) => {
            setProvinceId(e.target.value);
            setDistrictId('');
            setWardId('');
          }}
        >
          <option value="">-- Tỉnh/Thành --</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Huyện */}
        <select
          className="form-input"
          value={districtId}
          onChange={(e) => {
            setDistrictId(e.target.value);
            setWardId('');
          }}
          disabled={!provinceId}
        >
          <option value="">-- Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Xã */}
        <select
          className="form-input"
          value={wardId}
          onChange={(e) => setWardId(e.target.value)}
          disabled={!districtId}
        >
          <option value="">-- Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Số nhà, đường..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
        />
        
        {/* Dropdown Gợi ý */}
        {showSuggest && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '1px solid #ddd', zIndex: 100,
            listStyle: 'none', padding: 0, margin: 0, maxHeight: 200, overflow: 'auto'
          }}>
            {suggestions.map((s, idx) => (
              <li 
                key={idx}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                onMouseDown={() => handleSelectSuggestion(s)}
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {loadingProv && <span style={{fontSize: 11, color: '#888'}}>Đang tải dữ liệu hành chính...</span>}
    </div>
  );
};

export default VietnamAddressSelector;