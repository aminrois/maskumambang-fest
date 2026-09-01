/**
 * ============================================================================
 * MASKUMAMBANG FEST #4 - UNIFIED FRONTEND ENGINE & UI/UX PARITY SUITE
 * ============================================================================
 */

/**
 * Safe localStorage wrapper - handles Safari Private Mode SecurityError
 */
const safeStorage = {
  getItem(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  },
};

// Global Application State
const state = {
  token: null, // Token dikelola via HttpOnly Cookie oleh server, tidak disimpan di JS
  user: (() => { try { return JSON.parse(safeStorage.getItem('lomba_user_data') || 'null'); } catch(e){ return null; } })(),
  settings: {},
  competitionTree: [],
  paymentAccounts: [],
  theme: safeStorage.getItem('lomba_theme') || 'light',
  scanner: null,
  activeRoute: 'overview',
  routeParams: null,
};


// ============================================================================
// THEME MANAGER (LIGHT MODE DEFAULT + DARK MODE SWITCHER)
// ============================================================================
function initTheme() {
  const savedTheme = safeStorage.getItem('lomba_theme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  state.theme = theme;
  safeStorage.setItem('lomba_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    if (theme === 'dark') {
      themeBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i> <span>Light</span>';
    } else {
      themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Dark</span>';
    }
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// ============================================================================
// AUTH & API UTILITIES
// ============================================================================
function setSession(token, user) {
  // Token disimpan di HttpOnly Cookie oleh server — tidak disimpan di localStorage
  state.token = token; // Simpan sementara di memory untuk backward compatibility
  state.user = user;
  // Hanya data user (bukan token) yang disimpan di localStorage
  safeStorage.setItem('lomba_user_data', JSON.stringify(user));
  // Hapus token lama dari localStorage jika ada (migrasi keamanan)
  safeStorage.removeItem('lomba_jwt_token');
}

function clearSession() {
  state.token = null;
  state.user = null;
  safeStorage.removeItem('lomba_jwt_token');
  safeStorage.removeItem('lomba_user_data');
}

async function handleLogout() {
  try {
    // Hapus cookie sesi di server
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  clearSession();
  window.location.href = '/login.html';
}

async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};

  // Kirim Authorization header jika token tersedia di memory (backward compat)
  // Token utama dikirim otomatis via HttpOnly Cookie
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  options.headers = headers;
  // Penting: kirim cookie sesi HttpOnly secara otomatis di setiap request
  options.credentials = 'include';

  try {
    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      if (window.location.pathname.includes('dashboard')) {
        clearSession();
        window.location.href = '/login.html';
      }
    }

    if (!response.ok) {
      const errorMsg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || `Error ${response.status}: Permintaan gagal.`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
  switch (status) {
    case 'APPROVED':
      return '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Disetujui</span>';
    case 'PAYMENT_REJECTED':
      return '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Pembayaran Ditolak</span>';
    case 'WAITING_VERIFICATION':
    default:
      return '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Menunggu Verifikasi</span>';
  }
}

function getCheckInBadge(checkInRecord) {
  if (checkInRecord) {
    return `<span class="badge badge-success"><i class="fa-solid fa-user-check"></i> SUDAH CHECK-IN (${formatDate(checkInRecord.checkInTime)})</span>`;
  }
  return '<span class="badge badge-secondary" style="background: rgba(100, 116, 139, 0.2); color: var(--text-muted);"><i class="fa-solid fa-hourglass-start"></i> BELUM CHECK-IN</span>';
}

function showBannerAlert(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = 'block';
  el.className = type === 'success' ? 'alert alert-success' : 'alert alert-danger';
  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div><i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${message}</div>
      <button type="button" onclick="this.closest('.alert').style.display='none'" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit;">&times;</button>
    </div>
  `;
}

// Modal Helpers
function openAppModal(contentHtml) {
  const modal = document.getElementById('app-modal');
  const body = document.getElementById('app-modal-body');
  if (modal && body) {
    body.innerHTML = contentHtml;
    modal.classList.add('active', 'open', 'show');
    modal.style.display = 'flex';
  }
}

function closeAppModal() {
  const modal = document.getElementById('app-modal');
  if (modal) {
    modal.classList.remove('active', 'open', 'show');
    modal.style.display = 'none';
  }
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('app-modal');
  if (modal && e.target === modal) {
    closeAppModal();
  }
});

// Load App Branding onto Header, Sidebar, Footer & Favicon
async function loadBrandingInfo() {
  try {
    const res = await apiRequest('/api/settings');
    if (res.success && res.data) {
      state.settings = res.data;
      const appName = res.data.application_name || 'MASKUMAMBANG FEST #4';
      const shortName = res.data.application_short_name || 'MASKUMAMBANG FEST #4';
      
      document.querySelectorAll('#nav-title, #footer-title, #auth-app-title, #sidebar-title, #topbar-event-name').forEach(el => {
        el.innerText = shortName;
      });
      document.querySelectorAll('#hero-title').forEach(el => el.innerText = appName);
      if (res.data.application_description) {
        document.querySelectorAll('#hero-desc, #footer-desc').forEach(el => el.innerText = res.data.application_description);
      }

      if (res.data.application_logo) {
        document.querySelectorAll('#nav-logo, #sidebar-logo, #auth-logo, .brand-logo-img').forEach(el => {
          el.src = `/static/img/${res.data.application_logo}`;
        });
      }

      if (res.data.application_favicon) {
        let favEl = document.querySelector("link[rel*='icon']");
        if (!favEl) {
          favEl = document.createElement('link');
          favEl.rel = 'shortcut icon';
          document.head.appendChild(favEl);
        }
        favEl.href = `/static/img/${res.data.application_favicon}`;
      }
    }
  } catch (e) {
    console.error('Branding load error:', e);
  }
}

// ============================================================================
// ============================================================================
// UNIVERSAL TABLE ENGINE & EXCEL/CSV EXPORT UTILITY
// ============================================================================
function exportTableDataToExcel(filename, columns, data) {
  if (!data || !data.length) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  // Filter out action columns
  const exportCols = columns.filter(c => !c.sticky && c.header !== 'Aksi');
  
  // Header row
  const headers = exportCols.map(c => `"${(c.header || '').replace(/"/g, '""')}"`);
  
  // Data rows
  const rows = data.map((item, idx) => {
    return exportCols.map(col => {
      let val = '';
      if (typeof col.exportValue === 'function') {
        val = col.exportValue(item, idx);
      } else if (col.key && item[col.key] !== undefined) {
        val = item[col.key];
      } else if (typeof col.render === 'function') {
        const rendered = col.render(item);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rendered;
        val = tempDiv.textContent || tempDiv.innerText || '';
      }
      val = (val === null || val === undefined) ? '' : String(val).trim();
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderUniversalTable({
  tableId,
  columns,
  data,
  searchQuery = '',
  searchFields = [],
  sortKey = '',
  sortDir = 'asc',
  filterKey = '',
  filterValue = '',
  filterOptions = [],
  currentPage = 1,
  pageSize = 10,
  onPageChangeName = 'onTablePageChange',
  onSearchChangeName = 'onTableSearchChange',
  onPageSizeChangeName = 'onTablePageSizeChange',
  onSortChangeName = '',
  onFilterChangeName = '',
  exportFilename = '',
  onExportName = '',
  emptyMessage = 'Belum ada data.',
}) {
  // 1. Filter data by column filter if provided
  let filtered = data;
  if (filterKey && filterValue) {
    filtered = filtered.filter(item => {
      const val = typeof filterKey === 'function' ? filterKey(item) : item[filterKey];
      return String(val) === String(filterValue);
    });
  }

  // 2. Filter data by search query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      return searchFields.some(field => {
        const val = typeof field === 'function' ? field(item) : item[field];
        return val && String(val).toLowerCase().includes(q);
      });
    });
  }

  // 3. Sort data if sortKey is provided
  if (sortKey) {
    const colDef = columns.find(c => (c.sortKey || c.key || c.header) === sortKey);
    filtered = [...filtered].sort((a, b) => {
      let valA = colDef && colDef.sortValue ? colDef.sortValue(a) : (colDef?.key ? a[colDef.key] : a[sortKey]);
      let valB = colDef && colDef.sortValue ? colDef.sortValue(b) : (colDef?.key ? b[colDef.key] : b[sortKey]);
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // 4. Pagination calculation
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  const startDisplay = total === 0 ? 0 : startIdx + 1;
  const endDisplay = Math.min(startIdx + pageSize, total);

  // If container already in DOM, perform live in-place update of tbody and pagination
  const tbodyEl = document.getElementById(`${tableId}-tbody`);
  const pagEl = document.getElementById(`${tableId}-pagination`);

  const tbodyHtml = pageItems.length === 0 ? `
    <tr>
      <td colspan="${columns.length}" style="text-align: center; padding: 30px; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 1.8rem; margin-bottom: 8px; display: block; color: var(--text-dim);"></i>
        ${emptyMessage}
      </td>
    </tr>
  ` : pageItems.map(item => `
    <tr style="border-bottom: 1px solid var(--border-subtle); transition: var(--transition-fast);">
      ${columns.map(col => `
        <td class="${col.sticky ? 'sticky-action' : ''}" style="padding: 12px 14px; vertical-align: middle;${col.sticky ? ' border-left: 1px solid var(--border-subtle);' : ''}">
          ${col.render ? col.render(item) : (item[col.key] || '-')}
        </td>
      `).join('')}
    </tr>
  `).join('');

  const pagHtml = `
    <div style="font-size: 0.85rem; color: var(--text-muted);">
      Menampilkan <strong>${startDisplay}</strong> - <strong>${endDisplay}</strong> dari <strong>${total}</strong> data
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button type="button" class="btn btn-sm btn-secondary" style="padding: 4px 10px;" ${safePage <= 1 ? 'disabled' : ''} onclick="${onPageChangeName}(${safePage - 1})">
        <i class="fa-solid fa-chevron-left"></i> Prev
      </button>
      <span style="font-size: 0.85rem; font-weight: 700; padding: 0 8px; color: var(--text-heading);">
        Halaman ${safePage} dari ${totalPages}
      </span>
      <button type="button" class="btn btn-sm btn-secondary" style="padding: 4px 10px;" ${safePage >= totalPages ? 'disabled' : ''} onclick="${onPageChangeName}(${safePage + 1})">
        Next <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;

  if (tbodyEl && pagEl) {
    tbodyEl.innerHTML = tbodyHtml;
    pagEl.innerHTML = pagHtml;
    return '';
  }

  // Full initial HTML markup
  return `
    <div id="${tableId}-container" class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
      <div class="table-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">Tampilkan</span>
            <select style="width: auto !important; min-width: 75px; display: inline-block; padding: 7px 10px; font-size: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); cursor: pointer;" onchange="${onPageSizeChangeName}(parseInt(this.value, 10))">
              <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
            <span style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">baris</span>
          </div>

          ${filterOptions && filterOptions.length > 0 && onFilterChangeName ? `
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;"><i class="fa-solid fa-filter"></i> Filter:</span>
              <select style="width: auto !important; min-width: 170px; max-width: 250px; display: inline-block; padding: 7px 12px; font-size: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); cursor: pointer;" onchange="${onFilterChangeName}(this.value)">
                ${filterOptions.map(opt => `<option value="${opt.value}" ${filterValue === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          ${(exportFilename || onExportName) ? `
            <button type="button" onclick="${onExportName ? `${onExportName}()` : `exportTableDataToExcel('${exportFilename || tableId}', [], [])`}" style="padding: 7px 10px; font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--success-500); color: var(--success-600); background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;" title="Ekspor ke Excel / CSV" onmouseover="this.style.background='var(--success-50)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-file-excel"></i>
            </button>
          ` : ''}

          <div style="position: relative; width: 100%; min-width: 240px; max-width: 280px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-dim); font-size: 0.85rem;"></i>
            <input type="text" id="${tableId}-search-input" placeholder="Cari data di tabel..." value="${searchQuery}" oninput="${onSearchChangeName}(this.value)" style="width: 100%; padding: 8px 12px 8px 34px; font-size: 0.875rem; border-radius: var(--radius-md); border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main);">
          </div>
        </div>
      </div>

      <div class="table-responsive" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow-x: auto; background: var(--bg-card); position: relative;">
        <table class="table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; min-width: 600px;">
          <thead>
            <tr style="background: var(--table-header-bg); border-bottom: 1px solid var(--border-subtle);">
              ${columns.map(col => {
                const targetKey = col.sortKey || col.key || col.header;
                const isSortable = col.sortable !== false && onSortChangeName;
                const isCurrentSort = sortKey === targetKey;
                return `
                  <th class="${col.sticky ? 'sticky-action' : ''}" style="padding: 12px 14px; font-weight: 700; color: var(--text-muted); white-space: nowrap; ${col.width ? `width:${col.width};` : ''} ${col.sticky ? 'border-left: 1px solid var(--border-subtle);' : ''} ${isSortable ? 'cursor: pointer; user-select: none;' : ''}" ${isSortable ? `onclick="${onSortChangeName}('${targetKey}')" title="Klik untuk mengurutkan kolom"` : ''}>
                    <div style="display: inline-flex; align-items: center; gap: 6px;">
                      <span>${col.header}</span>
                      ${isSortable ? `
                        <span style="font-size: 0.75rem; color: ${isCurrentSort ? 'var(--primary-600)' : 'var(--text-dim)'}; font-weight: 800;">
                          ${isCurrentSort ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      ` : ''}
                    </div>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody id="${tableId}-tbody">
            ${tbodyHtml}
          </tbody>
        </table>
      </div>

      <div id="${tableId}-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 12px;">
        ${pagHtml}
      </div>
    </div>
  `;
}

// ============================================================================
// DASHBOARD INITIALIZATION & HASH ROUTING
// ============================================================================
async function initDashboardApp() {
  // Coba verifikasi sesi via cookie — tidak perlu cek token di localStorage
  try {
    const profile = await apiRequest('/api/users/profile');
    if (!profile || !profile.id) {
      clearSession();
      window.location.href = '/login.html';
      return;
    }
    state.user = profile;
    safeStorage.setItem('lomba_user_data', JSON.stringify(profile));
  } catch (e) {
    clearSession();
    window.location.href = '/login.html';
    return;
  }

  // 2. Load Master Tree, Settings, and Payment Accounts
  try {
    const [settingsRes, accountsRes, treeRes] = await Promise.all([
      apiRequest('/api/settings'),
      apiRequest('/api/payments/accounts'),
      apiRequest('/api/competitions/tree'),
    ]);
    if (settingsRes.success) state.settings = settingsRes.data;
    if (accountsRes.success) state.paymentAccounts = accountsRes.data;
    if (treeRes.success) state.competitionTree = treeRes.data;
  } catch (e) {
    console.error('Initial data load error:', e);
  }

  // 3. Update User Header & Sidebar Labels
  const user = state.user;
  document.querySelectorAll('#sidebar-username, #topbar-username').forEach(el => el.innerText = user.name);
  document.querySelectorAll('#sidebar-avatar').forEach(el => el.innerText = user.name.charAt(0).toUpperCase());
  document.querySelectorAll('#sidebar-role-badge, #topbar-role-badge').forEach(el => {
    el.innerText = user.role;
    el.className = `role-badge-pill role-${user.role}`;
  });

  // 4. Build Sidebar Menu
  buildRoleSidebar(user.role);

  // 5. Setup CTA button on Topbar
  const topbarCta = document.getElementById('topbar-cta-container');
  if (topbarCta) {
    if (user.role === 'PESERTA') {
      topbarCta.innerHTML = '<a href="#daftar" class="btn btn-sm btn-primary"><i class="fa-solid fa-plus"></i> Daftar Lomba</a>';
    } else if (user.role === 'BENDAHARA' || user.role === 'SUPER_ADMIN') {
      topbarCta.innerHTML = '<a href="#checkin-scanner" class="btn btn-sm btn-secondary"><i class="fa-solid fa-qrcode"></i> Scanner QR</a>';
    } else if (user.role === 'ADMIN_BARCODE') {
      topbarCta.innerHTML = '<a href="#checkin-scanner" class="btn btn-sm btn-primary"><i class="fa-solid fa-qrcode"></i> Scanner QR</a>';
    }
  }

  // 6. Setup Router Listener
  window.addEventListener('hashchange', handleDashboardRoute);
  handleDashboardRoute();
}

function buildRoleSidebar(role) {
  const menu = document.getElementById('sidebar-nav-menu');
  if (!menu) return;

  if (role === 'PESERTA') {
    menu.innerHTML = `
      <div class="nav-section-title">MENU PESERTA</div>
      <a href="#overview" id="nav-overview" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-house"></i></span><span class="nav-label">Dashboard Saya</span></a>
      <a href="#daftar" id="nav-daftar" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-rocket"></i></span><span class="nav-label">Daftar Lomba Baru</span></a>
      <a href="/guide.html" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-book-open"></i></span><span class="nav-label">Panduan & Rekening</span></a>
      <div class="nav-section-title">AKUN SAYA</div>
      <a href="#change-password" id="nav-change-password" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-key"></i></span><span class="nav-label">Ubah Password</span></a>
      <a href="javascript:void(0)" onclick="handleLogout()" class="sidebar-nav-item logout-item"><span class="nav-icon"><i class="fa-solid fa-door-open"></i></span><span class="nav-label">Keluar</span></a>
    `;
  } else if (role === 'BENDAHARA') {
    menu.innerHTML = `
      <div class="nav-section-title">MENU BENDAHARA</div>
      <a href="#overview" id="nav-overview" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span><span class="nav-label">Dashboard</span></a>
      <a href="#verifikasi-pembayaran" id="nav-verifikasi-pembayaran" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-credit-card"></i></span><span class="nav-label">Verifikasi Pembayaran</span></a>
      <a href="#checkin-scanner" id="nav-checkin-scanner" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-qrcode"></i></span><span class="nav-label">Check-In Scanner</span></a>
      <div class="nav-section-title">AKUN SAYA</div>
      <a href="#change-password" id="nav-change-password" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-key"></i></span><span class="nav-label">Ubah Password</span></a>
      <a href="javascript:void(0)" onclick="handleLogout()" class="sidebar-nav-item logout-item"><span class="nav-icon"><i class="fa-solid fa-door-open"></i></span><span class="nav-label">Keluar</span></a>
    `;
  } else if (role === 'SUPER_ADMIN') {
    menu.innerHTML = `
      <div class="nav-section-title">MENU UTAMA</div>
      <a href="#overview" id="nav-overview" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span><span class="nav-label">Dashboard</span></a>
      <a href="#daftar-peserta" id="nav-daftar-peserta" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-clipboard-list"></i></span><span class="nav-label">Daftar Peserta</span></a>
      <a href="#verifikasi-pembayaran" id="nav-verifikasi-pembayaran" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-credit-card"></i></span><span class="nav-label">Pembayaran</span></a>
      <a href="#checkin-scanner" id="nav-checkin-scanner" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-qrcode"></i></span><span class="nav-label">Check-In QR</span></a>
      <a href="#cetak-kartu" id="nav-cetak-kartu" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-print"></i></span><span class="nav-label">Cetak Kartu Peserta</span></a>

      <div class="nav-section-title">MASTER LOMBA</div>
      <a href="#master-kategori" id="nav-master-kategori" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-folder-tree"></i></span><span class="nav-label">Kategori & Jenjang</span></a>
      <a href="#master-cabang" id="nav-master-cabang" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-bullseye"></i></span><span class="nav-label">Cabang Lomba & Biaya</span></a>

      <div class="nav-section-title">MASTER SISTEM</div>
      <a href="#users" id="nav-users" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-users-gear"></i></span><span class="nav-label">Pengguna</span></a>
      <a href="#payment-accounts" id="nav-payment-accounts" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-building-columns"></i></span><span class="nav-label">Rekening Pembayaran</span></a>
      <a href="#branding-settings" id="nav-branding-settings" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-sliders"></i></span><span class="nav-label">Identitas Aplikasi</span></a>
      <a href="#countdown-settings" id="nav-countdown-settings" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-stopwatch"></i></span><span class="nav-label">Pengaturan Countdown</span></a>

      <div class="nav-section-title">LOG & AKUN</div>
      <a href="#audit-logs" id="nav-audit-logs" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-scroll"></i></span><span class="nav-label">Audit Log</span></a>
      <a href="#change-password" id="nav-change-password" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-key"></i></span><span class="nav-label">Ubah Password</span></a>

      <div class="nav-section-title">PEMELIHARAAN SISTEM</div>
      <a href="#reset-operasional" id="nav-reset-operasional" class="sidebar-nav-item danger-item" style="color: var(--danger-500);"><span class="nav-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><span class="nav-label">Reset Data</span></a>
    `;
  } else if (role === 'ADMIN_BARCODE') {
    menu.innerHTML = `
      <div class="nav-section-title">MENU SCANNER</div>
      <a href="#checkin-scanner" id="nav-checkin-scanner" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-qrcode"></i></span><span class="nav-label">Check-In Scanner</span></a>
      <div class="nav-section-title">AKUN SAYA</div>
      <a href="#change-password" id="nav-change-password" class="sidebar-nav-item"><span class="nav-icon"><i class="fa-solid fa-key"></i></span><span class="nav-label">Ubah Password</span></a>
      <a href="javascript:void(0)" onclick="handleLogout()" class="sidebar-nav-item logout-item"><span class="nav-icon"><i class="fa-solid fa-door-open"></i></span><span class="nav-label">Keluar</span></a>
    `;
  }
}

function toggleSidebarDrawer(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const sidebar = document.getElementById('app_sidebar') || document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebar_backdrop') || document.querySelector('.sidebar-backdrop');
  if (sidebar) {
    sidebar.classList.toggle('drawer-open');
    sidebar.classList.toggle('show');
  }
  if (backdrop) {
    backdrop.classList.toggle('active');
    backdrop.classList.toggle('show');
  }
}

function closeSidebarDrawer() {
  const sidebar = document.getElementById('app_sidebar') || document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebar_backdrop') || document.querySelector('.sidebar-backdrop');
  if (sidebar) {
    sidebar.classList.remove('drawer-open', 'show');
  }
  if (backdrop) {
    backdrop.classList.remove('active', 'show');
  }
}

function togglePublicMenu(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById('public-nav-menu') || document.querySelector('.public-navbar .nav-menu');
  if (menu) {
    menu.classList.toggle('open');
    menu.classList.toggle('show');
  }
}

function closePublicMenu() {
  const menu = document.getElementById('public-nav-menu') || document.querySelector('.public-navbar .nav-menu');
  if (menu) {
    menu.classList.remove('open', 'show');
  }
}

function handleDashboardRoute() {
  closeSidebarDrawer();
  const hash = window.location.hash.replace('#', '') || 'overview';
  const parts = hash.split('/');
  const mainRoute = parts[0];
  const param = parts[1] || null;

  state.activeRoute = mainRoute;
  state.routeParams = param;

  // Highlight active sidebar item
  document.querySelectorAll('.sidebar-nav-item').forEach(a => a.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${mainRoute}`);
  if (activeLink) activeLink.classList.add('active');

  const role = state.user.role;

  if (role === 'PESERTA') {
    if (mainRoute === 'daftar') renderPesertaRegistrationWizard();
    else if (mainRoute === 'detail') renderPesertaRegistrationDetail(param);
    else if (mainRoute === 'card') renderParticipantCardView(param);
    else if (mainRoute === 'change-password') renderChangePasswordView();
    else renderPesertaDashboard();
  } else if (role === 'BENDAHARA') {
    if (mainRoute === 'verifikasi-pembayaran') renderBendaharaPaymentsView();
    else if (mainRoute === 'checkin-scanner') renderCheckInScannerView();
    else if (mainRoute === 'detail') renderPesertaRegistrationDetail(param);
    else if (mainRoute === 'card') renderParticipantCardView(param);
    else if (mainRoute === 'change-password') renderChangePasswordView();
    else renderBendaharaDashboard();
  } else if (role === 'SUPER_ADMIN') {
    if (mainRoute === 'daftar-peserta') renderAdminRegistrationsView();
    else if (mainRoute === 'verifikasi-pembayaran') renderBendaharaPaymentsView();
    else if (mainRoute === 'checkin-scanner') renderCheckInScannerView();
    else if (mainRoute === 'cetak-kartu') renderCetakKartuView();
    else if (mainRoute === 'master-kategori') renderAdminCategoriesView();
    else if (mainRoute === 'master-cabang') renderAdminBranchesView();
    else if (mainRoute === 'users') renderAdminUsersView();
    else if (mainRoute === 'payment-accounts') renderAdminPaymentAccountsView();
    else if (mainRoute === 'branding-settings') renderAdminBrandingView();
    else if (mainRoute === 'countdown-settings') renderAdminCountdownView();
    else if (mainRoute === 'audit-logs') renderAdminAuditLogsView();
    else if (mainRoute === 'reset-operasional') renderAdminResetOperasionalView();
    else if (mainRoute === 'detail') renderPesertaRegistrationDetail(param);
    else if (mainRoute === 'card') renderParticipantCardView(param);
    else if (mainRoute === 'change-password') renderChangePasswordView();
    else renderAdminDashboard();
  } else if (role === 'ADMIN_BARCODE') {
    if (mainRoute === 'change-password') renderChangePasswordView();
    else renderCheckInScannerView();
  }
}

// ============================================================================
// PESERTA MODULE (DASHBOARD + FULL-PAGE WIZARD + DETAIL + CARD PRINT FIX)
// ============================================================================

// Component Local State for Universal Tables
const tableState = {
  pesertaRegs: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
  bendaharaPayments: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
  adminRegistrations: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
  adminUsers: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
  adminAudit: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
  adminBranches: { page: 1, pageSize: 10, search: '', sortKey: '', sortDir: 'asc', filterKey: '', filterVal: '', data: [] },
};

async function renderPesertaDashboard() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data pendaftaran...</div>';

  try {
    const res = await apiRequest('/api/registrations/my');
    tableState.pesertaRegs.data = res.success ? res.data : [];

    const myRegs = tableState.pesertaRegs.data;
    const approvedCount = myRegs.filter(r => r.status === 'APPROVED').length;
    const waitingCount = myRegs.filter(r => r.status === 'WAITING_VERIFICATION').length;
    const rejectedCount = myRegs.filter(r => r.status === 'PAYMENT_REJECTED').length;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 6px;">Dashboard Peserta</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Selamat datang, <strong>${state.user.name}</strong>. Kelola pendaftaran lomba dan akses kartu peserta resmi.</p>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 28px;">
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Pendaftaran</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-heading); margin-top: 4px;">${myRegs.length}</div>
        </div>
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Disetujui (Siap Cetak)</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--success-600); margin-top: 4px;">${approvedCount}</div>
        </div>
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Menunggu Verifikasi</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--warning-600); margin-top: 4px;">${waitingCount}</div>
        </div>
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Perlu Perbaikan Bukti</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--danger-600); margin-top: 4px;">${rejectedCount}</div>
        </div>
      </div>

      <!-- Quick Action Banner -->
      <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h3 style="font-size: 1.15rem; color: var(--primary-900); margin-bottom: 4px;">Daftar Cabang Lomba Lainnya</h3>
          <p style="color: var(--primary-700); font-size: 0.875rem; margin: 0;">Pilih dari 22 cabang lomba Olimpiade, Robotik, Sport, Master Chef, atau Seni.</p>
        </div>
        <a href="#daftar" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Tambah Pendaftaran Lomba</a>
      </div>

      <!-- My Registrations Universal Table -->
      <div id="peserta-regs-table-slot">
        ${renderPesertaRegistrationsTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderPesertaRegistrationsTable() {
  const ts = tableState.pesertaRegs;
  return renderUniversalTable({
    tableId: 'peserta-regs-table',
    columns: [
      {
        header: 'No. Registrasi',
        key: 'registrationNumber',
        render: r => `<code style="font-weight: 800; color: var(--primary-600);">${r.registrationNumber}</code>`,
      },
      {
        header: 'Cabang & Jenjang',
        sortValue: r => r.branch?.name,
        render: r => `<strong>${r.branch.name}</strong><br><small style="color: var(--text-muted);">${r.branch.level.category.name} - ${r.branch.level.name}</small>`,
      },
      {
        header: 'Tipe',
        sortValue: r => r.branch?.participantType,
        render: r => `<span class="badge ${r.branch.participantType === 'INDIVIDUAL' ? 'badge-info' : 'badge-primary'}">${r.branch.participantType === 'INDIVIDUAL' ? 'INDIVIDU' : 'TIM'}</span>`,
      },
      {
        header: 'Peserta / Tim',
        sortValue: r => (r.branch.participantType === 'INDIVIDUAL' ? r.individualParticipant?.fullName : r.team?.teamName) || '',
        render: r => `<strong>${r.branch.participantType === 'INDIVIDUAL' ? (r.individualParticipant?.fullName || '-') : (r.team?.teamName || '-')}</strong><br><small style="color:var(--text-muted);">${(r.branch.participantType === 'INDIVIDUAL' ? r.individualParticipant?.schoolName : r.team?.schoolName) || '-'}</small>`,
      },
      {
        header: 'Status Pembayaran',
        key: 'status',
        render: r => getStatusBadge(r.status),
      },
      {
        header: 'Status Check-In',
        sortValue: r => r.checkIn ? 1 : 0,
        render: r => getCheckInBadge(r.checkIn),
      },
      {
        header: 'Aksi',
        sticky: true,
        sortable: false,
        render: r => {
          let buttons = `<a href="#detail/${r.id}" class="btn btn-sm btn-secondary" style="padding: 4px 10px;"><i class="fa-solid fa-circle-info"></i> Detail</a> `;
          if (r.status === 'APPROVED') {
            buttons += `<button type="button" class="btn btn-sm btn-success" style="padding: 4px 10px;" onclick="openParticipantCardModal('${r.id}')"><i class="fa-solid fa-id-card"></i> Kartu & QR</button>`;
          }
          return `<div style="display: flex; flex-direction: column; gap: 4px;">${buttons}</div>`;
        },
      },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: [
      'registrationNumber',
      r => r.branch?.name,
      r => r.individualParticipant?.fullName,
      r => r.team?.teamName,
      r => r.individualParticipant?.schoolName,
      r => r.team?.schoolName,
    ],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    filterKey: 'status',
    filterValue: ts.filterVal,
    filterOptions: [
      { label: 'Semua Status', value: '' },
      { label: 'Disetujui (Approved)', value: 'APPROVED' },
      { label: 'Menunggu Verifikasi', value: 'WAITING_VERIFICATION' },
      { label: 'Perlu Perbaikan (Ditolak)', value: 'PAYMENT_REJECTED' },
    ],
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onPesertaPageChange',
    onSearchChangeName: 'onPesertaSearchChange',
    onPageSizeChangeName: 'onPesertaPageSizeChange',
    onSortChangeName: 'onPesertaSortChange',
    onFilterChangeName: 'onPesertaFilterChange',
    emptyMessage: 'Anda belum mendaftarkan diri pada cabang lomba mana pun.',
  });
}

function updateUniversalTable(slotId, renderFn) {
  const result = renderFn();
  if (result) {
    const slot = document.getElementById(slotId);
    if (slot) slot.innerHTML = result;
  }
}

function onPesertaPageChange(page) {
  tableState.pesertaRegs.page = page;
  updateUniversalTable('peserta-regs-table-slot', renderPesertaRegistrationsTable);
}
function onPesertaSearchChange(val) {
  tableState.pesertaRegs.search = val;
  tableState.pesertaRegs.page = 1;
  updateUniversalTable('peserta-regs-table-slot', renderPesertaRegistrationsTable);
}
function onPesertaPageSizeChange(size) {
  tableState.pesertaRegs.pageSize = size;
  tableState.pesertaRegs.page = 1;
  updateUniversalTable('peserta-regs-table-slot', renderPesertaRegistrationsTable);
}
function onPesertaSortChange(k) {
  if (tableState.pesertaRegs.sortKey === k) {
    tableState.pesertaRegs.sortDir = tableState.pesertaRegs.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.pesertaRegs.sortKey = k;
    tableState.pesertaRegs.sortDir = 'asc';
  }
  updateUniversalTable('peserta-regs-table-slot', renderPesertaRegistrationsTable);
}
function onPesertaFilterChange(v) {
  tableState.pesertaRegs.filterVal = v;
  tableState.pesertaRegs.page = 1;
  updateUniversalTable('peserta-regs-table-slot', renderPesertaRegistrationsTable);
}

// --- FULL-PAGE REGISTRATION WIZARD (NOT POPUP) ---
async function renderPesertaRegistrationWizard() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat formulir pendaftaran...</div>';

  try {
    const accRes = await apiRequest('/api/payments/accounts');
    if (accRes.success && accRes.data) state.paymentAccounts = accRes.data;
  } catch (e) {}

  container.innerHTML = `
    <div style="max-width: 850px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <a href="#overview" style="color: var(--text-muted); text-decoration: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
        </a>
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Formulir Pendaftaran Lomba</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Lengkapi data pendaftaran dan lampirkan bukti pembayaran dalam satu langkah mudah.</p>
      </div>

      <div id="wizard-alert" style="display: none; padding: 14px; border-radius: 8px; margin-bottom: 20px;"></div>

      <form id="full-registration-form" onsubmit="handleFullRegistrationSubmit(event)">
        
        <!-- SECTION 1: PILIH CABANG LOMBA -->
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-600); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">1</span>
            Pilih Kategori & Cabang Lomba
          </h3>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Kategori Lomba</label>
            <select id="wiz-cat" class="form-select" onchange="onWizardCatSelect()" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
              <option value="">-- Pilih Kategori Lomba --</option>
              ${state.competitionTree.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Jenjang Pendidikan</label>
            <select id="wiz-lvl" class="form-select" onchange="onWizardLvlSelect()" disabled required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
              <option value="">-- Pilih Jenjang Terlebih Dahulu --</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Cabang Lomba</label>
            <select id="wiz-branch" class="form-select" onchange="onWizardBranchSelect()" disabled required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
              <option value="">-- Pilih Cabang Lomba --</option>
            </select>
          </div>

          <!-- Branch Details Banner -->
          <div id="wiz-branch-info" style="display: none; padding: 16px; background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-md); margin-top: 14px;"></div>
        </div>

        <!-- SECTION 2: DATA PESERTA / TIM -->
        <div id="wiz-participant-section" class="card" style="display: none; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-600); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">2</span>
            Data Peserta / Tim
          </h3>
          <div id="wiz-participant-fields"></div>
        </div>

        <!-- SECTION 3: PEMBAYARAN & BUKTI TRANSFER (ON THE SAME PAGE) -->
        <div id="wiz-payment-section" class="card" style="display: none; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-600); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">3</span>
            Pembayaran & Bukti Transfer
          </h3>

          <div style="background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">Biaya Pendaftaran: <strong id="wiz-pay-fee-label" style="color: var(--primary-600); font-size: 1.2rem; margin-left: 6px;">Rp 0</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Silakan transfer ke salah satu rekening resmi panitia di bawah ini:</div>
          </div>

          <!-- REKENING BANK TRANSFER -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-building-columns" style="color: var(--primary-500);"></i> Transfer Bank
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${state.paymentAccounts.map((acc, idx) => `
                <label for="wiz-pay-radio-${idx}" style="cursor: pointer;">
                  <div class="wiz-pay-card" id="wiz-pay-card-${idx}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 2px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-subtle); transition: border-color 0.15s, background 0.15s;">
                    <input type="radio" name="wiz-pay-method" id="wiz-pay-radio-${idx}" value="${acc.id}" data-qris="${acc.qrisImagePath || ''}" onchange="onWizPayMethodChange(this, ${idx}, '${acc.qrisImagePath || ''}')" style="accent-color: var(--primary-500); width: 16px; height: 16px; flex-shrink: 0;" ${idx === 0 ? 'checked' : ''}>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-weight: 700; color: var(--text-heading); font-size: 0.9rem;">${acc.bankName}</div>
                      <div style="font-family: monospace; font-size: 1rem; font-weight: 800; color: var(--primary-600); letter-spacing: 0.04em;">${acc.accountNumber}</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">a.n. ${acc.accountHolder}</div>
                    </div>
                    <i class="fa-solid fa-copy" title="Salin nomor rekening" onclick="event.preventDefault(); navigator.clipboard.writeText('${acc.accountNumber}'); this.style.color='var(--success-500)'; setTimeout(()=>this.style.color='',1200);" style="color: var(--text-dim); cursor: pointer; font-size: 0.9rem; flex-shrink: 0;"></i>
                  </div>
                </label>
              `).join('')}
            </div>
            <!-- hidden select untuk kompatibilitas submit lama -->
            <input type="hidden" id="wiz-pay-account" value="${state.paymentAccounts[0]?.id || ''}">
          </div>

          <!-- QRIS SECTION -->
          ${state.paymentAccounts.some(a => a.qrisImagePath) ? `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-qrcode" style="color: #22c55e;"></i> Bayar via QRIS
              <span style="font-size: 0.7rem; font-weight: 400; color: var(--text-dim); text-transform: none;">(scan langsung dari HP)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
              ${state.paymentAccounts.filter(a => a.qrisImagePath).map((acc, qi) => `
                <div class="wiz-qris-card" id="wiz-qris-card-${qi}" onclick="selectQrisAccount('${acc.id}', ${qi})" style="cursor: pointer; border: 2px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-card); transition: border-color 0.15s, box-shadow 0.15s;">
                  <div style="background: #fff; padding: 12px; text-align: center;">
                    <img src="/api/payments/accounts/qris/${acc.qrisImagePath}" alt="QRIS ${acc.bankName}" style="max-height: 160px; max-width: 100%; object-fit: contain;" onerror="this.closest('.wiz-qris-card').style.display='none'">
                  </div>
                  <div style="padding: 8px 10px; border-top: 1px solid var(--border-subtle);">
                    <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-heading);">${acc.bankName}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">a.n. ${acc.accountHolder}</div>
                    <div id="wiz-qris-check-${qi}" style="display:none; margin-top: 4px; color: #22c55e; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Dipilih</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 4px;">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-receipt" style="color: var(--primary-500);"></i> Detail Pembayaran
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
              <div class="form-group">
                <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Bank Pengirim <span id="wiz-bank-optional" style="color:var(--text-dim); font-weight:400;">(opsional jika QRIS)</span></label>
                <input type="text" id="wiz-pay-bank" class="form-control" placeholder="Contoh: BCA / Mandiri / BSI / QRIS" style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
              </div>
              <div class="form-group">
                <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Pemilik Rekening Pengirim</label>
                <input type="text" id="wiz-pay-sender" class="form-control" placeholder="Nama sesuai buku tabungan" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Tanggal Transfer / Pembayaran</label>
              <input type="date" id="wiz-pay-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">File Bukti Transfer / Screenshot QRIS (PNG, JPG, WEBP - Max 5MB)</label>
              <input type="file" id="wiz-pay-file" class="form-control" accept="image/png, image/jpeg, image/webp" onchange="previewProofImage(this)" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            </div>
          </div>

          <!-- Image Preview Slot -->
          <div id="wiz-img-preview-slot" style="display: none; margin-bottom: 16px; text-align: center; background: #000; border-radius: 8px; padding: 10px;">
            <img id="wiz-preview-img" src="" alt="Preview Bukti" style="max-height: 200px; max-width: 100%; object-fit: contain;">
          </div>
        </div>


        <button type="submit" id="wiz-submit-btn" class="btn btn-primary" style="width: 100%; padding: 14px; font-weight: 700; font-size: 1rem;" disabled>
          <i class="fa-solid fa-check"></i> Simpan Pendaftaran & Unggah Bukti
        </button>
      </form>
    </div>
  `;
}

function onWizardCatSelect() {
  const catId = document.getElementById('wiz-cat').value;
  const lvlSelect = document.getElementById('wiz-lvl');
  const branchSelect = document.getElementById('wiz-branch');
  const partSec = document.getElementById('wiz-participant-section');
  const paySec = document.getElementById('wiz-payment-section');
  const infoBanner = document.getElementById('wiz-branch-info');
  const submitBtn = document.getElementById('wiz-submit-btn');

  lvlSelect.innerHTML = '<option value="">-- Pilih Jenjang --</option>';
  branchSelect.innerHTML = '<option value="">-- Pilih Cabang Lomba --</option>';
  branchSelect.disabled = true;
  partSec.style.display = 'none';
  paySec.style.display = 'none';
  infoBanner.style.display = 'none';
  submitBtn.disabled = true;

  if (!catId) {
    lvlSelect.disabled = true;
    return;
  }

  const category = state.competitionTree.find(c => c.id === catId);
  if (category) {
    category.levels.forEach(lvl => {
      lvlSelect.innerHTML += `<option value="${lvl.id}">${lvl.name}</option>`;
    });
    lvlSelect.disabled = false;
  }
}

function onWizardLvlSelect() {
  const catId = document.getElementById('wiz-cat').value;
  const lvlId = document.getElementById('wiz-lvl').value;
  const branchSelect = document.getElementById('wiz-branch');
  const partSec = document.getElementById('wiz-participant-section');
  const paySec = document.getElementById('wiz-payment-section');
  const infoBanner = document.getElementById('wiz-branch-info');
  const submitBtn = document.getElementById('wiz-submit-btn');

  branchSelect.innerHTML = '<option value="">-- Pilih Cabang Lomba --</option>';
  partSec.style.display = 'none';
  paySec.style.display = 'none';
  infoBanner.style.display = 'none';
  submitBtn.disabled = true;

  if (!lvlId) {
    branchSelect.disabled = true;
    return;
  }

  const category = state.competitionTree.find(c => c.id === catId);
  const level = category?.levels.find(l => l.id === lvlId);

  if (level) {
    level.branches.forEach(br => {
      branchSelect.innerHTML += `<option value="${br.id}">${br.name} (${br.participantType === 'INDIVIDUAL' ? 'Perorangan' : 'Beregu / Tim'})</option>`;
    });
    branchSelect.disabled = false;
  }
}

function onWizardBranchSelect() {
  const catId = document.getElementById('wiz-cat').value;
  const lvlId = document.getElementById('wiz-lvl').value;
  const branchId = document.getElementById('wiz-branch').value;
  const partSec = document.getElementById('wiz-participant-section');
  const partFields = document.getElementById('wiz-participant-fields');
  const paySec = document.getElementById('wiz-payment-section');
  const infoBanner = document.getElementById('wiz-branch-info');
  const submitBtn = document.getElementById('wiz-submit-btn');

  if (!branchId) {
    partSec.style.display = 'none';
    paySec.style.display = 'none';
    infoBanner.style.display = 'none';
    submitBtn.disabled = true;
    return;
  }

  const category = state.competitionTree.find(c => c.id === catId);
  const level = category?.levels.find(l => l.id === lvlId);
  const branch = level?.branches.find(b => b.id === branchId);

  if (!branch) return;

  const branchFeeFormatted = formatCurrency(Number(branch.registrationFee) || 0);

  partSec.style.display = 'block';
  paySec.style.display = 'block';
  submitBtn.disabled = false;

  infoBanner.style.display = 'block';
  infoBanner.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <div>
        <span class="badge ${branch.participantType === 'INDIVIDUAL' ? 'badge-info' : 'badge-primary'}">${branch.participantType === 'INDIVIDUAL' ? 'Lomba Perorangan' : 'Lomba Beregu (Tim)'}</span>
        <strong style="margin-left: 8px; font-size: 1rem; color: var(--text-heading);">${branch.name}</strong>
        ${branch.participantType === 'TEAM' ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Batas Anggota Tim: <strong>${branch.minTeamMembers} - ${branch.maxTeamMembers} Orang</strong> (Termasuk Ketua Tim)</div>` : ''}
      </div>
      <div>
        <span style="font-size: 0.8rem; color: var(--text-dim);">Biaya:</span>
        <strong style="color: var(--primary-600); font-size: 1.15rem; margin-left: 4px;">${branchFeeFormatted}</strong>
      </div>
    </div>
  `;

  const payFeeLabel = document.getElementById('wiz-pay-fee-label');
  if (payFeeLabel) {
    payFeeLabel.textContent = branchFeeFormatted;
  }

  if (branch.participantType === 'INDIVIDUAL') {
    partFields.innerHTML = `
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Lengkap Peserta</label>
        <input type="text" id="wiz-indiv-name" class="form-control" placeholder="Nama Lengkap Siswa/i" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Jenis Kelamin</label>
          <select id="wiz-indiv-gender" class="form-select" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Kelas / Tingkat</label>
          <input type="text" id="wiz-indiv-grade" class="form-control" placeholder="Contoh: Kelas 5 SD" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Asal Sekolah / Madrasah</label>
        <input type="text" id="wiz-indiv-school" class="form-control" placeholder="Nama Lengkap Sekolah Asal" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Alamat Sekolah</label>
        <textarea id="wiz-indiv-address" class="form-control" rows="2" placeholder="Alamat lengkap instansi sekolah" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);"></textarea>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Guru Pembimbing</label>
          <input type="text" id="wiz-indiv-mentor" class="form-control" placeholder="Nama Guru / Pembina" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">No WhatsApp Kontak</label>
          <input type="text" id="wiz-indiv-wa" class="form-control" placeholder="08123456789" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
    `;
  } else {
    // TEAM FORM
    partFields.innerHTML = `
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Tim</label>
        <input type="text" id="wiz-team-name" class="form-control" placeholder="Contoh: Robotik Alpha Squad" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Asal Sekolah / Madrasah</label>
        <input type="text" id="wiz-team-school" class="form-control" placeholder="Nama Lengkap Sekolah Asal" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Alamat Sekolah</label>
        <textarea id="wiz-team-address" class="form-control" rows="2" placeholder="Alamat lengkap instansi sekolah" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);"></textarea>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Guru Pembimbing / Pelatih</label>
          <input type="text" id="wiz-team-mentor" class="form-control" placeholder="Nama Guru Pembimbing" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">No WhatsApp Kontak Tim</label>
          <input type="text" id="wiz-team-wa" class="form-control" placeholder="08123456789" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 20px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 700; margin-bottom: 6px; color: var(--primary-600);">Nama Ketua Tim (Personel 1)</label>
        <input type="text" id="wiz-team-leader" class="form-control" placeholder="Nama Lengkap Ketua Tim" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>

      <div style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <label class="form-label" style="font-weight: 700; margin-bottom: 0;">Anggota Tambahan Tim:</label>
          <button type="button" class="btn btn-sm btn-secondary" onclick="addWizTeamMemberRow(${branch.maxTeamMembers})">
            <i class="fa-solid fa-user-plus"></i> Tambah Anggota
          </button>
        </div>
        <div id="wiz-members-container" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;

    // Initialize required min members
    const initialMembers = Math.max(1, (branch.minTeamMembers || 2) - 1);
    for (let i = 0; i < initialMembers; i++) {
      addWizTeamMemberRow(branch.maxTeamMembers);
    }
  }
}

function addWizTeamMemberRow(maxMembers) {
  const container = document.getElementById('wiz-members-container');
  if (!container) return;

  const currentCount = container.querySelectorAll('.wiz-member-item').length + 1; // +1 for leader
  if (currentCount >= maxMembers) {
    alert(`Batas maksimal tim untuk cabang ini adalah ${maxMembers} orang (termasuk Ketua Tim).`);
    return;
  }

  const idx = container.querySelectorAll('.wiz-member-item').length + 1;
  const row = document.createElement('div');
  row.className = 'wiz-member-item';
  row.style.cssText = 'background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;';
  row.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-heading);">Anggota ${idx}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.wiz-member-item').remove()" style="padding: 2px 8px; font-size: 0.75rem;">
        <i class="fa-solid fa-trash"></i> Hapus
      </button>
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
      <input type="text" class="form-control mem-name" placeholder="Nama Lengkap Anggota" required style="padding: 8px 12px; font-size: 0.85rem; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-sm);">
      <select class="form-select mem-gender" required style="padding: 8px 12px; font-size: 0.85rem; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-sm);">
        <option value="L">L</option>
        <option value="P">P</option>
      </select>
      <input type="text" class="form-control mem-grade" placeholder="Kelas" required style="padding: 8px 12px; font-size: 0.85rem; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-sm);">
    </div>
  `;
  container.appendChild(row);
}

function onWizPayMethodChange(radio, idx, qrisPath) {
  // Update hidden input
  const hidden = document.getElementById('wiz-pay-account');
  if (hidden) hidden.value = radio.value;

  // Highlight selected card, reset others
  document.querySelectorAll('.wiz-pay-card').forEach((c, i) => {
    c.style.borderColor = i === idx ? 'var(--primary-500)' : 'var(--border-subtle)';
    c.style.background = i === idx ? 'var(--bg-highlight, rgba(99,102,241,0.06))' : 'var(--bg-subtle)';
  });

  // Reset semua QRIS check indicator
  document.querySelectorAll('[id^="wiz-qris-check-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.wiz-qris-card').forEach(el => {
    el.style.borderColor = 'var(--border-subtle)';
    el.style.boxShadow = 'none';
  });

  // Jika rekening ini punya QRIS, highlight card QRIS-nya juga
  if (qrisPath) {
    const bankInput = document.getElementById('wiz-pay-bank');
    if (bankInput && !bankInput.value) bankInput.placeholder = 'QRIS (opsional)';
  }
}

function selectQrisAccount(accountId, qrisIdx) {
  // Update hidden input
  const hidden = document.getElementById('wiz-pay-account');
  if (hidden) hidden.value = accountId;

  // Cari radio button yang sesuai dan centang
  const radios = document.querySelectorAll('input[name="wiz-pay-method"]');
  let radioIdx = -1;
  radios.forEach((r, i) => {
    if (r.value === accountId) {
      r.checked = true;
      radioIdx = i;
    }
  });

  // Highlight radio card
  document.querySelectorAll('.wiz-pay-card').forEach((c, i) => {
    c.style.borderColor = i === radioIdx ? 'var(--primary-500)' : 'var(--border-subtle)';
    c.style.background = i === radioIdx ? 'var(--bg-highlight, rgba(99,102,241,0.06))' : 'var(--bg-subtle)';
  });

  // Highlight QRIS card yang dipilih
  document.querySelectorAll('.wiz-qris-card').forEach((el, i) => {
    el.style.borderColor = i === qrisIdx ? '#22c55e' : 'var(--border-subtle)';
    el.style.boxShadow = i === qrisIdx ? '0 0 0 3px rgba(34,197,94,0.15)' : 'none';
  });
  document.querySelectorAll('[id^="wiz-qris-check-"]').forEach((el, i) => {
    el.style.display = i === qrisIdx ? 'block' : 'none';
  });

  // Isi otomatis field Bank Pengirim dengan "QRIS"
  const bankInput = document.getElementById('wiz-pay-bank');
  if (bankInput && !bankInput.value) {
    bankInput.value = 'QRIS';
    bankInput.placeholder = 'QRIS';
  }
}

function previewProofImage(input) {
  const slot = document.getElementById('wiz-img-preview-slot');
  const img = document.getElementById('wiz-preview-img');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
      slot.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    slot.style.display = 'none';
  }
}

async function handleFullRegistrationSubmit(e) {
  e.preventDefault();
  const catId = document.getElementById('wiz-cat').value;
  const lvlId = document.getElementById('wiz-lvl').value;
  const branchId = document.getElementById('wiz-branch').value;
  const fileInput = document.getElementById('wiz-pay-file');
  const btn = document.getElementById('wiz-submit-btn');

  const category = state.competitionTree.find(c => c.id === catId);
  const level = category?.levels.find(l => l.id === lvlId);
  const branch = level?.branches.find(b => b.id === branchId);

  if (!branch) return;

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Wajib mengunggah file bukti transfer pembayaran.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan pendaftaran & bukti pembayaran...';

  try {
    // 1. Submit Registration
    let regEndpoint = '';
    let regPayload = {};

    if (branch.participantType === 'INDIVIDUAL') {
      regEndpoint = '/api/registrations/individual';
      regPayload = {
        branchId,
        fullName: document.getElementById('wiz-indiv-name').value,
        gender: document.getElementById('wiz-indiv-gender').value,
        gradeClass: document.getElementById('wiz-indiv-grade').value,
        schoolName: document.getElementById('wiz-indiv-school').value,
        schoolAddress: document.getElementById('wiz-indiv-address').value,
        mentorName: document.getElementById('wiz-indiv-mentor').value,
        whatsappNumber: document.getElementById('wiz-indiv-wa').value,
      };
    } else {
      regEndpoint = '/api/registrations/team';
      const members = [];
      document.querySelectorAll('.wiz-member-item').forEach(item => {
        members.push({
          memberName: item.querySelector('.mem-name').value,
          gender: item.querySelector('.mem-gender').value,
          gradeClass: item.querySelector('.mem-grade').value,
        });
      });

      regPayload = {
        branchId,
        teamName: document.getElementById('wiz-team-name').value,
        schoolName: document.getElementById('wiz-team-school').value,
        schoolAddress: document.getElementById('wiz-team-address').value,
        mentorName: document.getElementById('wiz-team-mentor').value,
        whatsappNumber: document.getElementById('wiz-team-wa').value,
        leaderName: document.getElementById('wiz-team-leader').value,
        members,
      };
    }

    const regRes = await apiRequest(regEndpoint, {
      method: 'POST',
      body: regPayload,
    });

    if (!regRes.success || !regRes.data) {
      throw new Error(regRes.message || 'Gagal menyimpan pendaftaran.');
    }

    const regId = regRes.data.id;

    // 2. Upload Payment Proof immediately
    const formData = new FormData();
    formData.append('registrationId', regId);
    formData.append('paymentAccountId', document.getElementById('wiz-pay-account').value);
    formData.append('senderBank', document.getElementById('wiz-pay-bank').value);
    formData.append('senderAccountName', document.getElementById('wiz-pay-sender').value);
    formData.append('paymentDate', document.getElementById('wiz-pay-date').value);
    formData.append('payment_proof', fileInput.files[0]);

    await apiRequest('/api/payments/upload', {
      method: 'POST',
      body: formData,
    });

    // 3. Redirect to Ringkasan Pendaftaran
    window.location.hash = `#detail/${regId}`;
  } catch (err) {
    showBannerAlert('wizard-alert', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Pendaftaran & Unggah Bukti';
  }
}

// --- RINGKASAN & DETAIL PENDAFTARAN (FULL PAGE) ---
async function renderPesertaRegistrationDetail(regId) {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat ringkasan pendaftaran...</div>';

  try {
    const res = await apiRequest(`/api/registrations/${regId}`);
    if (!res.success || !res.data) throw new Error('Data pendaftaran tidak ditemukan.');

    const reg = res.data;
    const isIndiv = reg.branch.participantType === 'INDIVIDUAL';
    const participantName = isIndiv ? reg.individualParticipant?.fullName : reg.team?.teamName;
    const schoolName = isIndiv ? reg.individualParticipant?.schoolName : reg.team?.schoolName;
    const latestPayment = reg.payments && reg.payments[0] ? reg.payments[0] : null;
    const rejectionLog = latestPayment?.verificationLogs?.find(l => l.action === 'REJECTED');

    container.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto;">
        
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <a href="#overview" style="color: var(--text-muted); text-decoration: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
            </a>
            <h2 style="font-size: 1.6rem; color: var(--text-heading); margin: 0;">Ringkasan Pendaftaran</h2>
          </div>
          <div>
            ${reg.status === 'APPROVED' ? `
              <button type="button" class="btn btn-success" onclick="openParticipantCardModal('${reg.id}')"><i class="fa-solid fa-id-card"></i> Lihat & Cetak Kartu Peserta</button>
            ` : ''}
          </div>
        </div>

        <div id="detail-alert" style="display: none; padding: 14px; border-radius: 8px; margin-bottom: 20px;"></div>

        <!-- Check-in Status Banner -->
        <div class="card" style="background: var(--bg-card); border: 2px solid ${reg.checkIn ? 'var(--success-500)' : 'var(--border-subtle)'}; border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Status Check-In Hari Lomba:</div>
            <div style="margin-top: 4px;">${getCheckInBadge(reg.checkIn)}</div>
          </div>
          ${reg.checkIn ? `
            <div style="font-size: 0.85rem; color: var(--text-muted); text-align: right;">
              Petugas: <strong>${reg.checkIn.checkedInBy?.name || 'Panitia'}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Registration Main Overview Card -->
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
            <div>
              <span class="badge ${isIndiv ? 'badge-info' : 'badge-primary'}" style="margin-bottom: 6px;">${isIndiv ? 'LOMBA PERORANGAN' : 'LOMBA BEREGU / TIM'}</span>
              <h3 style="font-size: 1.35rem; color: var(--text-heading); margin: 4px 0;">${participantName}</h3>
              <div style="color: var(--text-muted); font-size: 0.9rem;">${schoolName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Nomor Registrasi</div>
              <code style="font-size: 1.25rem; font-weight: 800; color: var(--primary-600);">${reg.registrationNumber}</code>
              <div style="margin-top: 4px;">${getStatusBadge(reg.status)}</div>
            </div>
          </div>

          <!-- 2 Columns Details Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            <div>
              <h4 style="font-size: 0.95rem; color: var(--primary-600); margin-bottom: 12px; text-transform: uppercase; font-weight: 800;"><i class="fa-solid fa-trophy"></i> Informasi Lomba</h4>
              <table style="width: 100%; font-size: 0.875rem;">
                <tr><td style="color: var(--text-muted); padding: 4px 0; width: 120px;">Kategori:</td><td style="font-weight: 700; color: var(--text-heading);">${reg.branch.level.category.name}</td></tr>
                <tr><td style="color: var(--text-muted); padding: 4px 0;">Jenjang:</td><td style="font-weight: 700; color: var(--text-heading);">${reg.branch.level.name}</td></tr>
                <tr><td style="color: var(--text-muted); padding: 4px 0;">Cabang Lomba:</td><td style="font-weight: 700; color: var(--primary-600);">${reg.branch.name}</td></tr>
                <tr><td style="color: var(--text-muted); padding: 4px 0;">Biaya:</td><td style="font-weight: 800; color: var(--accent-600);">${formatCurrency(reg.branch.registrationFee)}</td></tr>
              </table>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; color: var(--primary-600); margin-bottom: 12px; text-transform: uppercase; font-weight: 800;"><i class="fa-solid fa-user"></i> Kontak & Pembimbing</h4>
              <table style="width: 100%; font-size: 0.875rem;">
                <tr><td style="color: var(--text-muted); padding: 4px 0; width: 120px;">Guru Pembimbing:</td><td style="font-weight: 700; color: var(--text-heading);">${isIndiv ? reg.individualParticipant?.mentorName : reg.team?.mentorName}</td></tr>
                <tr><td style="color: var(--text-muted); padding: 4px 0;">No. WhatsApp:</td><td style="font-weight: 700; color: var(--text-heading);">${isIndiv ? reg.individualParticipant?.whatsappNumber : reg.team?.whatsappNumber}</td></tr>
                <tr><td style="color: var(--text-muted); padding: 4px 0;">Waktu Daftar:</td><td style="color: var(--text-muted);">${formatDate(reg.createdAt)}</td></tr>
              </table>
            </div>
          </div>

          <!-- Team Members List if Team -->
          ${!isIndiv && reg.team ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
              <h4 style="font-size: 0.95rem; color: var(--text-heading); margin-bottom: 8px;">Daftar Personel Tim:</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <span class="member-chip" style="border-color: var(--primary-400); background: var(--primary-50); color: var(--primary-800);"><i class="fa-solid fa-crown"></i> Ketua: <strong>${reg.team.leaderName}</strong></span>
                ${(reg.team.members || []).map(m => `
                  <span class="member-chip">${m.memberName} (${m.gender}, ${m.gradeClass})</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Payment Status & Proof Section -->
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 16px;"><i class="fa-solid fa-credit-card"></i> Status Pembayaran</h3>

          ${reg.status === 'PAYMENT_REJECTED' ? `
            <div class="alert alert-danger" style="margin-bottom: 20px;">
              <h4 style="margin-bottom: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> Pembayaran Ditolak oleh Bendahara</h4>
              <div>Alasan Penolakan: <strong>${rejectionLog?.rejectionReason || latestPayment?.notes || 'Bukti pembayaran tidak sesuai/tidak terbaca.'}</strong></div>
            </div>

            <!-- Inline Re-upload Form -->
            <div style="background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
              <h4 style="font-size: 1rem; color: var(--text-heading); margin-bottom: 12px;">Unggah Ulang Bukti Pembayaran</h4>
              <form onsubmit="handleReuploadSubmit(event, '${reg.id}')">
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Pilih File Bukti Transfer Baru</label>
                  <input type="file" id="reupload-file" class="form-control" accept="image/png, image/jpeg, image/webp" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
                </div>
                <button type="submit" id="reupload-btn" class="btn btn-primary"><i class="fa-solid fa-cloud-arrow-up"></i> Kirim Bukti Baru</button>
              </form>
            </div>
          ` : latestPayment ? `
            <div style="display: grid; grid-template-columns: 1fr 200px; gap: 20px; align-items: start;">
              <div>
                <table style="width: 100%; font-size: 0.875rem;">
                  <tr><td style="color: var(--text-muted); padding: 4px 0; width: 140px;">Status:</td><td>${getStatusBadge(reg.status)}</td></tr>
                  <tr><td style="color: var(--text-muted); padding: 4px 0;">Nominal:</td><td style="font-weight: 700; color: var(--primary-600);">${formatCurrency(latestPayment.amount)}</td></tr>
                  <tr><td style="color: var(--text-muted); padding: 4px 0;">Rekening Tujuan:</td><td>${latestPayment.paymentAccount?.bankName || 'Bank Panitia'} (${latestPayment.paymentAccount?.accountNumber || '-'})</td></tr>
                  <tr><td style="color: var(--text-muted); padding: 4px 0;">Pengirim:</td><td>${latestPayment.senderBank || '-'} a.n. ${latestPayment.senderAccountName || '-'}</td></tr>
                  <tr><td style="color: var(--text-muted); padding: 4px 0;">Tanggal Transfer:</td><td>${formatDate(latestPayment.paymentDate)}</td></tr>
                </table>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 6px; font-weight: 700;">Bukti Transfer:</div>
                <div style="background: #0f172a; border-radius: 8px; overflow: hidden; text-align: center; border: 1px solid var(--border-subtle); padding: 4px; max-height: 140px; display: flex; align-items: center; justify-content: center;">
                  <img src="/api/payments/file/${encodeURIComponent(latestPayment.proofImagePath)}?token=${encodeURIComponent(state.token || safeStorage.getItem('lomba_jwt_token') || '')}" alt="Bukti Transfer" style="max-width: 100%; max-height: 130px; border-radius: 4px; object-fit: contain;" onerror="this.style.display='none'; document.getElementById('det-proof-fb').style.display='block';">
                  <div id="det-proof-fb" style="display: none; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">
                    <i class="fa-solid fa-file-image" style="font-size: 1.5rem; color: var(--primary-500); margin-bottom: 4px;"></i><br>Bukti terunggah
                  </div>
                </div>
                <a href="/api/payments/file/${encodeURIComponent(latestPayment.proofImagePath)}?token=${encodeURIComponent(state.token || safeStorage.getItem('lomba_jwt_token') || '')}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--primary-600); margin-top: 6px; font-weight: 600; text-decoration: none;">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Lihat Bukti Penuh
                </a>
              </div>
            </div>
          ` : `
            <p style="color: var(--text-muted);">Belum ada riwayat pembayaran.</p>
          `}
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function handleReuploadSubmit(e, regId) {
  e.preventDefault();
  const fileInput = document.getElementById('reupload-file');
  const btn = document.getElementById('reupload-btn');

  if (!fileInput.files || !fileInput.files[0]) {
    alert('Pilih file bukti transfer.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';

  try {
    const formData = new FormData();
    formData.append('registrationId', regId);
    formData.append('payment_proof', fileInput.files[0]);

    const res = await apiRequest('/api/payments/reupload', {
      method: 'POST',
      body: formData,
    });

    if (res.success) {
      alert('Bukti transfer baru berhasil dikirim dan sedang menunggu verifikasi panitia.');
      renderPesertaRegistrationDetail(regId);
    }
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Kirim Bukti Baru';
  }
}

// Global holder for currently opened modal card
let currentActiveCardData = null;

// --- SHARED CARD HTML BUILDER (used by both page view & modal view) ---
function buildSingleCardHTML(card) {
  const isTeam = card.participant_type === 'TEAM';
  const memberCount = (isTeam && card.members) ? card.members.length : 0;
  
  // Dynamic scaling for team member chips if team has many members
  const chipFontSize = memberCount > 4 ? '0.62rem' : memberCount > 2 ? '0.68rem' : '0.74rem';
  const chipPadding = memberCount > 4 ? '1px 6px' : '2px 8px';
  const membersGap = memberCount > 4 ? '2px' : '3px';

  const membersHTML = isTeam && card.members && card.members.length > 0
    ? card.members.map(m => `<span style="background:#e0e7ff;border:1px solid #c7d2fe;padding:${chipPadding};border-radius:5px;font-size:${chipFontSize};font-weight:700;color:#3730a3;margin:1px 2px 1px 0;display:inline-block;text-transform:uppercase;">${m.memberName}</span>`).join('')
    : '';

  return `
    <div class="id-card-official official-card-print" id="official-card-print" style="
      width:378px;
      height:529px;
      max-width:378px;
      max-height:529px;
      background:#ffffff;
      border-radius:12px;
      border:2px solid #1e1b4b;
      box-shadow:0 16px 36px -10px rgba(15,23,42,0.2);
      overflow:hidden;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      box-sizing:border-box;
      font-family:'Segoe UI',Arial,sans-serif;
      color:#0f172a;
      margin:0 auto;
      text-align:left;
      text-transform:uppercase !important;
    ">

      <!-- TOP SECTION -->
      <div style="flex-shrink:0;">
        <!-- HEADER BANNER -->
        <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4338ca 100%);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #f59e0b;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${card.logo_url || '/static/img/logo_e7a8b6a95d.webp'}" alt="Logo"
              style="height:36px;width:36px;object-fit:contain;background:#fff;padding:2px;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.25);"
              onerror="this.style.display='none'">
            <div>
              <div style="font-size:0.92rem;font-weight:800;line-height:1.2;text-transform:uppercase;color:#ffffff;">${card.app_short_name || 'MASKUMAMBANG FEST #4'}</div>
              <div style="font-size:0.68rem;color:rgba(255,255,255,0.85);margin-top:1px;text-transform:uppercase;">${card.category_name} · JENJANG ${card.level_name}</div>
            </div>
          </div>
          <span style="background:rgba(245,158,11,0.2);border:1px solid #f59e0b;color:#fbbf24;font-size:0.62rem;font-weight:800;padding:3px 8px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;">${isTeam ? 'TIM / BEREGU' : 'PERORANGAN'}</span>
        </div>

        <!-- LABEL KARTU -->
        <div style="background:#f1f5f9;text-align:center;padding:3px;border-bottom:1px solid #e2e8f0;flex-shrink:0;">
          <span style="font-size:0.65rem;font-weight:800;color:#475569;letter-spacing:0.12em;text-transform:uppercase;">✦ KARTU PESERTA RESMI ✦</span>
        </div>

        <!-- NO REG -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1.5px dashed #a5b4fc;padding:5px 12px;margin:8px 12px 0;border-radius:6px;flex-shrink:0;">
          <span style="font-size:0.68rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">NO. REGISTRASI:</span>
          <span style="font-size:0.95rem;font-weight:800;color:#4338ca;font-family:monospace;letter-spacing:0.05em;text-transform:uppercase;">${card.registration_number}</span>
        </div>
      </div>

      <!-- INFO PESERTA (SCALED, AUTO-WRAP & COMPACT) -->
      <div style="padding:6px 12px;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;">
        <div style="margin-bottom:4px;">
          <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;">NAMA ${isTeam ? 'TIM' : 'PESERTA'}:</div>
          <div style="font-size:${isTeam ? '0.92rem' : '0.98rem'};font-weight:800;color:#1e1b4b;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.participant_name}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-bottom:4px;">
          <div style="min-width:0;">
            <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;">ASAL SEKOLAH:</div>
            <div style="font-size:0.75rem;font-weight:700;color:#0f172a;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.school_name}</div>
          </div>
          <div style="min-width:0;">
            <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;">CABANG LOMBA:</div>
            <div style="font-size:0.75rem;font-weight:700;color:#4338ca;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.branch_name}</div>
          </div>
          ${card.mentor_name && card.mentor_name !== '-' ? `
          <div style="min-width:0;">
            <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;">PEMBIMBING:</div>
            <div style="font-size:0.72rem;font-weight:600;color:#334155;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.mentor_name}</div>
          </div>` : ''}
          ${isTeam && card.leader_name ? `
          <div style="min-width:0;">
            <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;">KETUA TIM:</div>
            <div style="font-size:0.72rem;font-weight:700;color:#0f172a;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.leader_name}</div>
          </div>` : ''}
        </div>

        ${membersHTML ? `
        <div style="border-top:1px dashed #cbd5e1;padding-top:4px;margin-top:2px;">
          <div style="font-size:0.62rem;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:2px;">ANGGOTA TIM:</div>
          <div style="line-height:1.2;">${membersHTML}</div>
        </div>` : ''}
      </div>

      <!-- BOTTOM SECTION: QR CODE & FOOTER -->
      <div style="flex-shrink:0;">
        <!-- QR CODE — FIT KE UKURAN 10x14cm -->
        <div style="background:linear-gradient(to bottom,#f8fafc,#eef2ff);border-top:1.5px solid #e0e7ff;padding:8px 12px;display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          <div style="background:#ffffff;border:2px solid #c7d2fe;border-radius:8px;padding:5px;box-shadow:0 3px 10px rgba(67,56,202,0.12);display:inline-block;">
            <img src="${card.qr_data_uri}" alt="QR Check-in" style="width:105px;height:105px;display:block;border-radius:4px;">
          </div>
          <div style="margin-top:4px;font-size:0.66rem;font-weight:800;color:#4338ca;letter-spacing:0.1em;text-transform:uppercase;">◈ SCAN UNTUK CHECK-IN ◈</div>
          <div style="font-size:0.58rem;color:#94a3b8;margin-top:1px;text-transform:uppercase;">TUNJUKKAN KARTU INI SAAT MEMASUKI AREA LOMBA</div>
        </div>

        <!-- FOOTER -->
        <div style="background:#1e1b4b;padding:5px 14px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
          <span style="display:inline-flex;align-items:center;gap:4px;color:#4ade80;font-size:0.68rem;font-weight:800;text-transform:uppercase;">
            <i class="fa-solid fa-circle-check"></i> TERVERIFIKASI RESMI
          </span>
          <span style="font-size:0.65rem;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:0.04em;">www.maskumambang.ac.id</span>
        </div>
      </div>

    </div>
  `;
}

// --- DEDICATED POPUP PRINT FOR SINGLE CARD (100% RELIABLE, NEVER BLANK, UPPERCASE, PERFECT FIT) ---
function ensureHtml2CanvasLoaded() {
  if (typeof html2canvas !== 'undefined') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Gagal memuat pustaka html2canvas untuk mengunduh gambar JPG.'));
    document.head.appendChild(script);
  });
}

async function downloadParticipantCardJPG(card) {
  const targetCard = card || currentActiveCardData;
  const btn = document.getElementById('btn-download-card') || document.getElementById('btn-download-card-view');
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  }

  try {
    await ensureHtml2CanvasLoaded();

    let elementToCapture = document.getElementById('official-card-print');
    let tempWrapper = null;

    // Jika elemen kartu tidak ada di layar aktif, buat container sementara di luar layar
    if (!elementToCapture && targetCard) {
      tempWrapper = document.createElement('div');
      tempWrapper.style.position = 'fixed';
      tempWrapper.style.left = '-9999px';
      tempWrapper.style.top = '0';
      tempWrapper.style.zIndex = '-1';
      tempWrapper.innerHTML = buildSingleCardHTML(targetCard);
      document.body.appendChild(tempWrapper);
      elementToCapture = tempWrapper.querySelector('#official-card-print') || tempWrapper.firstElementChild;
    }

    if (!elementToCapture) {
      throw new Error('Elemen kartu peserta tidak ditemukan.');
    }

    // Beri jeda sejenak untuk rendering
    await new Promise(r => setTimeout(r, 120));

    const canvas = await html2canvas(elementToCapture, {
      scale: 3, // High DPI (300 DPI) agar tajam dan jernih untuk cetak/simpan
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const regNum = targetCard?.registration_number || 'kartu';
    const cleanRegNum = regNum.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanName = (targetCard?.participant_name || 'peserta').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filename = `kartu_peserta_${cleanRegNum}_${cleanName}.jpg`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (tempWrapper) {
      document.body.removeChild(tempWrapper);
    }
  } catch (err) {
    alert('Gagal mengunduh kartu peserta: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
}

function printSingleCardPopup(card) {
  if (!card) {
    if (currentActiveCardData) card = currentActiveCardData;
    else { window.print(); return; }
  }

  const printWin = window.open('', '_blank', 'width=850,height=950');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cetak Kartu Peserta - ${card.participant_name} (${card.registration_number})</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"><\/script>
<style>
  @page {
    size: 10cm 14cm portrait;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px 0;
    margin: 0;
    text-transform: uppercase !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-action-bar {
    position: fixed;
    top: 12px;
    right: 16px;
    z-index: 9999;
    display: flex;
    gap: 8px;
    background: rgba(15, 23, 42, 0.85);
    padding: 8px 12px;
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }
  .print-action-bar button {
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-do-download {
    background: #16a34a;
    color: #ffffff;
  }
  .btn-do-download:hover {
    background: #15803d;
  }
  .btn-do-print {
    background: #4f46e5;
    color: #ffffff;
  }
  .btn-do-print:hover {
    background: #4338ca;
  }
  .btn-do-close {
    background: #334155;
    color: #ffffff;
  }
  .btn-do-close:hover {
    background: #475569;
  }
  .card-outer-wrap {
    width: 10cm;
    height: 14cm;
    max-width: 10cm;
    max-height: 14cm;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
  @media print {
    body { padding: 0; margin: 0; background: #ffffff !important; }
    .no-print { display: none !important; }
    .card-outer-wrap {
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 10cm !important;
      height: 14cm !important;
      max-height: 14cm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .id-card-official {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
  }
</style>
</head>
<body>
  <div class="no-print print-action-bar">
    <button type="button" class="btn-do-download" onclick="downloadPopupCardJPG()"><i class="fa-solid fa-download"></i> DOWNLOAD (JPG)</button>
    <button type="button" class="btn-do-print" onclick="window.print()"><i class="fa-solid fa-print"></i> CETAK / PRINT</button>
    <button type="button" class="btn-do-close" onclick="window.close()">TUTUP</button>
  </div>
  <div class="card-outer-wrap" id="popup-card-wrap">
    ${buildSingleCardHTML(card)}
  </div>
  <script>
    async function downloadPopupCardJPG() {
      const el = document.getElementById('popup-card-wrap') || document.getElementById('official-card-print');
      if (!el) return;
      try {
        const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff', useCORS: true, allowTaint: true });
        const link = document.createElement('a');
        link.download = 'kartu_peserta_${(card.registration_number || 'card').replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        alert('Gagal mendownload JPG: ' + e.message);
      }
    }
    window.onload = function() {
      setTimeout(() => window.print(), 600);
    };
  <\/script>
</body>
</html>`);
  printWin.document.close();
}

// --- OFFICIAL PARTICIPANT CARD VIEW (Full Page — for direct URL / print) ---
async function renderParticipantCardView(regId) {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Kartu Peserta...</div>';

  try {
    const res = await apiRequest(`/api/cards/${regId}`);
    if (!res.success || !res.data) throw new Error('Kartu peserta tidak tersedia atau pendaftaran belum disetujui.');

    const card = res.data;
    currentActiveCardData = card;

    container.innerHTML = `
      <div style="max-width: 480px; margin: 0 auto;">
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <a href="#overview" style="color: var(--text-muted); text-decoration: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
          </a>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-success" id="btn-download-card-view" onclick="downloadParticipantCardJPG()"><i class="fa-solid fa-download"></i> Download</button>
            <button type="button" class="btn btn-primary" onclick="printParticipantCard()"><i class="fa-solid fa-print"></i> Cetak Kartu</button>
          </div>
        </div>
        <div class="card-preview-container">
          ${buildSingleCardHTML(card)}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger" style="max-width: 600px; margin: 40px auto; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        <h4 style="margin-bottom: 6px;">Kartu Peserta Belum Dapat Diakses</h4>
        <p>${err.message}</p>
        <a href="#overview" class="btn btn-sm btn-secondary" style="margin-top: 10px;">Kembali ke Dashboard</a>
      </div>
    `;
  }
}

// --- PARTICIPANT CARD MODAL (popup dari tabel) ---
async function openParticipantCardModal(regId) {
  openAppModal(`
    <div style="text-align: center; padding: 40px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-600);"></i>
      <p style="margin-top: 12px; color: var(--text-muted); font-size: 0.95rem;">Memuat data kartu peserta...</p>
    </div>
  `);

  try {
    const res = await apiRequest(`/api/cards/${regId}`);
    if (!res.success || !res.data) throw new Error('Kartu peserta tidak tersedia atau pendaftaran belum disetujui.');

    const card = res.data;
    currentActiveCardData = card;

    openAppModal(`
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <h3 style="font-size: 1.1rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-id-card"></i> Kartu Peserta Resmi</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn btn-sm btn-success" id="btn-download-card" onclick="downloadParticipantCardJPG()"><i class="fa-solid fa-download"></i> Download</button>
          <button type="button" class="btn btn-sm btn-primary" onclick="printParticipantCard()"><i class="fa-solid fa-print"></i> Cetak Kartu</button>
          <button type="button" onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer; padding-left: 6px;">&times;</button>
        </div>
      </div>
      <div style="display:flex;justify-content:center;overflow:auto;padding-bottom:8px;">
        ${buildSingleCardHTML(card)}
      </div>
    `);
  } catch (err) {
    openAppModal(`
      <div style="text-align: center; padding: 24px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.2rem; color: var(--warning-600); margin-bottom: 12px; display: block;"></i>
        <h4 style="margin-bottom: 8px;">Kartu Belum Tersedia</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${err.message}</p>
        <button class="btn btn-secondary" onclick="closeAppModal()" style="margin-top: 12px;">Tutup</button>
      </div>
    `);
  }
}

function printParticipantCard(card) {
  printSingleCardPopup(card || currentActiveCardData);
}


// ============================================================================
// BENDAHARA MODULE (VERIFIKASI + SCANNER CHECK-IN MOBILE VERTICAL LAYOUT)
// ============================================================================
async function renderBendaharaDashboard() {
  renderBendaharaPaymentsView();
}

async function renderBendaharaPaymentsView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar pembayaran...</div>';

  try {
    const res = await apiRequest('/api/payments/list');
    tableState.bendaharaPayments.data = res.success ? res.payments : [];

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Verifikasi Pembayaran Peserta</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Periksa bukti transfer dan tentukan persetujuan atau penolakan dengan alasan wajib.</p>
      </div>

      <div id="bendahara-payments-table-slot">
        ${renderBendaharaPaymentsTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderBendaharaPaymentsTable() {
  const ts = tableState.bendaharaPayments;
  return renderUniversalTable({
    tableId: 'bendahara-payments-table',
    columns: [
      {
        header: 'Tgl Bayar',
        key: 'createdAt',
        render: p => formatDate(p.createdAt),
      },
      {
        header: 'No. Registrasi',
        sortValue: p => p.registration?.registrationNumber || '',
        render: p => `<code style="font-weight: 800; color: var(--primary-600);">${p.registration?.registrationNumber || '-'}</code>`,
      },
      {
        header: 'Pendaftar / Tim',
        sortValue: p => (p.registration?.individualParticipant?.fullName || p.registration?.team?.teamName || ''),
        render: p => `<strong>${p.registration?.individualParticipant?.fullName || p.registration?.team?.teamName || '-'}</strong><br><small style="color:var(--text-muted);">${p.registration?.user?.email || '-'}</small>`,
      },
      {
        header: 'Cabang Lomba',
        sortValue: p => p.registration?.branch?.name || '',
        render: p => p.registration?.branch?.name || '-',
      },
      {
        header: 'Nominal & Rekening',
        sortValue: p => Number(p.amount) || 0,
        render: p => `<strong>${formatCurrency(p.amount)}</strong><br><small style="color:var(--text-muted);">${p.paymentAccount?.bankName || 'Bank'}</small>`,
      },
      {
        header: 'Pengirim',
        sortValue: p => p.senderAccountName || '',
        render: p => `${p.senderBank || '-'} a.n. ${p.senderAccountName || '-'}`,
      },
      {
        header: 'Status',
        key: 'status',
        render: p => getStatusBadge(p.status),
      },
      {
        header: 'Aksi',
        sticky: true,
        sortable: false,
        render: p => `
          <button class="btn btn-sm btn-primary" style="padding: 4px 10px;" onclick="openPaymentVerifyModal('${p.id}', '${p.proofImagePath}', '${p.registration?.registrationNumber}', '${p.registration?.individualParticipant?.fullName || p.registration?.team?.teamName}', ${p.amount}, '${p.status}')">
            <i class="fa-solid fa-eye"></i> Periksa Bukti
          </button>
        `,
      },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: [
      p => p.registration?.registrationNumber,
      p => p.registration?.individualParticipant?.fullName,
      p => p.registration?.team?.teamName,
      p => p.registration?.branch?.name,
      'senderAccountName',
    ],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    filterKey: 'status',
    filterValue: ts.filterVal,
    filterOptions: [
      { label: 'Semua Status Pembayaran', value: '' },
      { label: 'Menunggu Verifikasi', value: 'WAITING_VERIFICATION' },
      { label: 'Disetujui (Approved)', value: 'APPROVED' },
      { label: 'Ditolak (Rejected)', value: 'PAYMENT_REJECTED' },
    ],
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onBendaharaPageChange',
    onSearchChangeName: 'onBendaharaSearchChange',
    onPageSizeChangeName: 'onBendaharaPageSizeChange',
    onSortChangeName: 'onBendaharaSortChange',
    onFilterChangeName: 'onBendaharaFilterChange',
    exportFilename: 'data_verifikasi_pembayaran',
    onExportName: 'exportBendaharaPaymentsExcel',
    emptyMessage: 'Belum ada data pembayaran masuk.',
  });
}

function exportBendaharaPaymentsExcel() {
  const data = tableState.bendaharaPayments.data || [];
  const cols = [
    { header: 'Tanggal Bayar', exportValue: p => formatDate(p.createdAt) },
    { header: 'Nomor Registrasi', exportValue: p => p.registration?.registrationNumber || '-' },
    { header: 'Nama Pendaftar / Tim', exportValue: p => p.registration?.individualParticipant?.fullName || p.registration?.team?.teamName || '-' },
    { header: 'Email Akun', exportValue: p => p.registration?.user?.email || '-' },
    { header: 'Cabang Lomba', exportValue: p => p.registration?.branch?.name || '-' },
    { header: 'Nominal Transfer', exportValue: p => formatCurrency(p.amount) },
    { header: 'Rekening Tujuan', exportValue: p => p.paymentAccount?.bankName || '-' },
    { header: 'Bank Pengirim', exportValue: p => p.senderBank || '-' },
    { header: 'Nama Pengirim', exportValue: p => p.senderAccountName || '-' },
    { header: 'Status Verifikasi', key: 'status' },
  ];
  exportTableDataToExcel('data_verifikasi_pembayaran_peserta', cols, data);
}

function onBendaharaPageChange(p) { tableState.bendaharaPayments.page = p; updateUniversalTable('bendahara-payments-table-slot', renderBendaharaPaymentsTable); }
function onBendaharaSearchChange(s) { tableState.bendaharaPayments.search = s; tableState.bendaharaPayments.page = 1; updateUniversalTable('bendahara-payments-table-slot', renderBendaharaPaymentsTable); }
function onBendaharaPageSizeChange(z) { tableState.bendaharaPayments.pageSize = z; tableState.bendaharaPayments.page = 1; updateUniversalTable('bendahara-payments-table-slot', renderBendaharaPaymentsTable); }
function onBendaharaSortChange(k) {
  if (tableState.bendaharaPayments.sortKey === k) {
    tableState.bendaharaPayments.sortDir = tableState.bendaharaPayments.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.bendaharaPayments.sortKey = k;
    tableState.bendaharaPayments.sortDir = 'asc';
  }
  updateUniversalTable('bendahara-payments-table-slot', renderBendaharaPaymentsTable);
}
function onBendaharaFilterChange(v) {
  tableState.bendaharaPayments.filterVal = v;
  tableState.bendaharaPayments.page = 1;
  updateUniversalTable('bendahara-payments-table-slot', renderBendaharaPaymentsTable);
}

function openPaymentVerifyModal(paymentId, filename, regNum, participantName, amount, status) {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-file-invoice-dollar"></i> Verifikasi Pembayaran</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Nomor Registrasi:</div>
        <code style="font-size: 1.1rem; font-weight: 800; color: var(--primary-600);">${regNum}</code>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 10px;">Nama Peserta:</div>
        <div style="font-weight: 700; font-size: 1rem;">${participantName}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 10px;">Nominal:</div>
        <div style="font-weight: 800; color: var(--accent-600); font-size: 1.15rem;">${formatCurrency(amount)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 10px;">Status:</div>
        <div>${getStatusBadge(status)}</div>
      </div>

      <div>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Bukti Transfer:</div>
        <div style="background: #0f172a; border-radius: 8px; overflow: hidden; text-align: center; border: 1px solid var(--border-subtle); min-height: 160px; max-height: 220px; display: flex; align-items: center; justify-content: center; padding: 6px;">
          <img src="/api/payments/file/${encodeURIComponent(filename)}?token=${encodeURIComponent(state.token || safeStorage.getItem('lomba_jwt_token') || '')}" alt="Bukti Transfer" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none'; document.getElementById('proof-fallback-link').style.display='block';">
          <div id="proof-fallback-link" style="display: none; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">
            <i class="fa-solid fa-file-image" style="font-size: 2rem; color: var(--primary-500); margin-bottom: 8px;"></i><br>
            File bukti transfer terunggah
          </div>
        </div>
        <a href="/api/payments/file/${encodeURIComponent(filename)}?token=${encodeURIComponent(state.token || safeStorage.getItem('lomba_jwt_token') || '')}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--primary-600); margin-top: 8px; font-weight: 600; text-decoration: none;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Gambar di Tab Baru
        </a>
      </div>
    </div>

    <div id="verify-modal-alert" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 16px;"></div>

    <div style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
      <button class="btn btn-outline-danger" onclick="promptRejectPayment('${paymentId}')"><i class="fa-solid fa-circle-xmark"></i> Tolak Pembayaran</button>
      <button class="btn btn-success" onclick="executeApprovePayment('${paymentId}')"><i class="fa-solid fa-circle-check"></i> Setujui Pembayaran</button>
    </div>
  `);
}

async function executeApprovePayment(paymentId) {
  try {
    const res = await apiRequest(`/api/payments/${paymentId}/approve`, { method: 'POST' });
    if (res.success) {
      alert('Pembayaran berhasil disetujui!');
      closeAppModal();
      renderBendaharaPaymentsView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function promptRejectPayment(paymentId) {
  const reason = prompt('Masukkan alasan penolakan pembayaran (WAJIB diisi):');
  if (reason === null) return;
  if (!reason.trim()) {
    alert('Alasan penolakan WAJIB diisi.');
    return;
  }
  executeRejectPayment(paymentId, reason.trim());
}

async function executeRejectPayment(paymentId, rejectionReason) {
  try {
    const res = await apiRequest(`/api/payments/${paymentId}/reject`, {
      method: 'POST',
      body: { rejectionReason },
    });
    if (res.success) {
      alert('Pembayaran telah ditolak.');
      closeAppModal();
      renderBendaharaPaymentsView();
    }
  } catch (err) {
    alert(err.message);
  }
}

// --- CHECK-IN SCANNER (DESKTOP SIDE-BY-SIDE / MOBILE TOP-DOWN) ---
let currentCameraFacingMode = 'environment'; // Default: Kamera Belakang (Utama)

async function renderCheckInScannerView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Check-In Scanner Hari Lomba</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Pindai QR Code atau masukkan nomor registrasi. Tersedia 2 tahap check-in.</p>
    </div>

    <!-- Stage Selector Tabs -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button id="tab-stage1" onclick="switchCheckInStage(1)" class="btn btn-primary" style="flex:1; padding: 12px; font-weight: 700; border-radius: 10px;">
        <i class="fa-solid fa-door-open"></i> Tahap 1 &mdash; Kedatangan
      </button>
      <button id="tab-stage2" onclick="switchCheckInStage(2)" class="btn btn-secondary" style="flex:1; padding: 12px; font-weight: 700; border-radius: 10px;">
        <i class="fa-solid fa-person-walking-arrow-right"></i> Tahap 2 &mdash; Masuk Arena
      </button>
    </div>
    <div id="checkin-stage-label" style="text-align:center; margin-bottom:14px; font-size:0.85rem; color:var(--text-muted);">
      Mode aktif: <strong style="color:var(--primary-600);">Tahap 1 &ndash; Kedatangan</strong>
    </div>

    <div id="checkin-feed-alert" style="display: none; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 1rem;"></div>

    <!-- Scanner & Live Log Layout -->
    <div class="checkin-layout-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
      
      <!-- SCANNER BOX -->
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 style="font-size: 1.15rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-camera"></i> Kamera Scanner QR</h3>
          
          <!-- Camera Switcher for Mobile / Desktop -->
          <div style="display: inline-flex; background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 2px;">
            <button type="button" id="btn-cam-env" onclick="switchCameraMode('environment')" class="btn btn-sm ${currentCameraFacingMode === 'environment' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 6px;" title="Gunakan Kamera Belakang HP">
              <i class="fa-solid fa-camera"></i> Belakang
            </button>
            <button type="button" id="btn-cam-usr" onclick="switchCameraMode('user')" class="btn btn-sm ${currentCameraFacingMode === 'user' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 6px;" title="Gunakan Kamera Depan HP / Webcam">
              <i class="fa-solid fa-user"></i> Depan
            </button>
          </div>
        </div>

        <div id="html5-qr-reader" style="width: 100%; border-radius: 12px; overflow: hidden; border: 2px solid var(--primary-500); margin-bottom: 16px;"></div>
        
        <form onsubmit="handleManualCheckInSubmit(event)" style="display: flex; gap: 8px;">
          <input type="text" id="manual-reg-input" class="form-control" placeholder="Nomor Registrasi (REG-IND-...)" required style="flex: 1; padding: 10px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Submit</button>
        </form>
      </div>

      <!-- LIVE LOG FEED -->
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.15rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-satellite-dish"></i> Live Check-In Feed</h3>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button style="padding: 6px 10px; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--success-500); color: var(--success-600); background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;" onclick="exportCheckInLogsExcel()" title="Ekspor Log Check-In ke Excel / CSV" onmouseover="this.style.background='var(--success-50)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-file-excel"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="loadLiveCheckInLogs()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
          </div>
        </div>
        <div id="live-checkin-table-slot">
          <div style="text-align: center; padding: 30px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat live log...</div>
        </div>
      </div>

    </div>
  `;

  // Store current stage
  state.checkInStage = 1;
  startCameraScanner();
  loadLiveCheckInLogs();
}

function switchCameraMode(mode) {
  currentCameraFacingMode = mode;
  const btnEnv = document.getElementById('btn-cam-env');
  const btnUsr = document.getElementById('btn-cam-usr');
  if (btnEnv && btnUsr) {
    if (mode === 'environment') {
      btnEnv.className = 'btn btn-sm btn-primary';
      btnUsr.className = 'btn btn-sm btn-secondary';
    } else {
      btnEnv.className = 'btn btn-sm btn-secondary';
      btnUsr.className = 'btn btn-sm btn-primary';
    }
  }
  startCameraScanner();
}

function switchCheckInStage(stage) {
  state.checkInStage = stage;
  const btn1 = document.getElementById('tab-stage1');
  const btn2 = document.getElementById('tab-stage2');
  const label = document.getElementById('checkin-stage-label');
  if (!btn1 || !btn2) return;

  if (stage === 1) {
    btn1.className = 'btn btn-primary'; btn1.style.cssText = 'flex:1;padding:12px;font-weight:700;border-radius:10px;';
    btn2.className = 'btn btn-secondary'; btn2.style.cssText = 'flex:1;padding:12px;font-weight:700;border-radius:10px;';
    if (label) label.innerHTML = 'Mode aktif: <strong style="color:var(--primary-600);">Tahap 1 &ndash; Kedatangan</strong>';
  } else {
    btn2.className = 'btn btn-primary'; btn2.style.cssText = 'flex:1;padding:12px;font-weight:700;border-radius:10px;';
    btn1.className = 'btn btn-secondary'; btn1.style.cssText = 'flex:1;padding:12px;font-weight:700;border-radius:10px;';
    if (label) label.innerHTML = 'Mode aktif: <strong style="color:var(--primary-600);">Tahap 2 &ndash; Masuk Arena Lomba</strong>';
  }

  // Restart scanner for current stage
  startCameraScanner();
}

function startCameraScanner() {
  if (state.scanner) {
    try { state.scanner.clear(); } catch (e) {}
  }

  const stage = state.checkInStage || 1;
  try {
    state.scanner = new Html5QrcodeScanner('html5-qr-reader', {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      rememberLastUsedCamera: true,
      videoConstraints: {
        facingMode: { ideal: currentCameraFacingMode }
      },
    });

    state.scanner.render((decodedText) => {
      executeCheckIn(decodedText, 'QR_SCAN', stage);
    }, () => {});
  } catch (e) {
    console.error('Scanner init error:', e);
  }
}

async function handleManualCheckInSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('manual-reg-input').value.trim();
  if (!code) return;
  const stage = state.checkInStage || 1;
  await executeCheckIn(code, 'MANUAL_CODE', stage);
  document.getElementById('manual-reg-input').value = '';
}


async function executeCheckIn(token, method, stage = 1) {
  const alertEl = document.getElementById('checkin-feed-alert');
  if (!alertEl) return;

  const endpoint = stage === 2 ? '/api/checkin/scan2' : '/api/checkin/scan';
  const stageLabel = stage === 2 ? 'MASUK ARENA' : 'KEDATANGAN';

  try {
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: { token, method },
    });

    if (res.success && res.data) {
      const timeKey = stage === 2 ? res.data.check_in_2_time : res.data.check_in_time;

      // Update alert bar (ringkas)
      alertEl.style.display = 'block';
      alertEl.className = 'alert alert-success';
      alertEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle-check" style="font-size: 1.2rem;"></i>
          <strong>CHECK-IN ${stageLabel} BERHASIL</strong> — ${res.data.participant_name}
        </div>
      `;

      // Tampilkan popup kartu peserta
      openCheckInSuccessPopup(res.data, stage, stageLabel, timeKey);
      loadLiveCheckInLogs();

    } else if (res.already_checked_in) {
      alertEl.style.display = 'block';
      alertEl.className = 'alert alert-danger';
      alertEl.innerHTML = `
        <h4 style="margin-bottom: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> DUPLIKAT — SUDAH CHECK-IN ${stageLabel}!</h4>
        <div>${res.message}</div>
      `;
    } else {
      alertEl.style.display = 'block';
      alertEl.className = 'alert alert-danger';
      alertEl.innerHTML = `<div><i class="fa-solid fa-circle-xmark"></i> ${res.message}</div>`;
    }
  } catch (err) {
    alertEl.style.display = 'block';
    alertEl.className = 'alert alert-danger';
    alertEl.innerHTML = `<div><i class="fa-solid fa-circle-xmark"></i> ${err.message}</div>`;
  }
}

function openCheckInSuccessPopup(data, stage, stageLabel, checkInTime) {
  const isStage2 = stage === 2;
  const stageColor = isStage2 ? '#7c3aed' : '#059669';
  const stageBg = isStage2 ? 'rgba(124,58,237,0.08)' : 'rgba(5,150,105,0.08)';
  const stageBorder = isStage2 ? 'rgba(124,58,237,0.3)' : 'rgba(5,150,105,0.3)';
  const stageIcon = isStage2 ? 'fa-person-walking-arrow-right' : 'fa-door-open';

  // Buat modal khusus check-in (tidak pakai openAppModal supaya tidak bentrok)
  const existing = document.getElementById('checkin-success-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'checkin-success-popup';
  popup.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    padding: 20px; animation: fadeInPopup 0.2s ease;
  `;

  // Tambahkan animasi via style tag jika belum ada
  if (!document.getElementById('checkin-popup-anim')) {
    const style = document.createElement('style');
    style.id = 'checkin-popup-anim';
    style.textContent = `
      @keyframes fadeInPopup { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
      @keyframes bounceCheck { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      #checkin-success-popup .popup-inner { animation: fadeInPopup 0.25s cubic-bezier(.34,1.56,.64,1); }
    `;
    document.head.appendChild(style);
  }

  const timeStr = checkInTime ? new Date(checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
  const dateStr = checkInTime ? new Date(checkInTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  popup.innerHTML = `
    <div class="popup-inner" style="
      background: var(--bg-card);
      border: 1px solid ${stageBorder};
      border-radius: 20px;
      padding: 32px 28px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 4px ${stageBg};
      text-align: center;
      position: relative;
    ">
      <!-- Ikon berhasil -->
      <div style="
        width: 72px; height: 72px; border-radius: 50%;
        background: ${stageBg}; border: 3px solid ${stageColor};
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px; font-size: 2rem; color: ${stageColor};
        animation: bounceCheck 0.5s ease 0.1s;
      ">
        <i class="fa-solid fa-circle-check"></i>
      </div>

      <!-- Status badge -->
      <div style="
        display: inline-flex; align-items: center; gap: 6px;
        background: ${stageBg}; border: 1px solid ${stageBorder};
        color: ${stageColor}; font-size: 0.72rem; font-weight: 800;
        padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.07em;
        text-transform: uppercase; margin-bottom: 14px;
      ">
        <i class="fa-solid ${stageIcon}"></i> CHECK-IN ${stageLabel} BERHASIL
      </div>

      <!-- Nama peserta -->
      <div style="font-size: 1.35rem; font-weight: 900; color: var(--text-heading); line-height: 1.2; margin-bottom: 6px;">
        ${data.participant_name || '-'}
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 18px;">
        ${data.school_name || '-'}
      </div>

      <!-- Info grid -->
      <div style="
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 10px; margin-bottom: 22px;
        text-align: left;
      ">
        <div style="background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
          <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 3px;">Cabang Lomba</div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-heading); line-height: 1.25;">${data.branch_name || '-'}</div>
        </div>
        <div style="background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
          <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 3px;">No. Registrasi</div>
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--primary-600); font-family: monospace; letter-spacing: 0.04em;">${data.registration_number || '-'}</div>
        </div>
        <div style="grid-column: 1 / -1; background: ${stageBg}; border: 1px solid ${stageBorder}; border-radius: 10px; padding: 10px 12px;">
          <div style="font-size: 0.65rem; font-weight: 700; color: ${stageColor}; text-transform: uppercase; margin-bottom: 3px;"><i class="fa-solid fa-clock"></i> Waktu Check-In</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${stageColor};">${timeStr} <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">· ${dateStr}</span></div>
        </div>
      </div>

      <!-- Tombol OK -->
      <button
        type="button"
        onclick="document.getElementById('checkin-success-popup').remove()"
        style="
          width: 100%; padding: 14px;
          background: ${stageColor}; color: #fff;
          border: none; border-radius: 12px;
          font-size: 1rem; font-weight: 800;
          cursor: pointer; letter-spacing: 0.03em;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.15s, transform 0.1s;
        "
        onmouseover="this.style.opacity='0.9'"
        onmouseout="this.style.opacity='1'"
        onmousedown="this.style.transform='scale(0.97)'"
        onmouseup="this.style.transform='scale(1)'"
      >
        <i class="fa-solid fa-check"></i> OK, Lanjutkan Scan
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  // Auto close setelah 12 detik jika tidak diklik
  setTimeout(() => {
    const el = document.getElementById('checkin-success-popup');
    if (el) el.remove();
  }, 12000);

  // Klik luar popup untuk tutup
  popup.addEventListener('click', (e) => {
    if (e.target === popup) popup.remove();
  });
}

async function loadLiveCheckInLogs() {
  const container = document.getElementById('live-checkin-table-slot');
  if (!container) return;

  try {
    const res = await apiRequest('/api/checkin/live-log?limit=100');
    if (res.success && res.data) {
      state.checkInLogs = res.data;

      if (res.data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada riwayat check-in hari ini.</p>';
        return;
      }

      const checkBadge = (val) => val
        ? `<span style="color:var(--success-600);font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${formatDate(val)}</span>`
        : `<span style="color:var(--text-dim);font-size:0.8em;"><i class="fa-solid fa-circle-minus"></i> Belum</span>`;

      container.innerHTML = `
        <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
          <table class="table" style="width: 100%; font-size: 0.82rem;">
            <thead>
              <tr style="background: var(--table-header-bg);">
                <th style="padding: 8px;">No. Reg</th>
                <th style="padding: 8px;">Peserta / Tim</th>
                <th style="padding: 8px;">Cabang</th>
                <th style="padding: 8px;"><i class="fa-solid fa-door-open"></i> Tiba</th>
                <th style="padding: 8px;"><i class="fa-solid fa-person-walking-arrow-right"></i> Masuk Arena</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(log => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 8px;"><code style="font-weight: 800; color: var(--primary-600); font-size:0.8rem;">${log.registration_number}</code></td>
                  <td style="padding: 8px; font-weight: 700;">${log.participant_name}</td>
                  <td style="padding: 8px; color:var(--text-muted);">${log.branch_name}</td>
                  <td style="padding: 8px;">${checkBadge(log.check_in_time)}</td>
                  <td style="padding: 8px;">${checkBadge(log.check_in_2_time)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

function exportCheckInLogsExcel() {
  const data = state.checkInLogs || [];
  if (!data.length) {
    alert('Belum ada data check-in untuk diekspor.');
    return;
  }
  const cols = [
    { header: 'No. Registrasi', exportValue: l => l.registration_number || '-' },
    { header: 'Nama Peserta / Tim', exportValue: l => l.participant_name || '-' },
    { header: 'Cabang Lomba', exportValue: l => l.branch_name || '-' },
    { header: 'Tiba (Tahap 1)', exportValue: l => l.check_in_time ? formatDate(l.check_in_time) : '-' },
    { header: 'Petugas Tahap 1', exportValue: l => l.checked_in_by_name || '-' },
    { header: 'Masuk Arena (Tahap 2)', exportValue: l => l.check_in_2_time ? formatDate(l.check_in_2_time) : 'Belum' },
    { header: 'Petugas Tahap 2', exportValue: l => l.checked_in_2_by_name || '-' },
  ];
  exportTableDataToExcel(`log_checkin_${new Date().toISOString().slice(0,10)}`, cols, data);
}


// ============================================================================
// SUPER ADMIN MODULES (DAFTAR PESERTA + USERS + KATEGORI + CABANG + RESET)
// ============================================================================
async function renderAdminDashboard() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat dashboard analitik admin...</div>';

  try {
    const [usersRes, regRes, branchesRes] = await Promise.all([
      apiRequest('/api/users?perPage=1'),
      apiRequest('/api/registrations?perPage=500'),
      apiRequest('/api/competitions/branches/all'),
    ]);

    const totalUsers = usersRes.pagination?.total || 0;
    const allRegs = (regRes.success && Array.isArray(regRes.registrations)) ? regRes.registrations : [];
    const allBranches = (branchesRes.success && Array.isArray(branchesRes.data)) ? branchesRes.data : [];

    const totalRegs = regRes.pagination?.total || allRegs.length;
    const approvedRegs = allRegs.filter(r => r.status === 'APPROVED');
    const pendingRegs = allRegs.filter(r => r.status === 'WAITING_VERIFICATION');
    const rejectedRegs = allRegs.filter(r => r.status === 'PAYMENT_REJECTED');

    // Calculate confirmed funds from approved registrations
    const totalConfirmedFunds = approvedRegs.reduce((sum, r) => {
      const fee = Number(r.branch?.registrationFee) || 0;
      return sum + fee;
    }, 0);

    // Build branch summary report
    const branchStats = allBranches.map((br, idx) => {
      const branchRegs = allRegs.filter(r => r.branchId === br.id);
      const brApproved = branchRegs.filter(r => r.status === 'APPROVED');
      const brPending = branchRegs.filter(r => r.status === 'WAITING_VERIFICATION');
      const brFunds = brApproved.reduce((sum, r) => sum + (Number(br.registrationFee) || 0), 0);

      return {
        no: idx + 1,
        id: br.id,
        name: br.name,
        categoryName: br.level?.category?.name || '-',
        levelName: br.level?.name || '-',
        participantType: br.participantType,
        fee: Number(br.registrationFee) || 0,
        totalCount: branchRegs.length,
        approvedCount: brApproved.length,
        pendingCount: brPending.length,
        confirmedFunds: brFunds,
        isActive: br.isActive,
      };
    });

    // Sort by total participants descending
    branchStats.sort((a, b) => b.totalCount - a.totalCount || a.name.localeCompare(b.name));
    window.latestBranchStats = branchStats;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Dashboard Super Administrator</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Ringkasan metrik operasional, dana masuk terkonfirmasi, dan rekapitulasi pendaftar per cabang lomba.</p>
      </div>

      <!-- 4 Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 28px;">
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;"><i class="fa-solid fa-users"></i> Total Pengguna</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--primary-600); margin-top: 4px;">${totalUsers}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Akun terdaftar di sistem</div>
        </div>

        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;"><i class="fa-solid fa-clipboard-list"></i> Total Pendaftaran</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-600); margin-top: 4px;">${totalRegs}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Seluruh cabang lomba</div>
        </div>

        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Status Pendaftaran</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--success-600); margin-top: 4px;">${approvedRegs.length} <span style="font-size: 1rem; font-weight: 600; color: var(--text-muted);">Disetujui</span></div>
          <div style="font-size: 0.8rem; color: var(--warning-600); margin-top: 4px; font-weight: 600;">${pendingRegs.length} menunggu verifikasi</div>
        </div>

        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;"><i class="fa-solid fa-money-bill-wave"></i> Uang Pendaftaran Terkonfirmasi</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--success-600); margin-top: 4px;">${formatCurrency(totalConfirmedFunds)}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Dari ${approvedRegs.length} peserta disetujui</div>
        </div>
      </div>

      <!-- Ringkasan Laporan Pendaftar per Cabang Lomba Table -->
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 18px;">
          <div>
            <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-chart-column"></i> Rekapitulasi Pendaftar per Cabang Lomba</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 2px;">Jumlah pendaftar, status kelolosan administrasi, dan perolehan dana per cabang lomba.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-outline-success" onclick="exportAdminBranchStatsExcel()" style="border: 1px solid var(--success-500); color: var(--success-600); background: transparent; padding: 6px 12px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;">
              <i class="fa-solid fa-file-excel"></i> Export Rekap Excel
            </button>
            <a href="#daftar-peserta" class="btn btn-sm btn-primary"><i class="fa-solid fa-list-check"></i> Lihat Seluruh Peserta</a>
          </div>
        </div>

        <div class="table-responsive" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left;">
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700;">No</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700;">Cabang Lomba</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700;">Kategori & Jenjang</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700;">Tipe</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700;">Biaya</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700; text-align: center;">Total Pendaftar</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700; text-align: center;">Disetujui</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700; text-align: center;">Menunggu</th>
                <th style="padding: 12px 10px; color: var(--text-dim); font-weight: 700; text-align: right;">Dana Terkonfirmasi</th>
              </tr>
            </thead>
            <tbody>
              ${branchStats.map((b, i) => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 12px 10px; color: var(--text-muted);">${i + 1}</td>
                  <td style="padding: 12px 10px;"><strong style="color: var(--text-heading);">${b.name}</strong></td>
                  <td style="padding: 12px 10px;"><span class="member-chip" style="font-size: 0.75rem;">${b.categoryName} &rarr; ${b.levelName}</span></td>
                  <td style="padding: 12px 10px;"><span class="badge ${b.participantType === 'INDIVIDUAL' ? 'badge-info' : 'badge-primary'}" style="font-size: 0.7rem;">${b.participantType}</span></td>
                  <td style="padding: 12px 10px; color: var(--text-main);">${formatCurrency(b.fee)}</td>
                  <td style="padding: 12px 10px; text-align: center;"><strong style="font-size: 1.05rem; color: var(--primary-600);">${b.totalCount}</strong></td>
                  <td style="padding: 12px 10px; text-align: center;"><span class="badge badge-success" style="font-size: 0.75rem;">${b.approvedCount}</span></td>
                  <td style="padding: 12px 10px; text-align: center;">${b.pendingCount > 0 ? `<span class="badge badge-warning" style="font-size: 0.75rem;">${b.pendingCount}</span>` : '<span style="color: var(--text-dim);">-</span>'}</td>
                  <td style="padding: 12px 10px; text-align: right; font-weight: 700; color: var(--success-600);">${formatCurrency(b.confirmedFunds)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid var(--border-subtle); background: var(--bg-body); font-weight: 800;">
                <td colspan="5" style="padding: 14px 10px; text-align: right; text-transform: uppercase;">Total Seluruh Cabang:</td>
                <td style="padding: 14px 10px; text-align: center; color: var(--primary-600); font-size: 1.1rem;">${totalRegs}</td>
                <td style="padding: 14px 10px; text-align: center; color: var(--success-600);">${approvedRegs.length}</td>
                <td style="padding: 14px 10px; text-align: center; color: var(--warning-600);">${pendingRegs.length}</td>
                <td style="padding: 14px 10px; text-align: right; color: var(--success-600); font-size: 1.1rem;">${formatCurrency(totalConfirmedFunds)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Quick Admin Navigation -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
          <h4 style="font-size: 1.1rem; color: var(--text-heading); margin-bottom: 6px;"><i class="fa-solid fa-users-gear"></i> Manajemen Pengguna</h4>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 14px;">Kelola hak akses Super Admin, Bendahara, dan Peserta.</p>
          <a href="#users" class="btn btn-sm btn-primary">Buka Manajemen User</a>
        </div>
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
          <h4 style="font-size: 1.1rem; color: var(--text-heading); margin-bottom: 6px;"><i class="fa-solid fa-trophy"></i> Master Kategori & Cabang</h4>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 14px;">Kelola 5 kategori, 9 jenjang, dan 22 cabang lomba.</p>
          <a href="#master-cabang" class="btn btn-sm btn-secondary">Buka Master Lomba</a>
        </div>
        <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
          <h4 style="font-size: 1.1rem; color: var(--text-heading); margin-bottom: 6px;"><i class="fa-solid fa-sliders"></i> Pengaturan Branding</h4>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 14px;">Ubah nama aplikasi, nama singkat, dan deskripsi acara.</p>
          <a href="#branding-settings" class="btn btn-sm btn-secondary">Buka Pengaturan</a>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

// --- ADMIN DAFTAR PESERTA (ALL REGISTRATIONS) ---
async function renderAdminRegistrationsView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar seluruh peserta...</div>';

  try {
    const res = await apiRequest('/api/registrations?perPage=500');
    tableState.adminRegistrations.data = res.success ? res.registrations : [];

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Daftar Seluruh Peserta Lomba</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Data pendaftar resmi di seluruh 22 cabang lomba tingkat nasional.</p>
      </div>

      <div id="admin-registrations-table-slot">
        ${renderAdminRegistrationsTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderAdminRegistrationsTable() {
  const ts = tableState.adminRegistrations;
  return renderUniversalTable({
    tableId: 'admin-registrations-table',
    columns: [
      {
        header: 'No. Registrasi',
        key: 'registrationNumber',
        render: r => `<code style="font-weight: 800; color: var(--primary-600);">${r.registrationNumber}</code>`,
      },
      {
        header: 'Nama Peserta / Tim',
        sortValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.fullName : r.team?.teamName) || '',
        render: r => `<strong>${r.branch.participantType === 'INDIVIDUAL' ? (r.individualParticipant?.fullName || '-') : (r.team?.teamName || '-')}</strong>`,
      },
      {
        header: 'Sekolah',
        sortValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.schoolName : r.team?.schoolName) || '',
        render: r => (r.branch.participantType === 'INDIVIDUAL' ? r.individualParticipant?.schoolName : r.team?.schoolName) || '-',
      },
      {
        header: 'Kategori & Jenjang',
        sortValue: r => `${r.branch?.level?.category?.name} ${r.branch?.level?.name}`,
        render: r => `<span class="member-chip">${r.branch.level.category.name} - ${r.branch.level.name}</span>`,
      },
      {
        header: 'Cabang',
        sortValue: r => r.branch?.name || '',
        render: r => `<strong>${r.branch.name}</strong>`,
      },
      {
        header: 'Status Pembayaran',
        key: 'status',
        render: r => getStatusBadge(r.status),
      },
      {
        header: 'Status Check-In',
        sortValue: r => r.checkIn ? 1 : 0,
        render: r => getCheckInBadge(r.checkIn),
      },
      {
        header: 'Aksi',
        sticky: true,
        sortable: false,
        render: r => {
          let btns = `<a href="#detail/${r.id}" class="btn btn-sm btn-secondary" style="padding: 4px 10px;"><i class="fa-solid fa-eye"></i> Detail</a> `;
          if (r.status === 'APPROVED') {
            btns += `<button type="button" class="btn btn-sm btn-success" style="padding: 4px 10px;" onclick="openParticipantCardModal('${r.id}')" title="Lihat & Cetak Kartu"><i class="fa-solid fa-id-card"></i> Kartu</button>`;
          }
          return `<div style="display: flex; flex-direction: column; gap: 4px;">${btns}</div>`;
        },
      },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: [
      'registrationNumber',
      r => r.branch?.name,
      r => r.individualParticipant?.fullName,
      r => r.team?.teamName,
      r => r.individualParticipant?.schoolName,
      r => r.team?.schoolName,
    ],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    filterKey: 'status',
    filterValue: ts.filterVal,
    filterOptions: [
      { label: 'Semua Status', value: '' },
      { label: 'Disetujui (Approved)', value: 'APPROVED' },
      { label: 'Menunggu Verifikasi', value: 'WAITING_VERIFICATION' },
      { label: 'Ditolak (Rejected)', value: 'PAYMENT_REJECTED' },
    ],
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onAdminRegPageChange',
    onSearchChangeName: 'onAdminRegSearchChange',
    onPageSizeChangeName: 'onAdminRegPageSizeChange',
    onSortChangeName: 'onAdminRegSortChange',
    onFilterChangeName: 'onAdminRegFilterChange',
    exportFilename: 'data_seluruh_peserta_lomba',
    onExportName: 'exportAdminRegistrationsExcel',
    emptyMessage: 'Belum ada pendaftaran masuk.',
  });
}

function exportAdminRegistrationsExcel() {
  const data = tableState.adminRegistrations.data || [];
  if (!data || !data.length) {
    alert('Tidak ada data peserta untuk diekspor.');
    return;
  }

  const cols = [
    { header: 'No.', exportValue: (r, idx) => idx + 1 },
    { header: 'No. Registrasi', key: 'registrationNumber' },
    { header: 'Tanggal Daftar', exportValue: r => formatDate(r.createdAt) },
    { header: 'Status Pembayaran', key: 'status' },
    { header: 'Kategori Lomba', exportValue: r => r.branch?.level?.category?.name || '-' },
    { header: 'Jenjang Lomba', exportValue: r => r.branch?.level?.name || '-' },
    { header: 'Cabang Lomba', exportValue: r => r.branch?.name || '-' },
    { header: 'Tipe Kepesertaan', exportValue: r => (r.branch?.participantType === 'TEAM' ? 'BEREGU / TIM' : 'PERORANGAN') },
    { header: 'Biaya Pendaftaran (Rp)', exportValue: r => r.branch?.registrationFee ? formatCurrency(r.branch.registrationFee) : 'Rp 0' },
    { header: 'Nama Peserta / Tim', exportValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.fullName : r.team?.teamName) || '-' },
    { header: 'Jenis Kelamin (Perorangan)', exportValue: r => r.individualParticipant?.gender || '-' },
    { header: 'Kelas / Jenjang (Perorangan)', exportValue: r => r.individualParticipant?.gradeClass || '-' },
    { header: 'No. WhatsApp Peserta', exportValue: r => r.individualParticipant?.whatsappNumber || '-' },
    { header: 'Asal Sekolah', exportValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.schoolName : r.team?.schoolName) || '-' },
    { header: 'Alamat Sekolah', exportValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.schoolAddress : r.team?.schoolAddress) || '-' },
    { header: 'Nama Guru Pembimbing', exportValue: r => (r.branch?.participantType === 'INDIVIDUAL' ? r.individualParticipant?.mentorName : r.team?.mentorName) || '-' },
    { header: 'Ketua Tim (Beregu)', exportValue: r => r.team?.leaderName || '-' },
    { header: 'Jumlah Anggota Tim', exportValue: r => (r.team?.members ? r.team.members.length : '-') },
    { header: 'Daftar Anggota Tim', exportValue: r => (r.team?.members && r.team.members.length > 0 ? r.team.members.map((m, i) => `${i + 1}. ${m.memberName}`).join('; ') : '-') },
    { header: 'Nama Akun Pendaftar', exportValue: r => r.user?.name || '-' },
    { header: 'Email Akun Pendaftar', exportValue: r => r.user?.email || '-' },
    { header: 'No. HP Akun Pendaftar', exportValue: r => r.user?.phoneNumber || '-' },
    { header: 'Check-In Tahap 1 (Kedatangan)', exportValue: r => (r.checkIn?.stage1CheckedIn ? `SUDAH (${formatDate(r.checkIn.stage1CheckedInAt)})` : 'BELUM') },
    { header: 'Check-In Tahap 2 (Masuk Arena)', exportValue: r => (r.checkIn?.stage2CheckedIn ? `SUDAH (${formatDate(r.checkIn.stage2CheckedInAt)})` : 'BELUM') },
  ];
  exportTableDataToExcel('data_lengkap_seluruh_peserta_lomba', cols, data);
}

function onAdminRegPageChange(p) { tableState.adminRegistrations.page = p; updateUniversalTable('admin-registrations-table-slot', renderAdminRegistrationsTable); }
function onAdminRegSearchChange(s) { tableState.adminRegistrations.search = s; tableState.adminRegistrations.page = 1; updateUniversalTable('admin-registrations-table-slot', renderAdminRegistrationsTable); }
function onAdminRegPageSizeChange(z) { tableState.adminRegistrations.pageSize = z; tableState.adminRegistrations.page = 1; updateUniversalTable('admin-registrations-table-slot', renderAdminRegistrationsTable); }
function onAdminRegSortChange(k) {
  if (tableState.adminRegistrations.sortKey === k) {
    tableState.adminRegistrations.sortDir = tableState.adminRegistrations.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.adminRegistrations.sortKey = k;
    tableState.adminRegistrations.sortDir = 'asc';
  }
  updateUniversalTable('admin-registrations-table-slot', renderAdminRegistrationsTable);
}
function onAdminRegFilterChange(v) {
  tableState.adminRegistrations.filterVal = v;
  tableState.adminRegistrations.page = 1;
  updateUniversalTable('admin-registrations-table-slot', renderAdminRegistrationsTable);
}

// --- ADMIN USER MANAGEMENT (UNIVERSAL TABLE + DROPDOWN ACTIONS + BULK DELETE) ---
const selectedAdminUserIds = new Set();

function escapeQuotes(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function toggleUserDropdown(e, userId) {
  if (e) e.stopPropagation();
  const menu = document.getElementById(`user-dd-${userId}`);
  const isShown = menu && menu.style.display === 'block';
  closeAllUserDropdowns();
  if (menu && !isShown) {
    menu.style.display = 'block';
  }
}

function closeAllUserDropdowns() {
  document.querySelectorAll('.user-dropdown-menu').forEach(el => {
    el.style.display = 'none';
  });
}

document.addEventListener('click', () => {
  closeAllUserDropdowns();
});

async function renderAdminUsersView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data user...</div>';

  try {
    const res = await apiRequest('/api/users?perPage=500');
    tableState.adminUsers.data = res.success ? res.users : [];
    selectedAdminUserIds.clear();

    container.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Manajemen Pengguna</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Kelola akun pendaftar & staf, hak akses, reset password, dan hapus pengguna.</p>
        </div>
        <button class="btn btn-primary" onclick="openCreateUserModal()"><i class="fa-solid fa-user-plus"></i> Tambah Pengguna</button>
      </div>

      <!-- Bulk Action Bar -->
      <div id="admin-user-bulk-actions" style="margin-bottom: 14px; display: none; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); padding: 10px 16px; border-radius: var(--radius-md);">
        <div style="font-size: 0.875rem; font-weight: 700; color: var(--danger-600); display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-check-double"></i> <span id="user-selected-count">0</span> Pengguna Terpilih
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-sm btn-danger" onclick="executeBulkDeleteUsers()" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
            <i class="fa-solid fa-trash"></i> Hapus Terpilih
          </button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="clearSelectedUsers()">
            <i class="fa-solid fa-xmark"></i> Batal
          </button>
        </div>
      </div>

      <div id="admin-users-table-slot">
        ${renderAdminUsersTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderAdminUsersTable() {
  const ts = tableState.adminUsers;
  const currentAdmin = state.user;

  return renderUniversalTable({
    tableId: 'admin-users-table',
    columns: [
      {
        header: `<input type="checkbox" id="user-check-all" onchange="toggleSelectAllUsers(this.checked)" style="-webkit-appearance:checkbox !important; appearance:checkbox !important; width:18px; height:18px; cursor:pointer; accent-color:var(--primary-600); margin:0;" title="Pilih Semua">`,
        sortable: false,
        render: u => {
          const isSelf = currentAdmin && currentAdmin.id === u.id;
          if (isSelf) return `<span title="Akun Anda Sendiri" style="font-size:0.75rem; color:var(--text-dim); display:inline-block; width:18px; text-align:center;"><i class="fa-solid fa-lock"></i></span>`;
          const checked = selectedAdminUserIds.has(u.id) ? 'checked' : '';
          return `<input type="checkbox" class="user-row-check" value="${u.id}" ${checked} onchange="toggleUserSelect('${u.id}', this.checked)" style="-webkit-appearance:checkbox !important; appearance:checkbox !important; width:18px; height:18px; cursor:pointer; accent-color:var(--primary-600); margin:0;">`;
        },
      },
      { header: 'Nama Lengkap', key: 'name', render: u => `<strong>${u.name}</strong>` },
      { header: 'Email', key: 'email' },
      { header: 'No. WhatsApp', sortValue: u => u.phoneNumber || '', render: u => u.phoneNumber || '-' },
      { header: 'Role', key: 'role', render: u => `<span class="role-badge-pill role-${u.role}">${u.role}</span>` },
      { header: 'Status', sortValue: u => u.isActive ? 1 : 0, render: u => `<span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">${u.isActive ? 'AKTIF' : 'NONAKTIF'}</span>` },
      { header: 'Tgl Daftar', key: 'createdAt', render: u => formatDate(u.createdAt) },
      {
        header: 'Aksi',
        sticky: true,
        sortable: false,
        render: u => {
          const isSelf = currentAdmin && currentAdmin.id === u.id;
          return `
            <div class="dropdown" style="position: relative; display: inline-block;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="toggleUserDropdown(event, '${u.id}')" style="padding: 5px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; cursor: pointer;">
                Aksi <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
              </button>
              <div id="user-dd-${u.id}" class="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 4px); min-width: 175px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 5px 0; text-align: left;">
                <a href="javascript:void(0)" onclick="executeToggleUserStatus('${u.id}'); closeAllUserDropdowns();" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 0.82rem; color: var(--text-main); text-decoration: none;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                  <i class="fa-solid ${u.isActive ? 'fa-user-slash' : 'fa-user-check'}" style="width: 16px; color: ${u.isActive ? 'var(--warning-600)' : 'var(--success-600)'};"></i> ${u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </a>
                <a href="javascript:void(0)" onclick="openChangeRoleModal('${u.id}', '${escapeQuotes(u.name)}', '${u.role}'); closeAllUserDropdowns();" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 0.82rem; color: var(--text-main); text-decoration: none;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                  <i class="fa-solid fa-user-tag" style="width: 16px; color: var(--primary-600);"></i> Ubah Role
                </a>
                <a href="javascript:void(0)" onclick="openResetPasswordModal('${u.id}', '${escapeQuotes(u.name)}', '${u.email}'); closeAllUserDropdowns();" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 0.82rem; color: var(--text-main); text-decoration: none;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                  <i class="fa-solid fa-key" style="width: 16px; color: var(--warning-600);"></i> Reset Password
                </a>
                ${!isSelf ? `
                <div style="border-top: 1px solid var(--border-subtle); margin: 4px 0;"></div>
                <a href="javascript:void(0)" onclick="confirmDeleteUser('${u.id}', '${escapeQuotes(u.name)}', '${u.email}'); closeAllUserDropdowns();" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 0.82rem; color: var(--danger-600); text-decoration: none; font-weight: 600;" onmouseover="this.style.background='rgba(239,68,68,0.08)'" onmouseout="this.style.background='transparent'">
                  <i class="fa-solid fa-trash" style="width: 16px; color: var(--danger-600);"></i> Hapus Pengguna
                </a>
                ` : ''}
              </div>
            </div>
          `;
        },
      },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: ['name', 'email', 'phoneNumber', 'role'],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    filterKey: 'role',
    filterValue: ts.filterVal,
    filterOptions: [
      { label: 'Semua Role Pengguna', value: '' },
      { label: 'Super Admin', value: 'SUPER_ADMIN' },
      { label: 'Bendahara', value: 'BENDAHARA' },
      { label: 'Admin Scanner', value: 'ADMIN_BARCODE' },
      { label: 'Peserta', value: 'PESERTA' },
    ],
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onAdminUserPageChange',
    onSearchChangeName: 'onAdminUserSearchChange',
    onPageSizeChangeName: 'onAdminUserPageSizeChange',
    onSortChangeName: 'onAdminUserSortChange',
    onFilterChangeName: 'onAdminUserFilterChange',
    exportFilename: 'data_pengguna_sistem',
    onExportName: 'exportAdminUsersExcel',
    emptyMessage: 'Pengguna tidak ditemukan.',
  });
}

function toggleUserSelect(userId, checked) {
  if (checked) {
    selectedAdminUserIds.add(userId);
  } else {
    selectedAdminUserIds.delete(userId);
  }
  updateUserBulkActionBar();
}

function toggleSelectAllUsers(checked) {
  const ts = tableState.adminUsers;
  const currentAdmin = state.user;
  const filtered = (ts.data || []).filter(u => !currentAdmin || u.id !== currentAdmin.id);

  if (checked) {
    filtered.forEach(u => selectedAdminUserIds.add(u.id));
  } else {
    selectedAdminUserIds.clear();
  }
  updateUniversalTable('admin-users-table-slot', renderAdminUsersTable);
  updateUserBulkActionBar();
}

function clearSelectedUsers() {
  selectedAdminUserIds.clear();
  updateUniversalTable('admin-users-table-slot', renderAdminUsersTable);
  updateUserBulkActionBar();
}

function updateUserBulkActionBar() {
  const bar = document.getElementById('admin-user-bulk-actions');
  const countEl = document.getElementById('user-selected-count');
  if (bar) {
    bar.style.display = selectedAdminUserIds.size > 0 ? 'flex' : 'none';
  }
  if (countEl) {
    countEl.innerText = selectedAdminUserIds.size;
  }
}

function confirmDeleteUser(userId, name, email) {
  openAppModal(`
    <div style="text-align: center; padding: 10px 0;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 16px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading); margin-bottom: 8px;">Konfirmasi Hapus Pengguna</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 18px; line-height: 1.5;">
        Apakah Anda yakin ingin menghapus pengguna <strong>${name}</strong> (<code>${email}</code>)?<br>
        <span style="color: #dc2626; font-size: 0.8rem; font-weight: 600;">Peringatan: Seluruh data pendaftaran dan riwayat terkait pengguna ini juga akan dihapus permanen.</span>
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button type="button" class="btn btn-secondary" onclick="closeAppModal()" style="padding: 9px 20px;">Batal</button>
        <button type="button" class="btn btn-danger" onclick="executeDeleteUser('${userId}')" style="padding: 9px 20px; font-weight: 700;">
          <i class="fa-solid fa-trash"></i> Ya, Hapus Sekarang
        </button>
      </div>
    </div>
  `);
}

async function executeDeleteUser(userId) {
  try {
    closeAppModal();
    const res = await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      selectedAdminUserIds.delete(userId);
      renderAdminUsersView();
    }
  } catch (err) {
    alert('Gagal menghapus pengguna: ' + err.message);
  }
}

function executeBulkDeleteUsers() {
  const count = selectedAdminUserIds.size;
  if (count === 0) return;

  openAppModal(`
    <div style="text-align: center; padding: 10px 0;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 16px;">
        <i class="fa-solid fa-trash-can"></i>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading); margin-bottom: 8px;">Hapus Massal Pengguna</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 18px; line-height: 1.5;">
        Anda akan menghapus <strong>${count} pengguna terpilih</strong> sekaligus secara permanen.<br>
        <span style="color: #dc2626; font-size: 0.8rem; font-weight: 600;">Tindakan ini tidak dapat dibatalkan!</span>
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button type="button" class="btn btn-secondary" onclick="closeAppModal()" style="padding: 9px 20px;">Batal</button>
        <button type="button" class="btn btn-danger" onclick="submitBulkDeleteUsers()" style="padding: 9px 20px; font-weight: 700;">
          <i class="fa-solid fa-trash"></i> Hapus ${count} Pengguna
        </button>
      </div>
    </div>
  `);
}

async function submitBulkDeleteUsers() {
  try {
    closeAppModal();
    const userIds = Array.from(selectedAdminUserIds);
    const res = await apiRequest('/api/users/bulk-delete', {
      method: 'POST',
      body: { userIds },
    });
    if (res.success) {
      alert(res.message);
      selectedAdminUserIds.clear();
      renderAdminUsersView();
    }
  } catch (err) {
    alert('Gagal menghapus massal: ' + err.message);
  }
}

function exportAdminUsersExcel() {
  const data = tableState.adminUsers.data || [];
  const cols = [
    { header: 'Nama Lengkap', key: 'name' },
    { header: 'Email Akun', key: 'email' },
    { header: 'No. WhatsApp', exportValue: u => u.phoneNumber || '-' },
    { header: 'Role Pengguna', key: 'role' },
    { header: 'Status Akun', exportValue: u => u.isActive ? 'AKTIF' : 'NONAKTIF' },
    { header: 'Tanggal Dibuat', exportValue: u => formatDate(u.createdAt) },
  ];
  exportTableDataToExcel('data_pengguna_sistem', cols, data);
}

function onAdminUserPageChange(p) { tableState.adminUsers.page = p; updateUniversalTable('admin-users-table-slot', renderAdminUsersTable); }
function onAdminUserSearchChange(s) { tableState.adminUsers.search = s; tableState.adminUsers.page = 1; updateUniversalTable('admin-users-table-slot', renderAdminUsersTable); }
function onAdminUserPageSizeChange(z) { tableState.adminUsers.pageSize = z; tableState.adminUsers.page = 1; updateUniversalTable('admin-users-table-slot', renderAdminUsersTable); }
function onAdminUserSortChange(k) {
  if (tableState.adminUsers.sortKey === k) {
    tableState.adminUsers.sortDir = tableState.adminUsers.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.adminUsers.sortKey = k;
    tableState.adminUsers.sortDir = 'asc';
  }
  updateUniversalTable('admin-users-table-slot', renderAdminUsersTable);
}
function onAdminUserFilterChange(v) {
  tableState.adminUsers.filterVal = v;
  tableState.adminUsers.page = 1;
  updateUniversalTable('admin-users-table-slot', renderAdminUsersTable);
}

function openCreateUserModal() {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-user-plus"></i> Tambah Pengguna Baru</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitCreateUser(event)">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Lengkap</label>
        <input type="text" id="usr-name-input" class="form-control" placeholder="Nama Lengkap" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Email</label>
        <input type="email" id="usr-email-input" class="form-control" placeholder="nama@email.com" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nomor WhatsApp</label>
        <input type="text" id="usr-phone-input" class="form-control" placeholder="08123456789" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Password Awal (Min. 6 Karakter)</label>
        <input type="password" id="usr-pass-input" class="form-control" placeholder="••••••••" required minlength="6" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 18px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Role Akses</label>
        <select id="usr-role-input" class="form-select" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          <option value="PESERTA">PESERTA (Pendaftar)</option>
          <option value="BENDAHARA">BENDAHARA</option>
          <option value="ADMIN_BARCODE">ADMIN SCANNER (BARCODE)</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Pengguna Baru</button>
    </form>
  `);
}

async function submitCreateUser(e) {
  e.preventDefault();
  try {
    const res = await apiRequest('/api/users', {
      method: 'POST',
      body: {
        name: document.getElementById('usr-name-input').value,
        email: document.getElementById('usr-email-input').value,
        phoneNumber: document.getElementById('usr-phone-input').value,
        password: document.getElementById('usr-pass-input').value,
        role: document.getElementById('usr-role-input').value,
      },
    });
    if (res.success) {
      alert(res.message);
      closeAppModal();
      renderAdminUsersView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeToggleUserStatus(userId) {
  try {
    const res = await apiRequest(`/api/users/${userId}/toggle-status`, { method: 'PATCH' });
    if (res.success) {
      alert(res.message);
      renderAdminUsersView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openChangeRoleModal(userId, name, currentRole) {
  openAppModal(`
    <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 12px;"><i class="fa-solid fa-user-tag"></i> Ubah Role Pengguna</h3>
    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 16px;">Pengguna: <strong>${name}</strong></p>
    <div class="form-group" style="margin-bottom: 16px;">
      <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Pilih Role Baru</label>
      <select id="modal-new-role" class="form-select" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        <option value="PESERTA" ${currentRole === 'PESERTA' ? 'selected' : ''}>PESERTA</option>
        <option value="BENDAHARA" ${currentRole === 'BENDAHARA' ? 'selected' : ''}>BENDAHARA</option>
        <option value="ADMIN_BARCODE" ${currentRole === 'ADMIN_BARCODE' ? 'selected' : ''}>ADMIN SCANNER (BARCODE)</option>
        <option value="SUPER_ADMIN" ${currentRole === 'SUPER_ADMIN' ? 'selected' : ''}>SUPER_ADMIN</option>
      </select>
    </div>
    <button class="btn btn-primary" style="width: 100%;" onclick="submitChangeRole('${userId}')">Simpan Perubahan Role</button>
  `);
}

async function submitChangeRole(userId) {
  const role = document.getElementById('modal-new-role').value;
  try {
    const res = await apiRequest(`/api/users/${userId}/role`, { method: 'PATCH', body: { role } });
    if (res.success) {
      alert(res.message);
      closeAppModal();
      renderAdminUsersView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openResetPasswordModal(userId, name, email) {
  openAppModal(`
    <h3 style="font-size: 1.2rem; color: var(--text-heading); margin-bottom: 12px;"><i class="fa-solid fa-key"></i> Reset Password Pengguna</h3>
    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 16px;">Akun: <strong>${name} (${email})</strong></p>
    <div class="form-group" style="margin-bottom: 16px;">
      <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Password Baru (Min. 6 Karakter)</label>
      <input type="password" id="modal-reset-pass" class="form-control" placeholder="••••••••" required minlength="6" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
    </div>
    <button class="btn btn-warning" style="width: 100%;" onclick="submitAdminResetPass('${userId}')">Tetapkan Password Baru</button>
  `);
}

async function submitAdminResetPass(userId) {
  const newPassword = document.getElementById('modal-reset-pass').value;
  if (!newPassword || newPassword.length < 6) {
    alert('Password minimal 6 karakter.');
    return;
  }
  try {
    const res = await apiRequest(`/api/users/${userId}/reset-password`, { method: 'POST', body: { newPassword } });
    if (res.success) {
      alert(res.message);
      closeAppModal();
    }
  } catch (err) {
    alert(err.message);
  }
}

// --- MASTER KATEGORI & JENJANG ---
async function renderAdminCategoriesView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat master kategori...</div>';

  try {
    const res = await apiRequest('/api/competitions/categories');
    const categories = res.success ? res.data : [];

    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Master Kategori & Jenjang</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Kelola kategori lomba utama dan jenjang pendidikan terkait.</p>
        </div>
        <button class="btn btn-primary" onclick="openCreateCategoryModal()"><i class="fa-solid fa-plus"></i> Tambah Kategori</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        ${categories.map(cat => `
          <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 22px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <h3 style="font-size: 1.2rem; color: var(--text-heading); margin: 0;">${cat.name}</h3>
                <span class="badge ${cat.isActive ? 'badge-success' : 'badge-danger'}">${cat.isActive ? 'AKTIF' : 'NONAKTIF'}</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 14px;">${cat.description || '-'}</p>
              
              <div style="background: var(--bg-body); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Jenjang Terdaftar:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${(cat.levels || []).length === 0 ? '<span style="font-size: 0.8rem; color: var(--text-muted);">Belum ada jenjang</span>' : (cat.levels || []).map(l => `
                    <span class="member-chip" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; font-size: 0.8rem;">
                      <strong>${l.name}</strong> (${l.branches?.length || 0} cabang)
                      <i class="fa-solid fa-pen" style="cursor: pointer; opacity: 0.7; font-size: 0.75rem;" title="Edit Jenjang" onclick="openEditLevelModal('${l.id}', '${l.name.replace(/'/g, "\\'")}', '${l.slug}')"></i>
                      <i class="fa-solid fa-trash-can" style="cursor: pointer; opacity: 0.7; font-size: 0.75rem; color: var(--danger-500);" title="Hapus Jenjang" onclick="executeDeleteLevel('${l.id}', '${l.name.replace(/'/g, "\\'")}')"></i>
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
              <button class="btn btn-sm btn-secondary" onclick="openCreateLevelModal('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')"><i class="fa-solid fa-plus"></i> Tambah Jenjang</button>
              <button class="btn btn-sm btn-secondary" onclick="openEditCategoryModal('${cat.id}', '${cat.name.replace(/'/g, "\\'")}', '${cat.slug}', '${(cat.description || '').replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-sm ${cat.isActive ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="toggleCatStatus('${cat.id}')">${cat.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
              <button class="btn btn-sm btn-danger" style="padding: 4px 8px;" title="Hapus Kategori" onclick="executeDeleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function openCreateCategoryModal() {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-plus"></i> Tambah Kategori Lomba</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitCreateCategory(event)">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Kategori</label>
        <input type="text" id="cat-name-input" class="form-control" placeholder="Contoh: Seni & Budaya" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Slug (URL Friendly)</label>
        <input type="text" id="cat-slug-input" class="form-control" placeholder="Contoh: seni-budaya" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Deskripsi</label>
        <textarea id="cat-desc-input" class="form-control" rows="2" placeholder="Deskripsi kategori lomba" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);"></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Kategori</button>
    </form>
  `);
}

async function submitCreateCategory(e) {
  e.preventDefault();
  try {
    const res = await apiRequest('/api/competitions/categories', {
      method: 'POST',
      body: {
        name: document.getElementById('cat-name-input').value,
        slug: document.getElementById('cat-slug-input').value,
        description: document.getElementById('cat-desc-input').value,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openEditCategoryModal(catId, name, slug, description) {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-pen-to-square"></i> Edit Kategori Lomba</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitEditCategory(event, '${catId}')">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Kategori</label>
        <input type="text" id="edit-cat-name-input" class="form-control" value="${name}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Slug</label>
        <input type="text" id="edit-cat-slug-input" class="form-control" value="${slug}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Deskripsi</label>
        <textarea id="edit-cat-desc-input" class="form-control" rows="2" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">${description}</textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Perubahan Kategori</button>
    </form>
  `);
}

async function submitEditCategory(e, catId) {
  e.preventDefault();
  try {
    const res = await apiRequest(`/api/competitions/categories/${catId}`, {
      method: 'PATCH',
      body: {
        name: document.getElementById('edit-cat-name-input').value,
        slug: document.getElementById('edit-cat-slug-input').value,
        description: document.getElementById('edit-cat-desc-input').value,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeDeleteCategory(catId, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;
  try {
    const res = await apiRequest(`/api/competitions/categories/${catId}`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openCreateLevelModal(categoryId, categoryName) {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-plus"></i> Tambah Jenjang (${categoryName})</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitCreateLevel(event, '${categoryId}')">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Pilih Jenjang Standar</label>
        <select id="lvl-preset-select" class="form-select" onchange="onJenjangPresetChange(this)" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          <option value="">-- Pilih dari Daftar Jenjang Populer --</option>
          <option value="TK / RA" data-slug="tk-ra">TK / RA</option>
          <option value="SD / MI" data-slug="sd-mi">SD / MI</option>
          <option value="SMP / MTs" data-slug="smp-mts">SMP / MTs</option>
          <option value="SMA / MA" data-slug="sma-ma">SMA / MA</option>
          <option value="SMA / MA / SMK" data-slug="sma-ma-smk">SMA / MA / SMK</option>
          <option value="Perguruan Tinggi / Mahasiswa" data-slug="perguruan-tinggi">Perguruan Tinggi / Mahasiswa</option>
          <option value="Umum" data-slug="umum">Umum</option>
          <option value="Kategori A (Kelas 1 - 3 SD)" data-slug="kategori-a-sd">Kategori A (Kelas 1 - 3 SD)</option>
          <option value="Kategori B (Kelas 4 - 6 SD)" data-slug="kategori-b-sd">Kategori B (Kelas 4 - 6 SD)</option>
          <option value="Kategori C (SMP/MTs)" data-slug="kategori-c-smp">Kategori C (SMP/MTs)</option>
          <option value="Kategori D (SMA/MA)" data-slug="kategori-d-sma">Kategori D (SMA/MA)</option>
          <option value="__CUSTOM__">Lainnya / Ketik Manual Sendiri</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Jenjang</label>
        <input type="text" id="lvl-name-input" class="form-control" placeholder="Contoh: SMA/MA" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);" oninput="document.getElementById('lvl-slug-input').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Slug (URL Friendly)</label>
        <input type="text" id="lvl-slug-input" class="form-control" placeholder="Contoh: sma-ma" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Jenjang</button>
    </form>
  `);
}

function onJenjangPresetChange(selectEl) {
  const val = selectEl.value;
  const nameInput = document.getElementById('lvl-name-input');
  const slugInput = document.getElementById('lvl-slug-input');
  if (val && val !== '__CUSTOM__') {
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    const slug = selectedOpt.getAttribute('data-slug') || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    nameInput.value = val;
    slugInput.value = slug;
  } else if (val === '__CUSTOM__') {
    nameInput.value = '';
    slugInput.value = '';
    nameInput.focus();
  }
}

async function submitCreateLevel(e, categoryId) {
  e.preventDefault();
  try {
    const res = await apiRequest('/api/competitions/levels', {
      method: 'POST',
      body: {
        categoryId,
        name: document.getElementById('lvl-name-input').value,
        slug: document.getElementById('lvl-slug-input').value,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openEditLevelModal(lvlId, name, slug) {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-pen-to-square"></i> Edit Jenjang</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitEditLevel(event, '${lvlId}')">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Jenjang</label>
        <input type="text" id="edit-lvl-name-input" class="form-control" value="${name}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Slug</label>
        <input type="text" id="edit-lvl-slug-input" class="form-control" value="${slug}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Perubahan Jenjang</button>
    </form>
  `);
}

async function submitEditLevel(e, lvlId) {
  e.preventDefault();
  try {
    const res = await apiRequest(`/api/competitions/levels/${lvlId}`, {
      method: 'PATCH',
      body: {
        name: document.getElementById('edit-lvl-name-input').value,
        slug: document.getElementById('edit-lvl-slug-input').value,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeDeleteLevel(lvlId, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus jenjang "${name}"?`)) return;
  try {
    const res = await apiRequest(`/api/competitions/levels/${lvlId}`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function toggleCatStatus(catId) {
  try {
    const res = await apiRequest(`/api/competitions/categories/${catId}/toggle`, { method: 'PATCH' });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      renderAdminCategoriesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

// --- MASTER CABANG LOMBA & BIAYA ---
async function renderAdminBranchesView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat cabang lomba...</div>';

  try {
    const res = await apiRequest('/api/competitions/branches/all');
    const branches = (res.success && res.data) ? res.data.map(b => ({
      ...b,
      categoryName: b.level?.category?.name || '-',
      levelName: b.level?.name || '-',
    })) : [];

    tableState.adminBranches.data = branches;

    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Master Cabang Lomba & Biaya</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Kelola seluruh 22 cabang lomba, tipe kepesertaan, biaya pendaftaran, dan kuota tim.</p>
        </div>
        <button class="btn btn-primary" onclick="openCreateBranchModal()"><i class="fa-solid fa-plus"></i> Tambah Cabang Lomba</button>
      </div>

      <div id="admin-branches-table-slot">
        ${renderAdminBranchesTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderAdminBranchesTable() {
  const ts = tableState.adminBranches;
  return renderUniversalTable({
    tableId: 'admin-branches-table',
    columns: [
      { header: 'Kategori', key: 'categoryName' },
      { header: 'Jenjang', key: 'levelName' },
      { header: 'Nama Cabang', key: 'name', render: b => `<strong>${b.name}</strong>` },
      { header: 'Tipe', key: 'participantType', render: b => `<span class="badge ${b.participantType === 'INDIVIDUAL' ? 'badge-info' : 'badge-primary'}">${b.participantType}</span>` },
      { header: 'Biaya', sortValue: b => Number(b.registrationFee) || 0, render: b => `<strong>${formatCurrency(b.registrationFee)}</strong>` },
      { header: 'Kuota Anggota Tim', sortValue: b => b.maxTeamMembers || 1, render: b => b.participantType === 'TEAM' ? `${b.minTeamMembers} - ${b.maxTeamMembers} Orang` : '1 Orang (Individu)' },
      { header: 'Status', sortValue: b => b.isActive ? 1 : 0, render: b => `<span class="badge ${b.isActive ? 'badge-success' : 'badge-danger'}">${b.isActive ? 'AKTIF' : 'NONAKTIF'}</span>` },
      {
        header: 'Aksi',
        sticky: true,
        sortable: false,
        render: b => `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="btn btn-sm btn-secondary" style="padding: 4px 8px;" title="Edit Cabang" onclick="openEditBranchModal('${b.id}', '${b.name.replace(/'/g, "\\'")}', ${b.registrationFee}, '${b.participantType}', ${b.minTeamMembers || 1}, ${b.maxTeamMembers || 1}, '${(b.description || '').replace(/'/g, "\\'")}', '${(b.juknisUrl || '').replace(/'/g, "\\'")}', ${b.maxRegistrants || 0})">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-sm btn-secondary" style="padding: 4px 8px;" title="Toggle Status" onclick="toggleBranchStatus('${b.id}')">
              ${b.isActive ? '<i class="fa-solid fa-ban"></i>' : '<i class="fa-solid fa-check"></i>'}
            </button>
            <button class="btn btn-sm btn-danger" style="padding: 4px 8px;" title="Hapus Cabang" onclick="executeDeleteBranch('${b.id}', '${b.name.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `,
      },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: ['name', 'categoryName', 'levelName', 'participantType'],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    filterKey: 'participantType',
    filterValue: ts.filterVal,
    filterOptions: [
      { label: 'Semua Tipe Kepesertaan', value: '' },
      { label: 'Perorangan (INDIVIDUAL)', value: 'INDIVIDUAL' },
      { label: 'Beregu (TEAM)', value: 'TEAM' },
    ],
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onAdminBranchPageChange',
    onSearchChangeName: 'onAdminBranchSearchChange',
    onPageSizeChangeName: 'onAdminBranchPageSizeChange',
    onSortChangeName: 'onAdminBranchSortChange',
    onFilterChangeName: 'onAdminBranchFilterChange',
    exportFilename: 'master_cabang_lomba_biaya',
    onExportName: 'exportAdminBranchesExcel',
    emptyMessage: 'Cabang lomba tidak ditemukan.',
  });
}

function exportAdminBranchesExcel() {
  const data = tableState.adminBranches.data || [];
  const cols = [
    { header: 'Kategori', key: 'categoryName' },
    { header: 'Jenjang', key: 'levelName' },
    { header: 'Nama Cabang Lomba', key: 'name' },
    { header: 'Tipe Kepesertaan', key: 'participantType' },
    { header: 'Biaya Pendaftaran', exportValue: b => formatCurrency(b.registrationFee) },
    { header: 'Min Anggota Tim', exportValue: b => b.participantType === 'TEAM' ? b.minTeamMembers : 1 },
    { header: 'Max Anggota Tim', exportValue: b => b.participantType === 'TEAM' ? b.maxTeamMembers : 1 },
    { header: 'Status Cabang', exportValue: b => b.isActive ? 'AKTIF' : 'NONAKTIF' },
  ];
  exportTableDataToExcel('master_cabang_lomba_biaya', cols, data);
}

function onAdminBranchPageChange(p) { tableState.adminBranches.page = p; updateUniversalTable('admin-branches-table-slot', renderAdminBranchesTable); }
function onAdminBranchSearchChange(s) { tableState.adminBranches.search = s; tableState.adminBranches.page = 1; updateUniversalTable('admin-branches-table-slot', renderAdminBranchesTable); }
function onAdminBranchPageSizeChange(z) { tableState.adminBranches.pageSize = z; tableState.adminBranches.page = 1; updateUniversalTable('admin-branches-table-slot', renderAdminBranchesTable); }
function onAdminBranchSortChange(k) {
  if (tableState.adminBranches.sortKey === k) {
    tableState.adminBranches.sortDir = tableState.adminBranches.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.adminBranches.sortKey = k;
    tableState.adminBranches.sortDir = 'asc';
  }
  updateUniversalTable('admin-branches-table-slot', renderAdminBranchesTable);
}
function onAdminBranchFilterChange(v) {
  tableState.adminBranches.filterVal = v;
  tableState.adminBranches.page = 1;
  updateUniversalTable('admin-branches-table-slot', renderAdminBranchesTable);
}

async function openCreateBranchModal() {
  const levelsRes = await apiRequest('/api/competitions/levels/all');
  const levels = (levelsRes && levelsRes.success && Array.isArray(levelsRes.data)) ? levelsRes.data : [];

  const levelOptions = levels.map(l => `<option value="${l.id}">${l.category?.name || 'Kategori'} &rarr; ${l.name}</option>`);

  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-plus"></i> Tambah Cabang Lomba</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitCreateBranch(event)">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Pilih Jenjang</label>
        <select id="br-level-select" class="form-select" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          ${levelOptions.join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Cabang Lomba</label>
        <input type="text" id="br-name-input" class="form-control" placeholder="Contoh: Tahfidz Al-Qur'an 5 Juz" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Tipe Kepesertaan</label>
          <select id="br-type-select" class="form-select" onchange="toggleBranchTeamFields(this.value)" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            <option value="INDIVIDUAL">INDIVIDUAL (Perorangan)</option>
            <option value="TEAM">TEAM (Beregu)</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Biaya Pendaftaran (Rp)</label>
          <input type="number" id="br-fee-input" class="form-control" value="150000" min="0" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
      <div id="br-team-quota-box" style="display: none; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Min. Anggota Tim</label>
          <input type="number" id="br-min-input" class="form-control" value="2" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Max. Anggota Tim</label>
          <input type="number" id="br-max-input" class="form-control" value="5" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Deskripsi</label>
        <textarea id="br-desc-input" class="form-control" rows="2" placeholder="Petunjuk atau deskripsi cabang lomba" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);"></textarea>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
            <i class="fa-solid fa-link" style="color: var(--primary-500);"></i> Link Juknis <span style="font-weight: 400; color: var(--text-dim);">(opsional)</span>
          </label>
          <input type="url" id="br-juknis-input" class="form-control" placeholder="https://drive.google.com/..." style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
            <i class="fa-solid fa-users-slash" style="color: var(--danger-500);"></i> Maks. Kuota Pendaftar <span style="font-weight: 400; color: var(--text-dim);">(opsional)</span>
          </label>
          <input type="number" id="br-quota-input" class="form-control" placeholder="Kosong = tidak terbatas" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">Jika penuh, tombol daftar otomatis dikunci.</div>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Cabang Lomba</button>
    </form>
  `);
}

function toggleBranchTeamFields(type) {
  const box = document.getElementById('br-team-quota-box');
  if (box) box.style.display = type === 'TEAM' ? 'grid' : 'none';
}

async function submitCreateBranch(e) {
  e.preventDefault();
  const type = document.getElementById('br-type-select').value;
  try {
    const juknisVal = document.getElementById('br-juknis-input')?.value?.trim() || '';
    const quotaVal = document.getElementById('br-quota-input')?.value;
    const res = await apiRequest('/api/competitions/branches', {
      method: 'POST',
      body: {
        levelId: document.getElementById('br-level-select').value,
        name: document.getElementById('br-name-input').value,
        participantType: type,
        registrationFee: parseFloat(document.getElementById('br-fee-input').value),
        minTeamMembers: type === 'TEAM' ? parseInt(document.getElementById('br-min-input').value, 10) : 1,
        maxTeamMembers: type === 'TEAM' ? parseInt(document.getElementById('br-max-input').value, 10) : 1,
        description: document.getElementById('br-desc-input').value,
        juknisUrl: juknisVal || undefined,
        maxRegistrants: quotaVal ? parseInt(quotaVal, 10) : undefined,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminBranchesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function openEditBranchModal(branchId, name, fee, type, minM, maxM, desc, juknisUrl, maxRegistrants) {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-pen-to-square"></i> Edit Cabang Lomba</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitEditBranch(event, '${branchId}')">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Cabang Lomba</label>
        <input type="text" id="edit-br-name" class="form-control" value="${name}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Tipe Kepesertaan</label>
          <select id="edit-br-type" class="form-select" onchange="const b = document.getElementById('edit-br-team-box'); if(b) b.style.display=this.value==='TEAM'?'grid':'none';" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            <option value="INDIVIDUAL" ${type === 'INDIVIDUAL' ? 'selected' : ''}>INDIVIDUAL</option>
            <option value="TEAM" ${type === 'TEAM' ? 'selected' : ''}>TEAM</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Biaya Pendaftaran (Rp)</label>
          <input type="number" id="edit-br-fee" class="form-control" value="${fee}" min="0" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
      <div id="edit-br-team-box" style="display: ${type === 'TEAM' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Min. Anggota Tim</label>
          <input type="number" id="edit-br-min" class="form-control" value="${minM || 2}" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Max. Anggota Tim</label>
          <input type="number" id="edit-br-max" class="form-control" value="${maxM || 5}" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Deskripsi</label>
        <textarea id="edit-br-desc" class="form-control" rows="2" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">${desc}</textarea>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
            <i class="fa-solid fa-link" style="color: var(--primary-500);"></i> Link Juknis <span style="font-weight: 400; color: var(--text-dim);">(opsional)</span>
          </label>
          <input type="url" id="edit-br-juknis" class="form-control" value="${juknisUrl || ''}" placeholder="https://drive.google.com/..." style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
        </div>
        <div>
          <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
            <i class="fa-solid fa-users-slash" style="color: var(--danger-500);"></i> Maks. Kuota Pendaftar <span style="font-weight: 400; color: var(--text-dim);">(opsional)</span>
          </label>
          <input type="number" id="edit-br-quota" class="form-control" value="${maxRegistrants || ''}" placeholder="Kosong = tidak terbatas" min="1" style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">Jika penuh, tombol daftar otomatis dikunci.</div>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Perubahan Cabang</button>
    </form>
  `);
}

async function submitEditBranch(e, branchId) {
  e.preventDefault();
  const type = document.getElementById('edit-br-type').value;
  try {
    const juknisVal = document.getElementById('edit-br-juknis')?.value?.trim() || '';
    const quotaVal = document.getElementById('edit-br-quota')?.value;
    const res = await apiRequest(`/api/competitions/branches/${branchId}`, {
      method: 'PATCH',
      body: {
        name: document.getElementById('edit-br-name').value,
        participantType: type,
        registrationFee: parseFloat(document.getElementById('edit-br-fee').value),
        minTeamMembers: type === 'TEAM' ? parseInt(document.getElementById('edit-br-min').value, 10) : 1,
        maxTeamMembers: type === 'TEAM' ? parseInt(document.getElementById('edit-br-max').value, 10) : 1,
        description: document.getElementById('edit-br-desc').value,
        juknisUrl: juknisVal,
        maxRegistrants: quotaVal ? parseInt(quotaVal, 10) : null,
      },
    });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      closeAppModal();
      renderAdminBranchesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeDeleteBranch(branchId, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus cabang "${name}"?`)) return;
  try {
    const res = await apiRequest(`/api/competitions/branches/${branchId}`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      renderAdminBranchesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function toggleBranchStatus(branchId) {
  try {
    const res = await apiRequest(`/api/competitions/branches/${branchId}/toggle`, { method: 'PATCH' });
    if (res.success) {
      alert(res.message);
      state.competitionTree = [];
      renderAdminBranchesView();
    }
  } catch (err) {
    alert(err.message);
  }
}

// --- MASTER REKENING PEMBAYARAN ---
async function renderAdminPaymentAccountsView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat rekening bank...</div>';

  try {
    const res = await apiRequest('/api/payments/accounts/all');
    const accounts = res.success ? res.data : [];

    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Rekening Pembayaran Resmi</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Kelola daftar rekening bank panitia. Rekening QRIS dapat dilengkapi gambar barcode untuk kemudahan peserta.</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-outline-success" onclick="exportAdminPaymentAccountsExcel()" style="border: 1px solid var(--success-500); color: var(--success-600); background: transparent; padding: 8px 14px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button class="btn btn-primary" onclick="openCreateAccountModal()"><i class="fa-solid fa-plus"></i> Tambah Rekening</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${accounts.map(acc => `
          <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; overflow: hidden;">
            ${acc.qrisImagePath ? `
              <div style="position: relative; background: #fff; padding: 16px; text-align: center; border-bottom: 1px solid var(--border-subtle);">
                <img src="/api/payments/accounts/qris/${acc.qrisImagePath}" alt="QRIS ${acc.bankName}" style="max-height: 180px; max-width: 100%; object-fit: contain; border-radius: 8px;" onerror="this.parentElement.style.display='none'">
                <span style="position: absolute; top: 8px; right: 8px; background: #4CAF50; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.05em;">QRIS</span>
              </div>
            ` : ''}
            <div style="padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span class="badge badge-primary" style="font-weight: 700;">${acc.bankName}</span>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    ${!acc.qrisImagePath ? '<span style="background: var(--bg-subtle); color: var(--text-dim); font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 20px;">NO QRIS</span>' : ''}
                    <span class="badge ${acc.isActive ? 'badge-success' : 'badge-danger'}">${acc.isActive ? 'AKTIF' : 'NONAKTIF'}</span>
                  </div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Nomor Rekening:</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary-600); font-family: monospace; letter-spacing: 0.05em; margin: 4px 0 8px;">
                  ${acc.accountNumber}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Atas Nama:</div>
                <div style="font-weight: 700; color: var(--text-heading); margin-bottom: 16px;">${acc.accountHolder}</div>
              </div>

              <div style="display: flex; gap: 6px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
                <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="openEditAccountModal('${acc.id}', '${acc.bankName.replace(/'/g, "\\'")}', '${acc.accountNumber.replace(/'/g, "\\'")}', '${acc.accountHolder.replace(/'/g, "\\'")}', ${acc.qrisImagePath ? `'${acc.qrisImagePath}'` : 'null'})">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="btn btn-sm ${acc.isActive ? 'btn-outline-danger' : 'btn-outline-success'}" style="flex: 1;" onclick="toggleAccountStatus('${acc.id}')">
                  ${acc.isActive ? '<i class="fa-solid fa-ban"></i> Nonaktif' : '<i class="fa-solid fa-check"></i> Aktifkan'}
                </button>
                <button class="btn btn-sm btn-danger" style="padding: 4px 10px;" title="Hapus Rekening" onclick="executeDeleteAccount('${acc.id}', '${acc.bankName.replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function exportAdminPaymentAccountsExcel() {
  try {
    const res = await apiRequest('/api/payments/accounts/all');
    const data = (res.success && res.data) ? res.data : [];
    const cols = [
      { header: 'Nama Bank / Metode Pembayaran', key: 'bankName' },
      { header: 'Nomor Rekening', key: 'accountNumber' },
      { header: 'Atas Nama (Pemilik)', key: 'accountHolder' },
      { header: 'Status Rekening', exportValue: a => a.isActive ? 'AKTIF' : 'NONAKTIF' },
    ];
    exportTableDataToExcel('data_rekening_pembayaran_resmi', cols, data);
  } catch (err) {
    alert(err.message);
  }
}

function exportAdminBranchStatsExcel() {
  const data = window.latestBranchStats || [];
  const cols = [
    { header: 'No', exportValue: (b, idx) => idx + 1 },
    { header: 'Cabang Lomba', key: 'name' },
    { header: 'Kategori', key: 'categoryName' },
    { header: 'Jenjang', key: 'levelName' },
    { header: 'Tipe', key: 'participantType' },
    { header: 'Biaya Pendaftaran', exportValue: b => formatCurrency(b.fee) },
    { header: 'Total Pendaftar', key: 'totalCount' },
    { header: 'Disetujui', key: 'approvedCount' },
    { header: 'Menunggu Verifikasi', key: 'pendingCount' },
    { header: 'Total Dana Terkonfirmasi', exportValue: b => formatCurrency(b.confirmedFunds) },
  ];
  exportTableDataToExcel('rekapitulasi_pendaftar_cabang_lomba', cols, data);
}

function openCreateAccountModal() {
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-plus"></i> Tambah Rekening Bank</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitCreateAccount(event)" id="form-create-account">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Bank / Metode Pembayaran</label>
        <input type="text" id="acc-bank-input" class="form-control" placeholder="Contoh: Bank Central Asia (BCA) atau QRIS Panitia" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nomor Rekening / ID QRIS</label>
        <input type="text" id="acc-num-input" class="form-control" placeholder="Nomor rekening atau nomor QRIS" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Pemilik Rekening / Merchant</label>
        <input type="text" id="acc-holder-input" class="form-control" placeholder="Contoh: Panitia Lomba Nasional 2026" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
          <i class="fa-solid fa-qrcode" style="color: var(--primary-500);"></i> Gambar Barcode QRIS <span style="color: var(--text-dim); font-weight: 400;">(opsional)</span>
        </label>
        <div id="qris-upload-area-create" style="border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.2s; background: var(--bg-subtle);" onclick="document.getElementById('acc-qris-input').click()" ondragover="event.preventDefault(); this.style.borderColor='var(--primary-500)'" ondragleave="this.style.borderColor='var(--border-subtle)'" ondrop="handleQrisFileDrop(event, 'create')">
          <div id="qris-preview-create" style="display:none; margin-bottom: 10px;">
            <img id="qris-preview-img-create" src="" alt="Preview QRIS" style="max-height: 150px; max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          </div>
          <div id="qris-placeholder-create">
            <i class="fa-solid fa-qrcode" style="font-size: 2rem; color: var(--text-dim); margin-bottom: 8px;"></i>
            <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 4px;">Klik atau drag & drop gambar QRIS</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Format: JPG, PNG, WEBP (maks. 5MB)</div>
          </div>
          <input type="file" id="acc-qris-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="previewQrisImage(this, 'create')">
        </div>
        <button type="button" id="btn-clear-qris-create" onclick="clearQrisPreview('create')" style="display:none; margin-top: 8px; background: none; border: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; padding: 4px 12px; border-radius: var(--radius-sm); cursor: pointer;">
          <i class="fa-solid fa-xmark"></i> Hapus gambar
        </button>
      </div>

      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Rekening</button>
    </form>
  `);
}

async function submitCreateAccount(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  try {
    const res = await apiRequest('/api/payments/accounts', {
      method: 'POST',
      body: {
        bankName: document.getElementById('acc-bank-input').value,
        accountNumber: document.getElementById('acc-num-input').value,
        accountHolder: document.getElementById('acc-holder-input').value,
      },
    });
    if (res.success) {
      const newAccountId = res.data.id;
      // Upload QRIS image jika ada
      const qrisFile = document.getElementById('acc-qris-input')?.files?.[0];
      if (qrisFile) {
        const fd = new FormData();
        fd.append('qris_image', qrisFile);
        await apiRequest(`/api/payments/accounts/${newAccountId}/qris`, {
          method: 'POST',
          body: fd,
        });
      }
      alert(res.message);
      closeAppModal();
      renderAdminPaymentAccountsView();
    }
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.innerHTML = 'Simpan Rekening';
  }
}

function openEditAccountModal(id, bankName, accountNumber, accountHolder, qrisImagePath) {
  const qrisFilename = (qrisImagePath && qrisImagePath !== 'null') ? qrisImagePath : null;
  openAppModal(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.25rem; color: var(--text-heading); margin: 0;"><i class="fa-solid fa-pen-to-square"></i> Edit Rekening Bank</h3>
      <button onclick="closeAppModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="submitEditAccount(event, '${id}')">
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Bank / Metode Pembayaran</label>
        <input type="text" id="edit-acc-bank" class="form-control" value="${bankName}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nomor Rekening / ID QRIS</label>
        <input type="text" id="edit-acc-num" class="form-control" value="${accountNumber}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">Nama Pemilik Rekening / Merchant</label>
        <input type="text" id="edit-acc-holder" class="form-control" value="${accountHolder}" required style="width: 100%; padding: 10px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">
          <i class="fa-solid fa-qrcode" style="color: var(--primary-500);"></i> Gambar Barcode QRIS
        </label>
        ${qrisFilename ? `
          <div id="qris-current-edit" style="background: #fff; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 10px; border: 1px solid var(--border-subtle);">
            <img src="/api/payments/accounts/qris/${qrisFilename}" alt="QRIS saat ini" style="max-height: 140px; max-width: 100%; object-fit: contain; border-radius: 6px;" onerror="this.parentElement.innerHTML='<span style=color:var(--text-dim)>Gambar tidak ditemukan</span>'">
            <div style="margin-top: 8px;">
              <button type="button" onclick="executeDeleteAccountQris('${id}')" style="background: none; border: 1px solid #ef4444; color: #ef4444; font-size: 0.8rem; padding: 4px 12px; border-radius: var(--radius-sm); cursor: pointer;">
                <i class="fa-solid fa-trash-can"></i> Hapus QRIS
              </button>
            </div>
          </div>
        ` : ''}
        <div id="qris-upload-area-edit" style="border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.2s; background: var(--bg-subtle);" onclick="document.getElementById('edit-qris-input').click()" ondragover="event.preventDefault(); this.style.borderColor='var(--primary-500)'" ondragleave="this.style.borderColor='var(--border-subtle)'" ondrop="handleQrisFileDrop(event, 'edit')">
          <div id="qris-preview-edit" style="display:none; margin-bottom: 10px;">
            <img id="qris-preview-img-edit" src="" alt="Preview QRIS" style="max-height: 140px; max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          </div>
          <div id="qris-placeholder-edit">
            <i class="fa-solid fa-arrow-up-from-bracket" style="font-size: 1.5rem; color: var(--text-dim); margin-bottom: 6px;"></i>
            <div style="font-size: 0.875rem; color: var(--text-muted);">${qrisFilename ? 'Ganti' : 'Upload'} gambar QRIS</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">JPG, PNG, WEBP (maks. 5MB)</div>
          </div>
          <input type="file" id="edit-qris-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="previewQrisImage(this, 'edit')">
        </div>
        <button type="button" id="btn-clear-qris-edit" onclick="clearQrisPreview('edit')" style="display:none; margin-top: 8px; background: none; border: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; padding: 4px 12px; border-radius: var(--radius-sm); cursor: pointer;">
          <i class="fa-solid fa-xmark"></i> Batal ganti
        </button>
      </div>

      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">Simpan Perubahan</button>
    </form>
  `);
}

async function submitEditAccount(e, id) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  try {
    const res = await apiRequest(`/api/payments/accounts/${id}`, {
      method: 'PATCH',
      body: {
        bankName: document.getElementById('edit-acc-bank').value,
        accountNumber: document.getElementById('edit-acc-num').value,
        accountHolder: document.getElementById('edit-acc-holder').value,
      },
    });
    if (res.success) {
      // Upload QRIS baru jika ada file dipilih
      const qrisFile = document.getElementById('edit-qris-input')?.files?.[0];
      if (qrisFile) {
        const fd = new FormData();
        fd.append('qris_image', qrisFile);
        await apiRequest(`/api/payments/accounts/${id}/qris`, {
          method: 'POST',
          body: fd,
        });
      }
      alert(res.message);
      closeAppModal();
      renderAdminPaymentAccountsView();
    }
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.innerHTML = 'Simpan Perubahan';
  }
}

async function executeDeleteAccountQris(accountId) {
  if (!confirm('Hapus gambar QRIS dari rekening ini?')) return;
  try {
    const res = await apiRequest(`/api/payments/accounts/${accountId}/qris`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      closeAppModal();
      renderAdminPaymentAccountsView();
    }
  } catch (err) {
    alert(err.message);
  }
}

function previewQrisImage(input, mode) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran file maksimal 5MB.');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById(`qris-preview-img-${mode}`);
    const preview = document.getElementById(`qris-preview-${mode}`);
    const placeholder = document.getElementById(`qris-placeholder-${mode}`);
    const clearBtn = document.getElementById(`btn-clear-qris-${mode}`);
    if (img) img.src = e.target.result;
    if (preview) preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function clearQrisPreview(mode) {
  const input = document.getElementById(mode === 'create' ? 'acc-qris-input' : 'edit-qris-input');
  const preview = document.getElementById(`qris-preview-${mode}`);
  const placeholder = document.getElementById(`qris-placeholder-${mode}`);
  const clearBtn = document.getElementById(`btn-clear-qris-${mode}`);
  if (input) input.value = '';
  if (preview) preview.style.display = 'none';
  if (placeholder) placeholder.style.display = 'block';
  if (clearBtn) clearBtn.style.display = 'none';
}

function handleQrisFileDrop(event, mode) {
  event.preventDefault();
  const area = event.currentTarget;
  area.style.borderColor = 'var(--border-subtle)';
  const file = event.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.');
    return;
  }
  const inputId = mode === 'create' ? 'acc-qris-input' : 'edit-qris-input';
  const input = document.getElementById(inputId);
  if (input) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    previewQrisImage(input, mode);
  }
}

async function executeDeleteAccount(id, bankName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus rekening ${bankName}?`)) return;
  try {
    const res = await apiRequest(`/api/payments/accounts/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert(res.message);
      renderAdminPaymentAccountsView();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function toggleAccountStatus(accId) {
  try {
    const res = await apiRequest(`/api/payments/accounts/${accId}/toggle`, { method: 'PATCH' });
    if (res.success) {
      alert(res.message);
      renderAdminPaymentAccountsView();
    }
  } catch (err) {
    alert(err.message);
  }
}

// --- PENGATURAN BRANDING & IDENTITAS APLIKASI ---
async function renderAdminBrandingView() {
  const container = document.getElementById('main-view-slot');
  const s = state.settings || {};

  const logoUrl = s.application_logo ? `/static/img/${s.application_logo}` : '/static/img/logo_e7a8b6a95d.webp';
  const faviconUrl = s.application_favicon ? `/static/img/${s.application_favicon}` : '/static/img/favicon_87007b6344.webp';

  container.innerHTML = `
    <div style="max-width: 760px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Identitas Aplikasi & Branding</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Perubahan ini diterapkan secara otomatis ke landing page, kartu peserta, dan dashboard.</p>
      </div>

      <div id="branding-save-alert" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 20px;"></div>

      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm);">
        <form onsubmit="handleBrandingSave(event)">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Aplikasi Lengkap</label>
            <input type="text" id="brand-app-name" class="form-control" value="${s.application_name || 'MASKUMAMBANG FEST #4'}" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Nama Singkat / Brand Tag</label>
            <input type="text" id="brand-short-name" class="form-control" value="${s.application_short_name || 'MASKUMAMBANG FEST #4'}" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Deskripsi Acara</label>
            <textarea id="brand-desc" class="form-control" rows="3" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">${s.application_description || 'Ajang Kompetisi Tingkat Nasional Paling Bergengsi Tahun 2026.'}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
            <div>
              <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px; color: var(--text-main);"><i class="fa-solid fa-image"></i> Logo Aplikasi</label>
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--bg-body); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img id="logo-preview-img" src="${logoUrl}" alt="Logo Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <input type="file" id="brand-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="font-size: 0.8rem;" onchange="previewBrandingFile(this, 'logo-preview-img')">
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem;">PNG, JPG, WEBP, atau SVG (Maks. 2MB)</small>
            </div>

            <div>
              <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px; color: var(--text-main);"><i class="fa-solid fa-icons"></i> Favicon</label>
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--bg-body); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img id="favicon-preview-img" src="${faviconUrl}" alt="Favicon Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <input type="file" id="brand-favicon-file" accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml" style="font-size: 0.8rem;" onchange="previewBrandingFile(this, 'favicon-preview-img')">
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem;">ICO, PNG, atau WEBP</small>
            </div>
          </div>

          <button type="submit" id="brand-save-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">
            <i class="fa-solid fa-check"></i> Simpan Pengaturan Branding
          </button>
        </form>
      </div>
    </div>
  `;
}

function previewBrandingFile(input, previewImgId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.getElementById(previewImgId);
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function handleBrandingSave(e) {
  e.preventDefault();
  const btn = document.getElementById('brand-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    // 1. Upload Logo if selected
    const logoInput = document.getElementById('brand-logo-file');
    if (logoInput && logoInput.files && logoInput.files[0]) {
      const logoData = new FormData();
      logoData.append('logo', logoInput.files[0]);
      await apiRequest('/api/settings/logo', { method: 'POST', body: logoData });
    }

    // 2. Upload Favicon if selected
    const favInput = document.getElementById('brand-favicon-file');
    if (favInput && favInput.files && favInput.files[0]) {
      const favData = new FormData();
      favData.append('favicon', favInput.files[0]);
      await apiRequest('/api/settings/favicon', { method: 'POST', body: favData });
    }

    // 3. Save text settings
    const res = await apiRequest('/api/settings', {
      method: 'POST',
      body: {
        application_name: document.getElementById('brand-app-name').value,
        application_short_name: document.getElementById('brand-short-name').value,
        application_description: document.getElementById('brand-desc').value,
      },
    });

    if (res.success) {
      state.settings = res.data;
      showBannerAlert('branding-save-alert', 'Pengaturan branding & logo berhasil diperbarui.', 'success');
      await loadBrandingInfo();
    }
  } catch (err) {
    showBannerAlert('branding-save-alert', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Pengaturan Branding';
  }
}

// --- PENGATURAN COUNTDOWN HOMEPAGE ---
async function renderAdminCountdownView() {
  const container = document.getElementById('main-view-slot');
  const s = state.settings || {};

  const isEnabled = s.countdown_enabled !== 'false';
  const targetDate = s.countdown_target_date || '2026-10-15T23:59';
  const dtVal = targetDate.slice(0, 16);

  container.innerHTML = `
    <div style="max-width: 760px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Pengaturan Countdown Homepage</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Atur judul, tanggal dan jam target hitung mundur yang tampil di banner utama homepage.</p>
      </div>

      <div id="countdown-save-alert" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 20px;"></div>

      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm);">
        <form onsubmit="handleCountdownSave(event)">
          
          <div class="form-group" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
            <div>
              <label for="cd-enabled-switch" style="font-weight: 700; font-size: 0.95rem; color: var(--text-heading); cursor: pointer; display: block;">Status Countdown</label>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Aktifkan untuk menampilkan widget hitung mundur di homepage</div>
            </div>
            <input type="checkbox" id="cd-enabled-switch" ${isEnabled ? 'checked' : ''} style="width: 22px; height: 22px; cursor: pointer; accent-color: var(--primary-600);">
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Judul / Label Countdown</label>
            <input type="text" id="cd-title-input" class="form-control" value="${s.countdown_title || 'HITUNG MUNDUR PENUTUPAN PENDAFTARAN'}" required placeholder="Contoh: HITUNG MUNDUR PENUTUPAN PENDAFTARAN" style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Tanggal &amp; Waktu Target</label>
            <input type="datetime-local" id="cd-target-date-input" class="form-control" value="${dtVal}" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
            <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 5px;">Pilih batas waktu penutupan atau waktu pelaksanaan acara.</div>
          </div>

          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Pesan Saat Waktu Berakhir</label>
            <input type="text" id="cd-ended-text-input" class="form-control" value="${s.countdown_ended_text || 'Pendaftaran Resmi Ditutup'}" required placeholder="Contoh: Pendaftaran Resmi Ditutup" style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>

          <!-- Preview Info Box -->
          <div style="margin-bottom: 24px; padding: 16px; background: rgba(99, 102, 241, 0.06); border: 1px dashed var(--border-subtle); border-radius: 12px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase; margin-bottom: 6px;"><i class="fa-solid fa-arrows-rotate"></i> Sinkronisasi Otomatis</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Perubahan tanggal dan jam akan langsung aktif di widget hitung mundur halaman depan (homepage).
            </div>
          </div>

          <button type="submit" id="cd-save-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">
            <i class="fa-solid fa-check"></i> Simpan Pengaturan Countdown
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleCountdownSave(e) {
  e.preventDefault();
  const btn = document.getElementById('cd-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const isEnabled = document.getElementById('cd-enabled-switch').checked;
    const titleVal = document.getElementById('cd-title-input').value.trim();
    const targetDateVal = document.getElementById('cd-target-date-input').value;
    const endedTextVal = document.getElementById('cd-ended-text-input').value.trim();

    const res = await apiRequest('/api/settings', {
      method: 'POST',
      body: {
        countdown_enabled: isEnabled ? 'true' : 'false',
        countdown_title: titleVal,
        countdown_target_date: targetDateVal,
        countdown_ended_text: endedTextVal,
      },
    });

    if (res.success) {
      state.settings = res.data;
      showBannerAlert('countdown-save-alert', 'Pengaturan countdown berhasil disimpan dan diperbarui.', 'success');
    }
  } catch (err) {
    showBannerAlert('countdown-save-alert', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Pengaturan Countdown';
  }
}

// --- HOMEPAGE LIVE COUNTDOWN TIMER ENGINE ---
let countdownTimerInterval = null;

async function initHomepageCountdown() {
  const box = document.getElementById('hero-countdown-box');
  if (!box) return;

  try {
    let settings = state.settings;
    if (!settings || !settings.countdown_target_date) {
      const res = await apiRequest('/api/settings');
      if (res.success && res.data) {
        state.settings = res.data;
        settings = res.data;
      }
    }

    if (settings && settings.countdown_enabled === 'false') {
      box.style.display = 'none';
      return;
    }

    const titleTextEl = document.getElementById('countdown-title-text');
    if (titleTextEl && settings && settings.countdown_title) {
      titleTextEl.textContent = settings.countdown_title;
    }

    const targetDateStr = (settings && settings.countdown_target_date) ? settings.countdown_target_date : '2026-10-15T23:59:00';
    const targetTime = new Date(targetDateStr).getTime();

    if (isNaN(targetTime)) {
      console.warn('Invalid countdown target date:', targetDateStr);
      return;
    }

    const gridEl = document.getElementById('countdown-timer-grid');
    const expiredEl = document.getElementById('countdown-expired-msg');
    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-minutes');
    const sEl = document.getElementById('cd-seconds');

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        if (gridEl) gridEl.style.display = 'none';
        if (expiredEl) {
          expiredEl.style.display = 'block';
          expiredEl.textContent = (settings && settings.countdown_ended_text) ? settings.countdown_ended_text : 'Pendaftaran Resmi Ditutup';
        }
        if (countdownTimerInterval) clearInterval(countdownTimerInterval);
        return;
      }

      if (gridEl) gridEl.style.display = 'grid';
      if (expiredEl) expiredEl.style.display = 'none';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    countdownTimerInterval = setInterval(updateCountdown, 1000);

  } catch (err) {
    console.error('Countdown init error:', err);
  }
}

// --- AUDIT LOGS (UNIVERSAL TABLE) ---
async function renderAdminAuditLogsView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat log audit...</div>';

  try {
    const res = await apiRequest('/api/audit/logs?perPage=500');
    tableState.adminAudit.data = res.success ? res.logs : [];

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Log Audit Keamanan Sistem</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Pencatatan riwayat aktivitas penting dan administratif sistem.</p>
      </div>

      <div id="admin-audit-table-slot">
        ${renderAdminAuditTable()}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderAdminAuditTable() {
  const ts = tableState.adminAudit;
  return renderUniversalTable({
    tableId: 'admin-audit-table',
    columns: [
      { header: 'Waktu', key: 'createdAt', render: l => formatDate(l.createdAt) },
      { header: 'Aksi', key: 'action', render: l => `<span class="badge badge-primary">${l.action}</span>` },
      { header: 'Pelaksana', sortValue: l => l.user?.name || 'Sistem', render: l => l.user ? `<strong>${l.user.name}</strong> (${l.user.role})` : 'Sistem' },
      { header: 'Tabel Target', key: 'targetTable', render: l => `<code>${l.targetTable}</code>` },
      { header: 'Rincian', key: 'details', render: l => l.details || '-' },
    ],
    data: ts.data,
    searchQuery: ts.search,
    searchFields: ['action', 'targetTable', 'details', l => l.user?.name, l => l.user?.email],
    sortKey: ts.sortKey,
    sortDir: ts.sortDir,
    currentPage: ts.page,
    pageSize: ts.pageSize,
    onPageChangeName: 'onAdminAuditPageChange',
    onSearchChangeName: 'onAdminAuditSearchChange',
    onPageSizeChangeName: 'onAdminAuditPageSizeChange',
    onSortChangeName: 'onAdminAuditSortChange',
    exportFilename: 'log_audit_keamanan_sistem',
    onExportName: 'exportAdminAuditExcel',
    emptyMessage: 'Belum ada log audit.',
  });
}

function exportAdminAuditExcel() {
  const data = tableState.adminAudit.data || [];
  const cols = [
    { header: 'Waktu Aktivitas', exportValue: l => formatDate(l.createdAt) },
    { header: 'Aksi Keamanan', key: 'action' },
    { header: 'Nama Pelaksana', exportValue: l => l.user?.name || 'Sistem' },
    { header: 'Email Pelaksana', exportValue: l => l.user?.email || '-' },
    { header: 'Role Pelaksana', exportValue: l => l.user?.role || '-' },
    { header: 'Tabel Target', key: 'targetTable' },
    { header: 'Rincian Aktivitas', key: 'details' },
  ];
  exportTableDataToExcel('log_audit_keamanan_sistem', cols, data);
}

function onAdminAuditPageChange(p) { tableState.adminAudit.page = p; updateUniversalTable('admin-audit-table-slot', renderAdminAuditTable); }
function onAdminAuditSearchChange(s) { tableState.adminAudit.search = s; tableState.adminAudit.page = 1; updateUniversalTable('admin-audit-table-slot', renderAdminAuditTable); }
function onAdminAuditPageSizeChange(z) { tableState.adminAudit.pageSize = z; tableState.adminAudit.page = 1; updateUniversalTable('admin-audit-table-slot', renderAdminAuditTable); }
function onAdminAuditSortChange(k) {
  if (tableState.adminAudit.sortKey === k) {
    tableState.adminAudit.sortDir = tableState.adminAudit.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tableState.adminAudit.sortKey = k;
    tableState.adminAudit.sortDir = 'asc';
  }
  updateUniversalTable('admin-audit-table-slot', renderAdminAuditTable);
}

// --- RESET DATA OPERASIONAL (DANGER ZONE WITH RESET124) ---
function renderAdminResetOperasionalView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = `
    <div style="max-width: 650px; margin: 0 auto;">
      <div class="card" style="background: var(--bg-card); border: 2px solid var(--danger-500); border-radius: var(--radius-xl); padding: 30px; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3.5rem; color: var(--danger-500); margin-bottom: 12px;"></i>
          <h2 style="font-size: 1.5rem; color: var(--danger-600); margin-bottom: 8px;">Danger Zone: Reset Data Operasional</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
            Fitur ini digunakan untuk <strong>membersihkan seluruh data transaksi testing</strong> (Pendaftaran, Anggota Tim, Pembayaran, dan Riwayat Check-in) sebelum event lomba resmi dimulai.
          </p>
        </div>

        <div class="alert alert-warning" style="margin-bottom: 24px; font-size: 0.875rem; line-height: 1.6;">
          <strong>Garansi Keamanan Master Data:</strong>
          <ul style="margin-left: 20px; margin-top: 6px;">
            <li>Data Master Lomba (Kategori, Jenjang, Cabang, Biaya) <strong>100% AMAN</strong>.</li>
            <li>Rekening Bank Panitia & Pengaturan Branding <strong>100% AMAN</strong>.</li>
            <li>Akun Super Admin & Bendahara <strong>TETAP AMAN</strong>.</li>
          </ul>
        </div>

        <div id="reset-page-alert" style="display: none; padding: 14px; border-radius: 8px; margin-bottom: 18px;"></div>

        <form onsubmit="handleOperationalResetSubmit(event)">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 700; margin-bottom: 6px; color: var(--danger-600);">
              Ketik Kode Konfirmasi Rahasia Super Admin:
            </label>
            <input type="password" id="reset-code-field" class="form-control" placeholder="••••••••" required style="width: 100%; padding: 12px 14px; border: 2px solid var(--danger-500); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>

          <button type="submit" id="reset-exec-btn" class="btn btn-danger" style="width: 100%; padding: 14px; font-weight: 800; font-size: 1rem;">
            <i class="fa-solid fa-trash-can"></i> Eksekusi Pembersihan Data Operasional
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleOperationalResetSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('reset-code-field').value.trim();
  const btn = document.getElementById('reset-exec-btn');

  if (!confirm('PERINGATAN TERAKHIR: Apakah Anda yakin ingin membersihkan seluruh data registrasi & pembayaran transaksi?')) {
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengeksekusi pembersihan...';

  try {
    const res = await apiRequest('/api/settings/reset-operational-data', {
      method: 'POST',
      body: { confirmationCode: code },
    });

    if (res.success) {
      showBannerAlert('reset-page-alert', res.message, 'success');
      document.getElementById('reset-code-field').value = '';
    }
  } catch (err) {
    showBannerAlert('reset-page-alert', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eksekusi Pembersihan Data Operasional';
  }
}

// --- COMMON CHANGE PASSWORD VIEW ---
function renderChangePasswordView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = `
    <div style="max-width: 480px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; color: var(--text-heading); margin-bottom: 4px;">Ubah Kata Sandi Akun</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Perbarui kata sandi untuk mengamankan akses akun Anda.</p>
      </div>

      <div id="change-pass-alert" style="display: none; padding: 14px; border-radius: 8px; margin-bottom: 20px;"></div>

      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
        <form onsubmit="handlePasswordChangeSubmit(event)">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Kata Sandi Saat Ini</label>
            <input type="password" id="cp-current" class="form-control" placeholder="••••••••" required style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Kata Sandi Baru (Min. 6 Karakter)</label>
            <input type="password" id="cp-new" class="form-control" placeholder="••••••••" required minlength="6" style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>
          <div class="form-group" style="margin-bottom: 22px;">
            <label class="form-label" style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Konfirmasi Kata Sandi Baru</label>
            <input type="password" id="cp-confirm" class="form-control" placeholder="••••••••" required minlength="6" style="width: 100%; padding: 11px 14px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); border-radius: var(--radius-md);">
          </div>

          <button type="submit" id="cp-submit-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">
            <i class="fa-solid fa-check"></i> Simpan Kata Sandi Baru
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handlePasswordChangeSubmit(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('cp-current').value;
  const newPassword = document.getElementById('cp-new').value;
  const confirmPassword = document.getElementById('cp-confirm').value;
  const btn = document.getElementById('cp-submit-btn');

  if (newPassword !== confirmPassword) {
    showBannerAlert('change-pass-alert', 'Konfirmasi kata sandi baru tidak cocok.', 'danger');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const res = await apiRequest('/api/users/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });

    if (res.success) {
      showBannerAlert('change-pass-alert', res.message, 'success');
      document.getElementById('cp-current').value = '';
      document.getElementById('cp-new').value = '';
      document.getElementById('cp-confirm').value = '';
    }
  } catch (err) {
    showBannerAlert('change-pass-alert', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Kata Sandi Baru';
  }
}

// ============================================================================
// GLOBAL EXPORTS & WINDOW ATTACHMENTS
// ============================================================================
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.initDashboardApp = initDashboardApp;
window.handleLogout = handleLogout;
window.loadBrandingInfo = loadBrandingInfo;
window.openAppModal = openAppModal;
window.closeAppModal = closeAppModal;

// Table pagination, search, sorting & filter handlers
window.onPesertaPageChange = onPesertaPageChange;
window.onPesertaSearchChange = onPesertaSearchChange;
window.onPesertaPageSizeChange = onPesertaPageSizeChange;
window.onPesertaSortChange = onPesertaSortChange;
window.onPesertaFilterChange = onPesertaFilterChange;

window.onBendaharaPageChange = onBendaharaPageChange;
window.onBendaharaSearchChange = onBendaharaSearchChange;
window.onBendaharaPageSizeChange = onBendaharaPageSizeChange;
window.onBendaharaSortChange = onBendaharaSortChange;
window.onBendaharaFilterChange = onBendaharaFilterChange;

window.onAdminRegPageChange = onAdminRegPageChange;
window.onAdminRegSearchChange = onAdminRegSearchChange;
window.onAdminRegPageSizeChange = onAdminRegPageSizeChange;
window.onAdminRegSortChange = onAdminRegSortChange;
window.onAdminRegFilterChange = onAdminRegFilterChange;

window.onAdminUserPageChange = onAdminUserPageChange;
window.onAdminUserSearchChange = onAdminUserSearchChange;
window.onAdminUserPageSizeChange = onAdminUserPageSizeChange;
window.onAdminUserSortChange = onAdminUserSortChange;
window.onAdminUserFilterChange = onAdminUserFilterChange;

window.onAdminAuditPageChange = onAdminAuditPageChange;
window.onAdminAuditSearchChange = onAdminAuditSearchChange;
window.onAdminAuditPageSizeChange = onAdminAuditPageSizeChange;
window.onAdminAuditSortChange = onAdminAuditSortChange;

window.onAdminBranchPageChange = onAdminBranchPageChange;
window.onAdminBranchSearchChange = onAdminBranchSearchChange;
window.onAdminBranchPageSizeChange = onAdminBranchPageSizeChange;
window.onAdminBranchSortChange = onAdminBranchSortChange;
window.onAdminBranchFilterChange = onAdminBranchFilterChange;

// Participant Card & Modal Handlers
window.openParticipantCardModal = openParticipantCardModal;
window.printParticipantCard = printParticipantCard;
window.downloadParticipantCardJPG = downloadParticipantCardJPG;

// ============================================================================
// CETAK KARTU PESERTA MASSAL (SUPERADMIN)
// ============================================================================

const cetakKartuState = {
  data: [],
  selected: new Set(),
  filterBranch: '',
  search: '',
};

function getCetakFilteredData() {
  const allData = cetakKartuState.data;
  let filtered = allData;
  if (cetakKartuState.filterBranch) {
    filtered = filtered.filter(r => (r.branch?.name || r.branchName || '') === cetakKartuState.filterBranch);
  }
  if (cetakKartuState.search.trim()) {
    const q = cetakKartuState.search.toLowerCase();
    filtered = filtered.filter(r => {
      const name = r.individualParticipant?.fullName || r.team?.teamName || '';
      const school = r.individualParticipant?.schoolName || r.team?.schoolName || '';
      const reg = r.registrationNumber || '';
      return name.toLowerCase().includes(q) || school.toLowerCase().includes(q) || reg.toLowerCase().includes(q);
    });
  }
  return filtered;
}

async function renderCetakKartuView() {
  const container = document.getElementById('main-view-slot');
  container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar peserta terverifikasi...</div>';

  try {
    const res = await apiRequest('/api/registrations?perPage=999&status=APPROVED');
    cetakKartuState.data = res.success ? (res.data || res.registrations || []) : [];
    cetakKartuState.selected = new Set();
    renderCetakKartuPage();
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

function renderCetakKartuPage() {
  const container = document.getElementById('main-view-slot');
  const allData = cetakKartuState.data;

  // Get unique branches for filter
  const branches = [...new Set(allData.map(r => r.branch?.name || r.branchName || '').filter(Boolean))].sort();

  const filtered = getCetakFilteredData();
  const selectedCount = cetakKartuState.selected.size;
  const isAllSelected = filtered.length > 0 && filtered.every(r => cetakKartuState.selected.has(r.id));

  container.innerHTML = `
    <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; color:var(--text-heading); margin-bottom:4px;"><i class="fa-solid fa-print"></i> Cetak Kartu Peserta Massal</h2>
        <p style="color:var(--text-muted); font-size:0.9rem;">Pilih peserta yang ingin dicetak kartunya secara massal (Ukuran Standar: <strong>10cm × 14cm</strong>).</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button type="button" class="btn btn-secondary" onclick="cetakSelectAll()" title="Pilih semua yang terfilter">
          <i class="fa-solid fa-check-double"></i> Pilih Semua (${filtered.length})
        </button>
        <button type="button" class="btn btn-secondary" onclick="cetakClearAll()" title="Kosongkan pilihan">
          <i class="fa-solid fa-xmark"></i> Batal Pilih
        </button>
        <button type="button" class="btn btn-primary" onclick="cetakKartuPDF()" ${selectedCount === 0 ? 'disabled' : ''} style="min-width:170px;">
          <i class="fa-solid fa-print"></i> Cetak PDF (<span id="cetak-count">${selectedCount}</span>)
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
      <div style="flex:1; min-width:220px; position:relative;">
        <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-dim); font-size:0.85rem;"></i>
        <input type="text" placeholder="Cari nama / sekolah / nomor reg..." value="${cetakKartuState.search}" oninput="cetakOnSearch(this.value)" style="width:100%; padding:8px 12px 8px 34px; font-size:0.875rem; border-radius:var(--radius-md); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-main);">
      </div>
      <div style="min-width:220px;">
        <select onchange="cetakOnFilterBranch(this.value)" style="width:100%; padding:8px 12px; font-size:0.875rem; border-radius:var(--radius-md); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-main);">
          <option value="">— Semua Cabang Lomba —</option>
          ${branches.map(b => `<option value="${b}" ${cetakKartuState.filterBranch === b ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <div style="font-size:0.85rem; color:var(--text-muted); white-space:nowrap;">
        Menampilkan <strong>${filtered.length}</strong> peserta (${selectedCount} dipilih)
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
          <thead>
            <tr style="background:var(--table-header-bg); border-bottom:1px solid var(--border-subtle);">
              <th style="padding:12px 14px; width:50px; text-align:center;">
                <input type="checkbox" id="cetak-check-all" onchange="cetakToggleAll(this.checked)" ${isAllSelected ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer; accent-color:var(--primary-600);" title="Pilih Semua yang Tampil">
              </th>
              <th style="padding:12px 14px; font-weight:700; color:var(--text-muted);">No. Reg</th>
              <th style="padding:12px 14px; font-weight:700; color:var(--text-muted);">Nama Peserta / Tim</th>
              <th style="padding:12px 14px; font-weight:700; color:var(--text-muted);">Asal Sekolah</th>
              <th style="padding:12px 14px; font-weight:700; color:var(--text-muted);">Cabang Lomba</th>
              <th style="padding:12px 14px; font-weight:700; color:var(--text-muted);">Jenis</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size:2rem; display:block; margin-bottom:8px; color:var(--text-dim);"></i>
                Tidak ada peserta yang sudah disetujui / terverifikasi.
              </td></tr>
            ` : filtered.map(r => {
              const name = r.individualParticipant?.fullName || r.team?.teamName || '-';
              const school = r.individualParticipant?.schoolName || r.team?.schoolName || '-';
              const branch = r.branch?.name || r.branchName || '-';
              const type = r.branch?.participantType === 'TEAM' ? 'Beregu' : 'Perorangan';
              const checked = cetakKartuState.selected.has(r.id) ? 'checked' : '';
              return `
                <tr style="border-bottom:1px solid var(--border-subtle); ${checked ? 'background: rgba(99,102,241,0.08);' : ''}; cursor:pointer;" onclick="cetakRowClick(event, '${r.id}')">
                  <td style="padding:12px 14px; text-align:center;" onclick="event.stopPropagation();">
                    <input type="checkbox" class="cetak-row-check" value="${r.id}" ${checked} onchange="cetakToggleOne('${r.id}', this.checked)" style="width:18px; height:18px; cursor:pointer; accent-color:var(--primary-600);">
                  </td>
                  <td style="padding:12px 14px;"><code style="font-weight:800; color:var(--primary-600); font-size:0.82rem;">${r.registrationNumber || '-'}</code></td>
                  <td style="padding:12px 14px; font-weight:700; color:var(--text-heading);">${name}</td>
                  <td style="padding:12px 14px; color:var(--text-muted);">${school}</td>
                  <td style="padding:12px 14px; font-weight:600;">${branch}</td>
                  <td style="padding:12px 14px;"><span style="font-size:0.75rem; padding:3px 10px; border-radius:9999px; background:${type==='Beregu'?'#dbeafe':'#dcfce7'}; color:${type==='Beregu'?'#1d4ed8':'#15803d'}; font-weight:700;">${type}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function cetakRowClick(e, id) {
  if (e.target.tagName === 'INPUT') return;
  const isSelected = cetakKartuState.selected.has(id);
  cetakToggleOne(id, !isSelected);
}

function cetakToggleOne(id, checked) {
  if (checked) cetakKartuState.selected.add(id);
  else cetakKartuState.selected.delete(id);

  // Update check-all state
  const filtered = getCetakFilteredData();
  const allEl = document.getElementById('cetak-check-all');
  if (allEl) allEl.checked = filtered.length > 0 && filtered.every(r => cetakKartuState.selected.has(r.id));

  // Update count & button
  const el = document.getElementById('cetak-count');
  if (el) el.textContent = cetakKartuState.selected.size;
  const btn = document.querySelector('[onclick="cetakKartuPDF()"]');
  if (btn) btn.disabled = cetakKartuState.selected.size === 0;

  // Re-render row highlight if needed
  renderCetakKartuPage();
}

function cetakToggleAll(checked) {
  const filtered = getCetakFilteredData();
  filtered.forEach(r => {
    if (checked) cetakKartuState.selected.add(r.id);
    else cetakKartuState.selected.delete(r.id);
  });
  renderCetakKartuPage();
}

function cetakSelectAll() {
  const filtered = getCetakFilteredData();
  filtered.forEach(r => cetakKartuState.selected.add(r.id));
  renderCetakKartuPage();
}

function cetakClearAll() {
  cetakKartuState.selected.clear();
  renderCetakKartuPage();
}

function cetakOnSearch(val) {
  cetakKartuState.search = val;
  renderCetakKartuPage();
}

function cetakOnFilterBranch(val) {
  cetakKartuState.filterBranch = val;
  renderCetakKartuPage();
}

async function cetakKartuPDF() {
  const ids = [...cetakKartuState.selected];
  if (ids.length === 0) { alert('Pilih minimal 1 peserta.'); return; }

  const loadingModal = document.createElement('div');
  loadingModal.id = 'cetak-loading-overlay';
  loadingModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
  loadingModal.innerHTML = `<div style="background:var(--bg-card);padding:32px 40px;border-radius:16px;text-align:center;min-width:280px;">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--primary-600);margin-bottom:16px;display:block;"></i>
    <div style="font-weight:700;font-size:1.1rem;margin-bottom:6px;">Memuat kartu peserta...</div>
    <div id="cetak-progress" style="color:var(--text-muted);font-size:0.85rem;">0 / ${ids.length}</div>
  </div>`;
  document.body.appendChild(loadingModal);

  try {
    const cards = [];
    for (let i = 0; i < ids.length; i++) {
      const progressEl = document.getElementById('cetak-progress');
      if (progressEl) progressEl.textContent = `${i + 1} / ${ids.length}`;
      const res = await apiRequest(`/api/cards/${ids[i]}`);
      if (res.success && res.data) cards.push(res.data);
    }

    document.body.removeChild(loadingModal);
    openBulkPrintWindow(cards);
  } catch (e) {
    document.body.removeChild(loadingModal);
    alert('Gagal memuat kartu: ' + e.message);
  }
}

function buildCardHTML(card) {
  const isTeam = card.participant_type === 'TEAM';
  const memberCount = (isTeam && card.members) ? card.members.length : 0;
  const chipFontSize = memberCount > 4 ? '6px' : memberCount > 2 ? '6.8px' : '7.5px';
  const chipPadding = memberCount > 4 ? '1px 5px' : '2px 7px';

  const membersHTML = isTeam && card.members && card.members.length > 0
    ? card.members.map(m => `<span style="background:#e0e7ff;border:1px solid #c7d2fe;padding:${chipPadding};border-radius:4px;font-size:${chipFontSize};font-weight:700;color:#3730a3;margin:1px 2px 1px 0;display:inline-block;text-transform:uppercase;">${m.memberName}</span>`).join('')
    : '';

  return `
    <div class="print-card" style="width:10cm;height:14cm;max-width:10cm;max-height:14cm;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;text-transform:uppercase !important;">

      <!-- TOP SECTION -->
      <div style="flex-shrink:0;">
        <!-- HEADER BANNER -->
        <div class="card-banner" style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #f59e0b;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <img src="${card.logo_url || '/static/img/logo_e7a8b6a95d.webp'}" alt="Logo"
              style="height:32px;width:32px;object-fit:contain;background:#fff;padding:2px;border-radius:5px;box-shadow:0 2px 4px rgba(0,0,0,0.25);"
              onerror="this.style.display='none'">
            <div>
              <div style="font-size:9.5px;font-weight:800;color:#fff;line-height:1.2;text-transform:uppercase;">${card.app_short_name || 'MASKUMAMBANG FEST #4'}</div>
              <div style="font-size:7px;color:rgba(255,255,255,0.85);margin-top:1px;text-transform:uppercase;">${card.category_name} · JENJANG ${card.level_name}</div>
            </div>
          </div>
          <span style="background:rgba(245,158,11,0.2);border:1px solid #f59e0b;color:#fbbf24;font-size:6px;font-weight:800;padding:2px 6px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">${isTeam ? 'TIM / BEREGU' : 'PERORANGAN'}</span>
        </div>

        <!-- LABEL KARTU -->
        <div style="background:#f1f5f9;text-align:center;padding:3px;border-bottom:1px solid #e2e8f0;flex-shrink:0;">
          <span style="font-size:6.5px;font-weight:800;color:#475569;letter-spacing:0.12em;text-transform:uppercase;">✦ KARTU PESERTA RESMI ✦</span>
        </div>

        <!-- NO REG -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1.2px dashed #a5b4fc;padding:4px 8px;margin:6px 8px 0;border-radius:5px;flex-shrink:0;">
          <span style="font-size:6.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">NO. REGISTRASI:</span>
          <span style="font-size:9px;font-weight:800;color:#4338ca;font-family:monospace;letter-spacing:0.05em;text-transform:uppercase;">${card.registration_number}</span>
        </div>
      </div>

      <!-- INFO PESERTA (COMPACT, AUTO-WRAP & SCALED) -->
      <div style="padding:4px 8px;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;">
        <div style="margin-bottom:3px;">
          <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;">NAMA ${isTeam ? 'TIM' : 'PESERTA'}:</div>
          <div style="font-size:${isTeam ? '9.2px' : '10px'};font-weight:800;color:#1e1b4b;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.participant_name}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;margin-bottom:3px;">
          <div style="min-width:0;">
            <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;">ASAL SEKOLAH:</div>
            <div style="font-size:7.2px;font-weight:700;color:#0f172a;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.school_name}</div>
          </div>
          <div style="min-width:0;">
            <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;">CABANG LOMBA:</div>
            <div style="font-size:7.2px;font-weight:700;color:#4338ca;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.branch_name}</div>
          </div>
          ${card.mentor_name && card.mentor_name !== '-' ? `
          <div style="min-width:0;">
            <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;">PEMBIMBING:</div>
            <div style="font-size:6.8px;font-weight:600;color:#334155;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.mentor_name}</div>
          </div>` : ''}
          ${isTeam && card.leader_name ? `
          <div style="min-width:0;">
            <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;">KETUA TIM:</div>
            <div style="font-size:6.8px;font-weight:700;color:#0f172a;line-height:1.2;margin-top:1px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;">${card.leader_name}</div>
          </div>` : ''}
        </div>

        ${membersHTML ? `
        <div style="border-top:1px dashed #cbd5e1;padding-top:3px;margin-top:2px;">
          <div style="font-size:6.2px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:1px;">ANGGOTA TIM:</div>
          <div style="line-height:1.2;">${membersHTML}</div>
        </div>` : ''}
      </div>

      <!-- BOTTOM SECTION: QR CODE & FOOTER -->
      <div style="flex-shrink:0;">
        <!-- QR CODE — FIT UKURAN 10x14cm -->
        <div style="background:linear-gradient(to bottom,#f8fafc,#eef2ff);border-top:1.5px solid #e0e7ff;padding:6px 8px;display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          <div style="background:#fff;border:2px solid #c7d2fe;border-radius:6px;padding:4px;box-shadow:0 2px 8px rgba(67,56,202,0.12);display:inline-block;">
            <img src="${card.qr_data_uri}" alt="QR Check-in" style="width:95px;height:95px;display:block;border-radius:3px;">
          </div>
          <div style="margin-top:3px;font-size:6.5px;font-weight:800;color:#4338ca;letter-spacing:0.1em;text-transform:uppercase;">◈ SCAN UNTUK CHECK-IN ◈</div>
          <div style="font-size:5.5px;color:#94a3b8;margin-top:1px;text-transform:uppercase;">TUNJUKKAN KARTU INI SAAT MEMASUKI AREA LOMBA</div>
        </div>

        <!-- FOOTER -->
        <div style="background:#1e1b4b;padding:4px 10px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
          <span style="display:inline-flex;align-items:center;gap:3px;color:#4ade80;font-size:6.5px;font-weight:800;text-transform:uppercase;">✓ TERVERIFIKASI RESMI</span>
          <span style="font-size:6px;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:0.04em;">www.maskumambang.ac.id</span>
        </div>
      </div>

    </div>
  `;
}

function openBulkPrintWindow(cards) {
  const printWin = window.open('', '_blank', 'width=900,height=700');
  if (!printWin) { alert('Popup diblokir browser. Izinkan popup dan coba lagi.'); return; }

  const cardsHTML = cards.map(buildCardHTML).join('');

  printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Cetak Kartu Peserta — ${cards.length} Kartu</title>
<style>
  @page {
    size: 10cm 14cm portrait;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    text-transform: uppercase !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cards-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
  }
  .print-card {
    width: 10cm;
    height: 14cm;
    max-width: 10cm;
    max-height: 14cm;
    background: #ffffff;
    border: 1.5px solid #0f172a;
    border-radius: 10px;
    overflow: hidden;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    display: flex;
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
    text-transform: uppercase !important;
  }
  .card-banner {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
    color: #fff;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f59e0b;
    flex-shrink: 0;
  }
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .print-card {
      page-break-after: always;
      break-after: page;
      border: none !important;
      border-radius: 0 !important;
      width: 10cm !important;
      height: 14cm !important;
      max-height: 14cm !important;
    }
  }
</style>
</head>
<body>
  <div class="no-print" style="background:#1e1b4b;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif;text-transform:none;">
    <div>
      <strong style="font-size:1rem;">🖨️ Cetak Kartu Peserta Massal</strong>
      <span style="margin-left:12px;font-size:0.85rem;opacity:0.8;">${cards.length} KARTU SIAP DICETAK · UKURAN: 10CM × 14CM</span>
    </div>
    <button onclick="window.print()" style="background:#f59e0b;color:#1e1b4b;border:none;padding:10px 24px;border-radius:8px;font-size:0.95rem;font-weight:800;cursor:pointer;">
      🖨️ PRINT / SIMPAN PDF
    </button>
  </div>
  <div class="cards-wrapper">
    ${cardsHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(() => window.print(), 800);
    };
  <\/script>
</body>
</html>`);
  printWin.document.close();
}

window.renderCetakKartuView = renderCetakKartuView;
window.cetakToggleOne = cetakToggleOne;
window.cetakToggleAll = cetakToggleAll;
window.cetakSelectAll = cetakSelectAll;
window.cetakClearAll = cetakClearAll;
window.cetakOnSearch = cetakOnSearch;
window.cetakOnFilterBranch = cetakOnFilterBranch;
window.cetakKartuPDF = cetakKartuPDF;
window.cetakRowClick = cetakRowClick;
window.printSingleCardPopup = printSingleCardPopup;
window.switchCameraMode = switchCameraMode;
window.switchCheckInStage = switchCheckInStage;


// Peserta wizard handlers
window.onWizardCatSelect = onWizardCatSelect;
window.onWizardLvlSelect = onWizardLvlSelect;
window.onWizardBranchSelect = onWizardBranchSelect;
window.addWizTeamMemberRow = addWizTeamMemberRow;
window.previewProofImage = previewProofImage;
window.handleFullRegistrationSubmit = handleFullRegistrationSubmit;
window.handleReuploadSubmit = handleReuploadSubmit;

// Bendahara payment verification & check-in handlers
window.openPaymentVerifyModal = openPaymentVerifyModal;
window.executeApprovePayment = executeApprovePayment;
window.promptRejectPayment = promptRejectPayment;
window.executeRejectPayment = executeRejectPayment;
window.executeCheckIn = executeCheckIn;
window.handleManualCheckInSubmit = handleManualCheckInSubmit;
window.loadLiveCheckInLogs = loadLiveCheckInLogs;

// Super Admin user management handlers
window.openCreateUserModal = openCreateUserModal;
window.submitCreateUser = submitCreateUser;
window.executeToggleUserStatus = executeToggleUserStatus;
window.openChangeRoleModal = openChangeRoleModal;
window.submitChangeRole = submitChangeRole;
window.openResetPasswordModal = openResetPasswordModal;
window.submitAdminResetPass = submitAdminResetPass;
window.toggleUserDropdown = toggleUserDropdown;
window.closeAllUserDropdowns = closeAllUserDropdowns;
window.toggleUserSelect = toggleUserSelect;
window.toggleSelectAllUsers = toggleSelectAllUsers;
window.clearSelectedUsers = clearSelectedUsers;
window.confirmDeleteUser = confirmDeleteUser;
window.executeDeleteUser = executeDeleteUser;
window.executeBulkDeleteUsers = executeBulkDeleteUsers;
window.submitBulkDeleteUsers = submitBulkDeleteUsers;

// Super Admin master kategori & jenjang handlers
window.openCreateCategoryModal = openCreateCategoryModal;
window.submitCreateCategory = submitCreateCategory;
window.openEditCategoryModal = openEditCategoryModal;
window.submitEditCategory = submitEditCategory;
window.executeDeleteCategory = executeDeleteCategory;
window.openCreateLevelModal = openCreateLevelModal;
window.onJenjangPresetChange = onJenjangPresetChange;
window.submitCreateLevel = submitCreateLevel;
window.openEditLevelModal = openEditLevelModal;
window.submitEditLevel = submitEditLevel;
window.executeDeleteLevel = executeDeleteLevel;
window.toggleCatStatus = toggleCatStatus;

// Super Admin master cabang lomba handlers
window.openCreateBranchModal = openCreateBranchModal;
window.submitCreateBranch = submitCreateBranch;
window.openEditBranchModal = openEditBranchModal;
window.submitEditBranch = submitEditBranch;
window.executeDeleteBranch = executeDeleteBranch;
window.toggleBranchStatus = toggleBranchStatus;
window.toggleBranchTeamFields = toggleBranchTeamFields;

// Super Admin payment account handlers
window.openCreateAccountModal = openCreateAccountModal;
window.openCreatePaymentModal = openCreateAccountModal; // Alias for compatibility
window.submitCreateAccount = submitCreateAccount;
window.openEditAccountModal = openEditAccountModal;
window.submitEditAccount = submitEditAccount;
window.executeDeleteAccount = executeDeleteAccount;
window.toggleAccountStatus = toggleAccountStatus;

// Super Admin settings & security handlers
window.handleBrandingSave = handleBrandingSave;
window.previewBrandingFile = previewBrandingFile;
window.renderAdminCountdownView = renderAdminCountdownView;
window.handleCountdownSave = handleCountdownSave;
window.initHomepageCountdown = initHomepageCountdown;
window.handleOperationalResetSubmit = handleOperationalResetSubmit;
window.handlePasswordChangeSubmit = handlePasswordChangeSubmit;

// Super Admin Excel / CSV Export Handlers
window.exportTableDataToExcel = exportTableDataToExcel;
window.exportAdminRegistrationsExcel = exportAdminRegistrationsExcel;
window.exportAdminUsersExcel = exportAdminUsersExcel;
window.exportAdminBranchesExcel = exportAdminBranchesExcel;
window.exportAdminAuditExcel = exportAdminAuditExcel;
window.exportAdminBranchStatsExcel = exportAdminBranchStatsExcel;
window.exportAdminPaymentAccountsExcel = exportAdminPaymentAccountsExcel;
window.exportBendaharaPaymentsExcel = exportBendaharaPaymentsExcel;
window.exportCheckInLogsExcel = exportCheckInLogsExcel;
window.loadLiveCheckInLogs = loadLiveCheckInLogs;

// UI & Responsive Drawer Navigation Handlers
window.togglePublicMenu = togglePublicMenu;
window.closePublicMenu = closePublicMenu;
window.toggleSidebarDrawer = toggleSidebarDrawer;
window.closeSidebarDrawer = closeSidebarDrawer;

// Global Delegated Click Handlers (Auto-close on backdrop / nav click)
document.addEventListener('click', function (e) {
  if (e.target.closest('.sidebar-backdrop') || e.target.closest('.sidebar-close-btn')) {
    closeSidebarDrawer();
  } else if (e.target.closest('.sidebar-nav-item')) {
    closeSidebarDrawer();
  } else if (e.target.closest('.public-navbar .nav-link') || e.target.closest('.public-navbar #auth-buttons-nav .btn')) {
    closePublicMenu();
  }
});

