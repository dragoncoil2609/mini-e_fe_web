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
  /** Chuỗi địa chỉ full hiện tại (để hiển thị read-only / debug nếu muốn) */
  fullAddress: string;
  /** Gọi khi user chọn xong / thay đổi → trả về chuỗi địa chỉ đầy đủ */
  onFullAddressChange: (fullAddress: string) => void;
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

  // Lấy danh sách tỉnh/thành + quận/huyện + phường/xã
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

  // Mỗi lần detail/province/district/ward đổi → build full address và báo ra ngoài
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

  const handleProvinceChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setProvinceCode(value);
    setDistrictCode('');
    setWardCode('');
  };

  const handleDistrictChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setDistrictCode(value);
    setWardCode('');
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWardCode(e.target.value);
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
          <option value="">
            Tỉnh/Thành phố
          </option>
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
          <option value="">
            Quận/Huyện
          </option>
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
          <option value="">
            Phường/Xã
          </option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Địa chỉ cụ thể */}
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {loading && (
        <div style={{ fontSize: 12 }}>Đang tải danh sách địa phương...</div>
      )}

      {/* Nếu muốn debug có thể hiện fullAddress */}
      {fullAddress && (
        <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
          Địa chỉ đầy đủ: {fullAddress}
        </div>
      )}
    </div>
  );
};

export default VietnamAddressSelector;
