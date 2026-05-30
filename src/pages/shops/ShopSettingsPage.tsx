import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import {
  getMyShop,
  updateShop,
  uploadShopCover,
  uploadShopLogo,
} from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ShopSettingsPage.css';

type ShopView = {
  id: number;
  name: string;
  description?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  shopPhone?: string | null;
  shopAddress?: string | null;
};

type SettingsForm = {
  name: string;
  description: string;
  email: string;
  shopPhone: string;
  shopAddress: string;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể cập nhật shop.'
  );
}

function revokePreviewUrl(url: string | null) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function ShopSettingsPage() {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [shop, setShop] = useState<ShopView | null>(null);

  const [form, setForm] = useState<SettingsForm>({
    name: '',
    description: '',
    email: '',
    shopPhone: '',
    shopAddress: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const logoSrc = logoPreviewUrl || shop?.logoUrl || bunnyImg;
  const coverSrc = coverPreviewUrl || shop?.coverUrl || '';

  async function loadShop() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await getMyShop();
      const data = unwrapApiData<ShopView>(response);

      setShop(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        email: data.email || '',
        shopPhone: data.shopPhone || '',
        shopAddress: data.shopAddress || '',
      });
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadShop();

    return () => {
      revokePreviewUrl(logoPreviewUrl);
      revokePreviewUrl(coverPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange =
    (field: keyof SettingsForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    revokePreviewUrl(logoPreviewUrl);

    setLogoFile(file);
    setLogoPreviewUrl(file ? URL.createObjectURL(file) : null);
    setError('');
    setMessage('');
  }

  function handleCoverFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    revokePreviewUrl(coverPreviewUrl);

    setCoverFile(file);
    setCoverPreviewUrl(file ? URL.createObjectURL(file) : null);
    setError('');
    setMessage('');
  }

  function clearLogoSelection() {
    revokePreviewUrl(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }

  function clearCoverSelection() {
    revokePreviewUrl(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);

    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    if (!form.name.trim()) {
      setError('Tên shop không được để trống.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await updateShop(shop.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        email: form.email.trim() || undefined,
        shopPhone: form.shopPhone.trim() || undefined,
        shopAddress: form.shopAddress.trim() || undefined,
      });

      const data = unwrapApiData<ShopView>(response);

      setShop((prev) => ({
        ...(prev || data),
        ...data,
      }));

      setMessage('Đã lưu thông tin shop.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    setError('');
    setMessage('');

    try {
      const response = await uploadShopLogo(logoFile);
      const data = unwrapApiData<ShopView>(response);

      setShop((prev) => ({
        ...(prev || data),
        ...data,
        logoUrl: data.logoUrl || prev?.logoUrl || null,
      }));

      clearLogoSelection();
      setMessage('Đã cập nhật ảnh đại diện shop.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;

    setUploadingCover(true);
    setError('');
    setMessage('');

    try {
      const response = await uploadShopCover(coverFile);
      const data = unwrapApiData<ShopView>(response);

      setShop((prev) => ({
        ...(prev || data),
        ...data,
        coverUrl: data.coverUrl || prev?.coverUrl || null,
      }));

      clearCoverSelection();
      setMessage('Đã cập nhật ảnh bìa shop.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="mochi-page shop-settings-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding shop-settings-state">
            Đang tải cài đặt shop...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page shop-settings-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Cài đặt</b>
        </div>

        <div className="shop-settings-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-settings-main">
            <section className="shop-settings-head mochi-card">
              <div>
                <h1>Cài đặt shop</h1>
                <p>Chỉnh sửa thông tin cơ bản, logo và ảnh bìa của shop.</p>
              </div>

              <Link
                to={shop?.id ? `/shops/${shop.id}` : '/shops/me'}
                className="mochi-btn mochi-btn-outline"
              >
                Xem trước
              </Link>
            </section>

            {error ? <div className="shop-settings-error">{error}</div> : null}
            {message ? <div className="shop-settings-message">{message}</div> : null}

            <section className="shop-settings-media mochi-card">
              <div className="shop-settings-media-card">
                <div className="shop-settings-media-title">
                  <div>
                    <h2>Ảnh đại diện shop</h2>
                    <p>Nên dùng ảnh vuông, rõ logo hoặc biểu tượng shop.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="shop-settings-logo-preview"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  aria-label="Chọn logo shop"
                >
                  <img src={logoSrc} alt="Logo shop" />
                  <span className="shop-settings-upload-overlay">
                    Bấm để đổi logo
                  </span>
                </button>

                <input
                  ref={logoInputRef}
                  className="shop-settings-hidden-file"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                />

                {logoFile ? (
                  <div className="shop-settings-file-note">
                    <span>{logoFile.name}</span>
                    <button type="button" onClick={clearLogoSelection}>
                      Bỏ chọn
                    </button>
                  </div>
                ) : null}

                <div className="shop-settings-upload-actions">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Đổi logo
                  </button>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-primary"
                    disabled={!logoFile || uploadingLogo}
                    onClick={handleUploadLogo}
                  >
                    {uploadingLogo ? 'Đang tải...' : 'Lưu logo'}
                  </button>
                </div>
              </div>

              <div className="shop-settings-media-card shop-settings-cover-card">
                <div className="shop-settings-media-title">
                  <div>
                    <h2>Ảnh bìa shop</h2>
                    <p>Nên dùng ảnh ngang để hiển thị đẹp ở trang shop.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="shop-settings-cover-preview"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  aria-label="Chọn ảnh bìa shop"
                >
                  {coverSrc ? (
                    <img src={coverSrc} alt="Ảnh bìa shop" />
                  ) : (
                    <span>Chưa có ảnh bìa</span>
                  )}

                  <span className="shop-settings-upload-overlay">
                    Bấm để đổi ảnh bìa
                  </span>
                </button>

                <input
                  ref={coverInputRef}
                  className="shop-settings-hidden-file"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                />

                {coverFile ? (
                  <div className="shop-settings-file-note">
                    <span>{coverFile.name}</span>
                    <button type="button" onClick={clearCoverSelection}>
                      Bỏ chọn
                    </button>
                  </div>
                ) : null}

                <div className="shop-settings-upload-actions">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Đổi ảnh bìa
                  </button>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-primary"
                    disabled={!coverFile || uploadingCover}
                    onClick={handleUploadCover}
                  >
                    {uploadingCover ? 'Đang tải...' : 'Lưu ảnh bìa'}
                  </button>
                </div>
              </div>
            </section>

            <section className="shop-settings-form-card mochi-card">
              <h2>Thông tin shop</h2>

              <form className="mochi-form" onSubmit={handleSubmit}>
                <div className="mochi-form-group">
                  <label className="mochi-label">Tên shop *</label>

                  <input
                    className="mochi-input"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Tên shop"
                  />
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Mô tả shop</label>

                  <textarea
                    className="mochi-textarea"
                    value={form.description}
                    onChange={handleChange('description')}
                    placeholder="Mô tả ngắn về shop"
                  />
                </div>

                <div className="mochi-form-row">
                  <div className="mochi-form-group">
                    <label className="mochi-label">Email liên hệ</label>

                    <input
                      className="mochi-input"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder="shop@example.com"
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Số điện thoại</label>

                    <input
                      className="mochi-input"
                      value={form.shopPhone}
                      onChange={handleChange('shopPhone')}
                      placeholder="0123 456 789"
                    />
                  </div>
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Địa chỉ shop</label>

                  <input
                    className="mochi-input"
                    value={form.shopAddress}
                    onChange={handleChange('shopAddress')}
                    placeholder="Địa chỉ shop"
                  />
                </div>

                <div className="shop-settings-actions">
                  <button
                    type="submit"
                    className="mochi-btn mochi-btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}