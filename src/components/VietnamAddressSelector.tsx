import React, { useEffect, useMemo, useRef, useState } from 'react';

interface LocationItem {
  id: string;
  name: string;
  full_name?: string;
  latitude?: number | string;
  longitude?: number | string;
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

interface ParsedAddress {
  detail: string;
  wardName: string;
  districtName: string;
  provinceName: string;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseAddress(fullAddress: string): ParsedAddress {
  const parts = fullAddress
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      detail: '',
      wardName: '',
      districtName: '',
      provinceName: '',
    };
  }

  if (parts.length === 1) {
    return {
      detail: '',
      wardName: '',
      districtName: '',
      provinceName: parts[0],
    };
  }

  if (parts.length === 2) {
    return {
      detail: parts[0],
      wardName: '',
      districtName: '',
      provinceName: parts[1],
    };
  }

  if (parts.length === 3) {
    return {
      detail: parts[0],
      wardName: '',
      districtName: parts[1],
      provinceName: parts[2],
    };
  }

  return {
    detail: parts.slice(0, -3).join(', '),
    wardName: parts[parts.length - 3] ?? '',
    districtName: parts[parts.length - 2] ?? '',
    provinceName: parts[parts.length - 1] ?? '',
  };
}

function findLocationByName(items: LocationItem[], name: string) {
  if (!name) return undefined;
  const normalizedNeedle = normalizeText(name);

  return items.find((item) => {
    const candidates = [item.name, item.full_name ?? ''];
    return candidates.some((candidate) => normalizeText(candidate) === normalizedNeedle);
  });
}

function toCoordinate(value: number | string | undefined) {
  const num = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(num) ? num : null;
}

