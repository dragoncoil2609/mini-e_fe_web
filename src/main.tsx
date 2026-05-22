import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

/**
 * Style nền tảng của toàn bộ website.
 * Thứ tự import nên để:
 * theme -> global -> page/form/table -> responsive
 */
import './styles/theme.css';
import './styles/global.css';
import './styles/page.css';
import './styles/form.css';
import './styles/table.css';
import './styles/responsive.css';

/**
 * CSS cho bản đồ Leaflet.
 * Giữ lại vì dự án của bạn có LocationPicker / VietnamAddressSelector.
 */
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);