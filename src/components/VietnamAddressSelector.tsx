// src/components/VietnamAddressSelector.tsx
import React, { useEffect, useState } from 'react';

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
  /** Địa chỉ đầy đủ đang có (shopAddress) */
  fullAddress: string;
  /** Khi user đổi tỉnh / quận / phường / địa chỉ cụ thể → emit địa chỉ đầy đủ mới */
  onFullAddressChange: (fullAddress: string) => void;
}

interface SuggestItem {
  label: string; // display_name từ Nominatim
}

const VietnamAddressSelector: React.FC<VietnamAddressSelectorProps> = ({
  fullAddress,
  onFullAddressChange,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // gợi ý địa chỉ cụ thể (số nhà, tên đường...)
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  // ================== LOAD TỈNH / HUYỆN / XÃ ==================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          'https://provinces.open-api.vn/api/?depth=3',
        );
        if (!res.ok) throw new Error('Fetch provinces failed');
        const data: Province[] = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error(err);
        setError('Không lấy được danh sách tỉnh/thành phố.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedProvince = provinces.find(
    (p) => String(p.code) === provinceCode,
  );
  const districts = selectedProvince?.districts ?? [];

  const selectedDistrict = districts.find(
    (d) => String(d.code) === districtCode,
  );
  const wards = selectedDistrict?.wards ?? [];

  const selectedWard = wards.find((w) => String(w.code) === wardCode);

  // =============== GHÉP ĐỊA CHỈ ĐẦY ĐỦ ===============
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

    const full = parts.join(', ');
    onFullAddressChange(full);
  }, [
    detail,
    provinceCode,
    districtCode,
    wardCode,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    onFullAddressChange,
  ]);

  // =============== GỢI Ý ĐỊA CHỈ CỤ THỂ (Nominatim) ===============
  useEffect(() => {
    // chỉ gợi ý khi có ward + detail dài >= 3 ký tự
    if (!detail || detail.trim().length < 3) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSuggestLoading(true);

        const queryParts = [
          detail,
          selectedWard.name,
          selectedDistrict.name,
          selectedProvince.name,
          'Việt Nam',
        ];
        const q = queryParts.filter(Boolean).join(', ');

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', q);
        url.searchParams.set('countrycodes', 'vn');
        url.searchParams.set('limit', '5');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'vi',
          },
        });
        if (!res.ok) throw new Error('Suggest failed');
        const data: any[] = await res.json();

        const sugg: SuggestItem[] = data.map((item) => ({
          label: item.display_name as string,
        }));
        setSuggestions(sugg);
        setShowSuggest(sugg.length > 0);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 400); // debounce 400ms

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [detail, selectedProvince, selectedDistrict, selectedWard]);

  const handleProvinceChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setProvinceCode(value);
    setDistrictCode('');
    setWardCode('');
    setDetail('');
    setSuggestions([]);
    setShowSuggest(false);
  };

  const handleDistrictChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setDistrictCode(value);
    setWardCode('');
    setDetail('');
    setSuggestions([]);
    setShowSuggest(false);
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWardCode(e.target.value);
    setDetail('');
    setSuggestions([]);
    setShowSuggest(false);
  };

  const handleDetailChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDetail(e.target.value);
    setShowSuggest(true);
  };

  const handleSelectSuggestion = (item: SuggestItem) => {
    // lấy phần đầu (thường là "Số nhà xx, Tên đường ...")
    const firstPart = item.label.split(',')[0].trim();
    setDetail(firstPart);
    setSuggestions([]);
    setShowSuggest(false);
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
      )}

      {/* Tỉnh/Thành phố */}
      <div style={{ marginBottom: 8 }}>
        <select
          value={provinceCode}
          onChange={handleProvinceChange}
          style={{ width: '100%', padding: 8 }}
        >
          <option value="">Tỉnh/Thành phố</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quận/Huyện */}
      <div style={{ marginBottom: 8 }}>
        <select
          value={districtCode}
          onChange={handleDistrictChange}
          style={{ width: '100%', padding: 8 }}
          disabled={!provinceCode}
        >
          <option value="">Quận/Huyện</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phường/Xã */}
      <div style={{ marginBottom: 8 }}>
        <select
          value={wardCode}
          onChange={handleWardChange}
          style={{ width: '100%', padding: 8 }}
          disabled={!districtCode}
        >
          <option value="">Phường/Xã</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Địa chỉ cụ thể + gợi ý */}
      <div style={{ marginBottom: 4, position: 'relative' }}>
        <input
          type="text"
          placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
          value={detail}
          onChange={handleDetailChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggest(true);
          }}
          onBlur={() => {
            // nhỏ delay xíu để click vào suggestion không bị đóng ngay
            setTimeout(() => setShowSuggest(false), 150);
          }}
          style={{
            width: '100%',
            padding: 8,
            boxSizing: 'border-box',
          }}
        />

        {showSuggest && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              maxHeight: 200,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #ddd',
              borderTop: 'none',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              zIndex: 20,
              fontSize: 13,
            }}
          >
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(s);
                }}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {suggestLoading && (
        <div style={{ fontSize: 12, color: '#555' }}>
          Đang gợi ý địa chỉ...
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 12 }}>Đang tải danh sách địa phương...</div>
      )}

      {/* Có thể ẩn phần này nếu không cần xem fullAddress */}
      {fullAddress && (
        <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
          Địa chỉ đầy đủ: {fullAddress}
        </div>
      )}
    </div>
  );
};

export default VietnamAddressSelector;
