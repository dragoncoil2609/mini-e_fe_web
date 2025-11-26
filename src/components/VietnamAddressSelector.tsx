// src/components/VietnamAddressSelector.tsx
import React, { useEffect, useState, useRef } from 'react';

interface Ward {
  code: number | string;
  name: string;
}

interface District {
  code: number | string;
  name: string;
  wards: Ward[];
}

interface Province {
  code: number | string;
  name: string;
  districts: District[];
}

interface VietnamAddressSelectorProps {
  fullAddress: string;
  onFullAddressChange: (fullAddress: string) => void;
  /** Callback để bắn toạ độ ra ngoài khi chọn gợi ý */
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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [detail, setDetail] = useState('');
  
  // Trạng thái hệ thống
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái gợi ý (Nominatim)
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>(''); 

  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. LOAD TỈNH / HUYỆN / XÃ
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLoc(true);
        const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
        if (!res.ok) throw new Error('Fetch provinces failed');
        const data: Province[] = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error(err);
        setError('Lỗi tải danh sách tỉnh thành.');
      } finally {
        setLoadingLoc(false);
      }
    };
    fetchData();
  }, []);

  const selectedProvince = provinces.find((p) => String(p.code) === provinceCode);
  const districts = selectedProvince?.districts ?? [];
  const selectedDistrict = districts.find((d) => String(d.code) === districtCode);
  const wards = selectedDistrict?.wards ?? [];
  const selectedWard = wards.find((w) => String(w.code) === wardCode);

  // 2. GHÉP ĐỊA CHỈ ĐẦY ĐỦ
  useEffect(() => {
    if (!provinceCode && !districtCode && !wardCode && !detail) {
      onFullAddressChange('');
      return;
    }
    const parts = [
      detail || '',
      selectedWard?.name || '',
      selectedDistrict?.name || '',
      selectedProvince?.name || '',
    ].filter(Boolean);
    onFullAddressChange(parts.join(', '));
  }, [detail, provinceCode, districtCode, wardCode, selectedProvince, selectedDistrict, selectedWard, onFullAddressChange]);

  // 3. LOGIC TÌM KIẾM NOMINATIM (3 CẤP ĐỘ)
  useEffect(() => {
    if (!detail || detail.trim().length < 3) {
      setSuggestions([]);
      setShowSuggest(false);
      setSearchStatus('');
      return;
    }
    if (!selectedProvince) {
      setSearchStatus('Vui lòng chọn Tỉnh/Thành phố trước.');
      return;
    }

    const controller = new AbortController();

    const fetchNominatim = async (q: string) => {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', q);
      url.searchParams.set('countrycodes', 'vn');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');
      
      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) return [];
      return await res.json();
    };

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchStatus('Đang tìm kiếm...');
        setSuggestions([]);

        let data: any[] = [];

        // CẤP 1: Chi tiết + Huyện + Tỉnh
        if (selectedDistrict) {
            const q1 = `${detail}, ${selectedDistrict.name}, ${selectedProvince.name}`;
            data = await fetchNominatim(q1);
        }

        // CẤP 2: Chi tiết + Tỉnh
        if ((!data || data.length === 0)) {
            const q2 = `${detail}, ${selectedProvince.name}`;
            data = await fetchNominatim(q2);
        }

        // CẤP 3: Chỉ tìm "Chi tiết" + Việt Nam
        if ((!data || data.length === 0) && detail.length > 5) {
            const q3 = `${detail}, Việt Nam`;
            data = await fetchNominatim(q3);
        }

        if (data && data.length > 0) {
          // LƯU CẢ LAT/LON VÀO ITEM
          const items: SuggestItem[] = data.map((d: any) => ({ 
              label: d.display_name,
              lat: d.lat,
              lon: d.lon 
          }));
          setSuggestions(items);
          setShowSuggest(true);
          setSearchStatus(`Tìm thấy ${items.length} kết quả.`);
        } else {
          setSuggestions([]);
          setShowSuggest(false);
          setSearchStatus('Không tìm thấy gợi ý nào.');
        }

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setSearchStatus('Lỗi kết nối định vị.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [detail, selectedProvince, selectedDistrict]);

  // Handlers
  const handleSelectSuggestion = (item: SuggestItem) => {
    // 1. Cắt chuỗi để lấy địa chỉ đẹp điền vào ô input
    const parts = item.label.split(',').map(p => p.trim());
    let cutIndex = -1;
    
    if (selectedWard) cutIndex = parts.findIndex(p => p.toLowerCase().includes(selectedWard.name.toLowerCase()));
    if (cutIndex === -1 && selectedDistrict) cutIndex = parts.findIndex(p => p.toLowerCase().includes(selectedDistrict.name.toLowerCase()));
    if (cutIndex === -1 && selectedProvince) cutIndex = parts.findIndex(p => p.toLowerCase().includes(selectedProvince.name.toLowerCase()));

    let newDetail = '';
    if (cutIndex > 0) {
        newDetail = parts.slice(0, cutIndex).join(', ');
    } else {
        newDetail = parts.slice(0, 2).join(', ');
    }

    setDetail(newDetail);
    setSuggestions([]);
    setShowSuggest(false);
    setSearchStatus(''); 

    // 2. QUAN TRỌNG: Gửi toạ độ ra ngoài để Map cập nhật
    if (onLatLngChange) {
        console.log("📍 Cập nhật toạ độ map:", item.lat, item.lon);
        onLatLngChange(item.lat, item.lon);
    }
  };

  return (
    <div ref={wrapperRef}>
      {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        <select 
            style={{ padding: 8 }} 
            value={provinceCode} 
            onChange={(e) => {
                setProvinceCode(e.target.value);
                setDistrictCode(''); setWardCode(''); setDetail('');
            }}
        >
          <option value="">-- Chọn Tỉnh/Thành phố --</option>
          {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>

        <select 
            style={{ padding: 8 }} 
            value={districtCode} 
            onChange={(e) => {
                setDistrictCode(e.target.value);
                setWardCode(''); setDetail('');
            }}
            disabled={!provinceCode}
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {selectedProvince?.districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>

        <select 
            style={{ padding: 8 }} 
            value={wardCode} 
            onChange={(e) => setWardCode(e.target.value)}
            disabled={!districtCode}
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {selectedDistrict?.wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
        </select>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Số nhà, tên đường (Ví dụ: 2 Nguyễn Huệ)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
          style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
        />

        {searchStatus && (
            <div style={{ fontSize: 11, color: isSearching ? 'blue' : '#666', marginTop: 4, fontStyle: 'italic' }}>
                {searchStatus}
            </div>
        )}

        {showSuggest && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '100%', left: 0, right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '0 0 4px 4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 9999,
              listStyle: 'none',
              padding: 0,
              margin: 0,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                }}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loadingLoc && <div style={{ fontSize: 12 }}>Đang tải dữ liệu hành chính...</div>}
    </div>
  );
};

export default VietnamAddressSelector;