async function searchCoordinates(parts: string[]) {
  const query = parts.filter(Boolean).join(', ');
  if (!query) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'vn');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'vi',
    },
  });

  if (!res.ok) {
    throw new Error('Không tìm được toạ độ');
  }

  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  if (!data.length) return null;

  const lat = Number.parseFloat(data[0].lat ?? '');
  const lng = Number.parseFloat(data[0].lon ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

const VietnamAddressSelector: React.FC<VietnamAddressSelectorProps> = ({
  fullAddress,
  onFullAddressChange,
  onLatLngChange,
}) => {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const initialParsedRef = useRef<ParsedAddress>(parseAddress(fullAddress));
  const syncTargetRef = useRef<ParsedAddress | null>(initialParsedRef.current);
  const requestSeqRef = useRef(0);

  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [wardId, setWardId] = useState('');
  const [detail, setDetail] = useState(initialParsedRef.current.detail);

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const province = useMemo(
    () => provinces.find((item) => item.id === provinceId) ?? null,
    [provinceId, provinces],
  );
  const district = useMemo(
    () => districts.find((item) => item.id === districtId) ?? null,
    [districtId, districts],
  );
  const ward = useMemo(
    () => wards.find((item) => item.id === wardId) ?? null,
    [wardId, wards],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setShowSuggest(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProvinces = async () => {
      try {
        setLoadingProv(true);
        setError(null);

        const res = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
        const data = await res.json();

        if (!isMounted) return;

        if (data.error === 0 && Array.isArray(data.data)) {
          const nextProvinces = data.data as LocationItem[];
          setProvinces(nextProvinces);

          const initialProvince = findLocationByName(
            nextProvinces,
            initialParsedRef.current.provinceName,
          );

          if (initialProvince) {
            setProvinceId(initialProvince.id);
          } else {
            syncTargetRef.current = null;
          }
        } else {
          setError('Lỗi tải tỉnh thành.');
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Không kết nối được API hành chính.');
        }
      } finally {
        if (isMounted) {
          setLoadingProv(false);
        }
      }
    };

    void fetchProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setDistrictId('');
      setWards([]);
      setWardId('');
      return;
    }

    let isMounted = true;

    const fetchDistricts = async () => {
      try {
        setLoadingDistricts(true);
        const res = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
        const data = await res.json();

        if (!isMounted) return;

        const nextDistricts =
          data.error === 0 && Array.isArray(data.data)
            ? (data.data as LocationItem[])
            : [];

        setDistricts(nextDistricts);

        const syncTarget = syncTargetRef.current;
        if (syncTarget?.districtName) {
          const matchedDistrict = findLocationByName(nextDistricts, syncTarget.districtName);
          if (matchedDistrict) {
            setDistrictId(matchedDistrict.id);
          } else {
            syncTargetRef.current = null;
          }
        } else {
          syncTargetRef.current = null;
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoadingDistricts(false);
        }
      }
    };

    void fetchDistricts();

    return () => {
      isMounted = false;
    };
  }, [provinceId]);

  useEffect(() => {
    if (!districtId) {
      setWards([]);
      setWardId('');
      return;
    }

    let isMounted = true;

    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        const res = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
        const data = await res.json();

        if (!isMounted) return;

        const nextWards =
          data.error === 0 && Array.isArray(data.data)
            ? (data.data as LocationItem[])
            : [];

        setWards(nextWards);

        const syncTarget = syncTargetRef.current;
        if (syncTarget?.wardName) {
          const matchedWard = findLocationByName(nextWards, syncTarget.wardName);
          if (matchedWard) {
            setWardId(matchedWard.id);
          }
        }

        syncTargetRef.current = null;
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoadingWards(false);
        }
      }
    };

    void fetchWards();

    return () => {
      isMounted = false;
    };
  }, [districtId]);

  useEffect(() => {
    if (syncTargetRef.current) {
      return;
    }

    const parts = [
      detail.trim(),
      ward?.name ?? '',
      district?.name ?? '',
      province?.name ?? '',
    ].filter(Boolean);

    const nextAddress = parts.join(', ');

    if (nextAddress !== fullAddress) {
      onFullAddressChange(nextAddress);
    }
  }, [detail, district, fullAddress, onFullAddressChange, province, ward]);

  useEffect(() => {
    const canSuggest = !!provinceId && detail.trim().length >= 3;
    if (!canSuggest) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoadingSuggest(true);

        const queryParts = [
          detail.trim(),
          ward?.name ?? '',
          district?.name ?? '',
          province?.name ?? '',
          'Việt Nam',
        ].filter(Boolean);

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', queryParts.join(', '));
        url.searchParams.set('countrycodes', 'vn');
        url.searchParams.set('limit', '5');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'vi',
          },
        });

        if (!res.ok) {
          throw new Error('Không lấy được gợi ý địa chỉ');
        }

        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;

        const nextSuggestions = data
          .filter((item) => item.display_name && item.lat && item.lon)
          .map((item) => ({
            label: item.display_name as string,
            lat: item.lat as string,
            lon: item.lon as string,
          }));

        setSuggestions(nextSuggestions);
        setShowSuggest(nextSuggestions.length > 0);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setLoadingSuggest(false);
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [detail, district, province, provinceId, ward]);

  const emitCoordinatesFromItem = async (item: LocationItem | null, fallbackParts: string[]) => {
    const seq = ++requestSeqRef.current;

    try {
      const lat = toCoordinate(item?.latitude);
      const lng = toCoordinate(item?.longitude);

      if (lat !== null && lng !== null) {
        if (seq === requestSeqRef.current) {
          onLatLngChange?.(String(lat), String(lng));
        }
        return;
      }

      const result = await searchCoordinates(fallbackParts);
      if (result && seq === requestSeqRef.current) {
        onLatLngChange?.(String(result.lat), String(result.lng));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProvinceChange = async (nextProvinceId: string) => {
    setProvinceId(nextProvinceId);
    setDistrictId('');
    setWardId('');
    setDistricts([]);
    setWards([]);
    setSuggestions([]);
    setShowSuggest(false);
    syncTargetRef.current = null;

    const nextProvince = provinces.find((item) => item.id === nextProvinceId) ?? null;
    if (!nextProvinceId || !nextProvince) {
      return;
    }

    await emitCoordinatesFromItem(nextProvince, [nextProvince.name, 'Việt Nam']);
  };

  const handleDistrictChange = async (nextDistrictId: string) => {
    setDistrictId(nextDistrictId);
    setWardId('');
    setWards([]);
    setSuggestions([]);
    setShowSuggest(false);
    syncTargetRef.current = null;

    const nextDistrict = districts.find((item) => item.id === nextDistrictId) ?? null;
    if (!nextDistrictId || !nextDistrict) {
      return;
    }

    await emitCoordinatesFromItem(nextDistrict, [nextDistrict.name, province?.name ?? '', 'Việt Nam']);
  };

  const handleWardChange = async (nextWardId: string) => {
    setWardId(nextWardId);
    setSuggestions([]);
    setShowSuggest(false);
    syncTargetRef.current = null;

    const nextWard = wards.find((item) => item.id === nextWardId) ?? null;
    if (!nextWardId || !nextWard) {
      return;
    }

    await emitCoordinatesFromItem(nextWard, [
      nextWard.name,
      district?.name ?? '',
      province?.name ?? '',
      'Việt Nam',
    ]);
  };

  const handleSelectSuggestion = (item: SuggestItem) => {
    setDetail(item.label.split(',')[0]?.trim() ?? detail);
    setShowSuggest(false);
    onLatLngChange?.(item.lat, item.lon);
  };

  return (
    <div ref={wrapperRef} className="vn-address-selector">
      {error && <p className="vn-address-selector__error">{error}</p>}

      <div className="vn-address-selector__grid">
        <select
          className="addresses-form-input"
          value={provinceId}
          onChange={(e) => {
            void handleProvinceChange(e.target.value);
          }}
          disabled={loadingProv}
        >
          <option value="">-- Tỉnh/Thành --</option>
          {provinces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          className="addresses-form-input"
          value={districtId}
          onChange={(e) => {
            void handleDistrictChange(e.target.value);
          }}
          disabled={!provinceId || loadingDistricts}
        >
          <option value="">-- Quận/Huyện --</option>
          {districts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          className="addresses-form-input"
          value={wardId}
          onChange={(e) => {
            void handleWardChange(e.target.value);
          }}
          disabled={!districtId || loadingWards}
        >
          <option value="">-- Phường/Xã --</option>
          {wards.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="vn-address-selector__suggest-wrapper">
        <input
          type="text"
          className="addresses-form-input"
          placeholder="Số nhà, tên đường..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggest(true);
            }
          }}
        />

        {showSuggest && suggestions.length > 0 && (
          <ul className="vn-address-selector__suggestions">
            {suggestions.map((item, index) => (
              <li
                key={`${item.lat}-${item.lon}-${index}`}
                className="vn-address-selector__suggestion-item"
                onMouseDown={() => handleSelectSuggestion(item)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="vn-address-selector__hint">
        {loadingProv || loadingDistricts || loadingWards
          ? 'Đang tải dữ liệu hành chính...'
          : provinceId
          ? 'Chọn tỉnh/thành → quận/huyện → phường/xã. Sau đó nhập số nhà, tên đường để hiện gợi ý đúng khu vực đã chọn.'
          : 'Hãy chọn tỉnh/thành trước để bản đồ tự nhảy đến đúng khu vực.'}
      </div>

      {loadingSuggest && (
        <div className="vn-address-selector__hint">Đang tìm gợi ý địa chỉ...</div>
      )}
    </div>
  );
};

export default VietnamAddressSelector;