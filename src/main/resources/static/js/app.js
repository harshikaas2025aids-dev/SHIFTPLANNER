/* ==========================================================================
   SHIFT PLANNER - MAIN APPLICATION SCRIPT
   ========================================================================== */

import { EmployeeAPI, ShiftAPI, RosterAPI, SwapAPI } from './api.js';

// Global Application State
const state = {
  currentView: 'dashboard',
  employees: [],
  shifts: [],
  rosters: [],
  swaps: [],
  searchQuery: '',
  deleteTarget: null, // { type: 'employee'|'shift'|'roster'|'swap', id: number }
  theme: localStorage.getItem('shiftplanner_theme') || 'light',
  notifications: ['System synced with Spring Boot REST API']
};

// Global Delete Functions (Defined early for window scope availability)
window.confirmDelete = function(type, id) {
  console.log("Selected swap request / record ID:", id);
  console.log("OPENING DELETE CONFIRMATION MODAL for type:", type, "id:", id);
  state.deleteTarget = { type: String(type).toLowerCase(), id: Number(id) };
  
  const labelEl = document.getElementById('delete-target-label');
  if (labelEl) {
    const typeName = state.deleteTarget.type === 'swap' ? 'swap request' : state.deleteTarget.type;
    labelEl.textContent = `Are you sure you want to delete this ${typeName}?`;
  }
  
  // Open confirmation modal without clearing state.deleteTarget
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  const modal = document.getElementById('modal-delete-confirm');
  if (modal) {
    modal.classList.add('active');
    refreshIcons();
  }
};

window.handleDoDelete = async function() {
  console.log("CONFIRM DELETE CLICKED");
  console.log("DELETE FUNCTION CALLED");
  
  if (!state.deleteTarget || !state.deleteTarget.id) {
    console.error("DELETE FAILED: No delete target ID found in state!");
    return;
  }

  const { type, id } = state.deleteTarget;
  const swapRequestId = id;
  const deleteUrl = `http://localhost:8080/api/${type === 'swap' ? 'swaps' : type === 'employee' ? 'employees' : type === 'shift' ? 'shifts' : 'rosters'}/${swapRequestId}`;

  console.log("DELETE SWAP REQUEST");
  console.log("SwapRequest ID:", swapRequestId);
  console.log("DELETE URL:", deleteUrl);

  const btnDoDelete = document.getElementById('btn-do-delete');
  if (btnDoDelete) {
    btnDoDelete.disabled = true;
    btnDoDelete.textContent = 'Deleting...';
  }

  try {
    let successMessage = '';
    const response = await fetch(deleteUrl, { method: "DELETE" });
    console.log("DELETE STATUS:", response.status);

    if (!response.ok && response.status !== 204 && response.status !== 200) {
      let errorMsg = `Delete failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) errorMsg = errorData.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    if (type === 'employee') {
      state.employees = state.employees.filter(e => e.id !== id);
      successMessage = 'Employee deleted successfully.';
    } else if (type === 'shift') {
      state.shifts = state.shifts.filter(s => s.id !== id);
      successMessage = 'Shift deleted successfully.';
    } else if (type === 'roster') {
      state.rosters = state.rosters.filter(r => r.id !== id);
      successMessage = 'Roster deleted successfully.';
    } else if (type === 'swap') {
      state.swaps = state.swaps.filter(w => w.id !== id);
      successMessage = 'Swap request deleted successfully.';
    }

    // Show Notification Toast
    showToast(successMessage, 'success');

    // Add entry to Notifications Panel
    state.notifications.unshift(`${successMessage} (#${id})`);
    renderNotifications();

    // Clear target state, close modal & reload state from backend
    state.deleteTarget = null;
    closeAllModals();
    renderCurrentView();
    renderDashboardStats();
    await loadAllData();
  } catch (err) {
    console.error(`DELETE FAILED for ${type} #${id}:`, err);
    showToast(err.message || `Unable to delete ${type}. Please try again.`, 'error');
  } finally {
    if (btnDoDelete) {
      btnDoDelete.disabled = false;
      btnDoDelete.textContent = 'Delete';
    }
  }
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  loadAllData();
  updateLiveDate();
});

function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}

function updateLiveDate() {
  const dateElement = document.getElementById('header-live-date');
  if (dateElement) {
    const now = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-GB', options);
  }
}

// ==========================================================================
// EVENT LISTENERS & ROUTING
// ==========================================================================

function setupEventListeners() {
  // Navigation Routing
  document.querySelectorAll('[data-view-target]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view-target');
      switchView(targetView);
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Global Search Input
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderCurrentView();
    });
  }

  // Notifications Bell Toggle
  const notifBtn = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notifications-panel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPanel.classList.remove('active');
      }
    });
  }

  // Admin Profile Dropdown Toggle
  const adminBtn = document.getElementById('admin-profile-btn');
  const adminMenu = document.getElementById('admin-dropdown-menu');
  if (adminBtn && adminMenu) {
    adminBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adminMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!adminMenu.contains(e.target) && !adminBtn.contains(e.target)) {
        adminMenu.classList.remove('active');
      }
    });
  }

  // Admin Dropdown Theme Toggle
  const adminThemeToggle = document.getElementById('admin-dropdown-theme-toggle');
  if (adminThemeToggle) {
    adminThemeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) themeToggle.click();
      if (adminMenu) adminMenu.classList.remove('active');
    });
  }

  // Admin Logout Button
  const adminLogoutBtn = document.getElementById('admin-dropdown-logout');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (adminMenu) adminMenu.classList.remove('active');
      showToast('Logged out of Admin session.', 'info');
    });
  }

  // Theme Toggle Button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('shiftplanner_theme', state.theme);
      initTheme();
      showToast(`Switched to ${state.theme} mode`, 'info');
    });
  }

  // Modal Backdrop Click to Close
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

  // Modal Close Buttons
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeAllModals());
  });

  // Form Submission Handlers
  setupFormHandlers();
}

function switchView(viewName) {
  state.currentView = viewName;

  // Update Sidebar active state
  document.querySelectorAll('.sidebar .nav-item').forEach(nav => {
    if (nav.getAttribute('data-view-target') === viewName) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });

  // Update Header Title Context
  const pageTitle = document.getElementById('header-page-title');
  if (pageTitle) {
    const titles = {
      dashboard: 'Dashboard Overview',
      employees: 'Employee Management',
      shifts: 'Shift Scheduling',
      rosters: 'Roster Assignments',
      swaps: 'Shift Swap Requests',
      reports: 'Workforce Reports',
      settings: 'System Settings'
    };
    pageTitle.textContent = titles[viewName] || 'Dashboard';
  }

  // Show Active View
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Close Mobile Nav if open
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');

  renderCurrentView();
}

// ==========================================================================
// DATA FETCHING & STATE SYNC
// ==========================================================================

async function loadAllData() {
  try {
    const [employees, shifts, rosters, swaps] = await Promise.all([
      EmployeeAPI.getAll().catch(() => []),
      ShiftAPI.getAll().catch(() => []),
      RosterAPI.getAll().catch(() => []),
      SwapAPI.getAll().catch(() => [])
    ]);

    state.employees = employees || [];
    state.shifts = shifts || [];
    state.rosters = rosters || [];
    state.swaps = swaps || [];

    renderCurrentView();
    renderDashboardStats();
    renderNotifications();
    refreshIcons();
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showToast('Failed to connect to Spring Boot backend.', 'error');
  }
}

// ==========================================================================
// VIEW RENDERERS
// ==========================================================================

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'employees':
      renderEmployeesPage();
      break;
    case 'shifts':
      renderShiftsPage();
      break;
    case 'rosters':
      renderRostersPage();
      break;
    case 'swaps':
      renderSwapsPage();
      break;
    case 'reports':
      renderReportsPage();
      break;
    case 'settings':
      // Settings view is static/interactive
      break;
  }
  refreshIcons();
}

// --- DASHBOARD RENDERER ---
function renderDashboard() {
  renderDashboardStats();
  renderUpcomingShifts();
  renderShiftDistributionChart();
  renderRecentSwapRequests();
  renderDashboardMiniTables();
}

function renderDashboardStats() {
  // Update Live Counts from Backend Arrays
  const empCountEl = document.getElementById('stat-emp-count');
  const shiftCountEl = document.getElementById('stat-shift-count');
  const swapCountEl = document.getElementById('stat-swap-count');
  const rosterCountEl = document.getElementById('stat-roster-count');

  if (empCountEl) empCountEl.textContent = state.employees.length;
  if (shiftCountEl) shiftCountEl.textContent = state.shifts.length;
  if (swapCountEl) swapCountEl.textContent = state.swaps.length;
  if (rosterCountEl) rosterCountEl.textContent = state.rosters.length;
}

function renderUpcomingShifts() {
  const container = document.getElementById('upcoming-shifts-list');
  if (!container) return;

  if (state.shifts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="calendar-x" class="empty-icon"></i>
        <div class="empty-title">No Shifts Scheduled</div>
        <div class="empty-subtitle">Add shifts to see upcoming schedule.</div>
      </div>
    `;
    return;
  }

  // Sort shifts by date/time
  const sortedShifts = [...state.shifts].slice(0, 3);

  container.innerHTML = sortedShifts.map(shift => {
    const shiftType = getShiftCategory(shift.startTime);
    const assignedCount = state.rosters.filter(r => r.shift && r.shift.id === shift.id).length;
    const formattedDate = formatDateShort(shift.shiftDate);

    return `
      <div class="shift-item-row">
        <div class="shift-date-badge">
          <div class="shift-date-day">${formattedDate.day}</div>
          <div class="shift-date-month">${formattedDate.month}</div>
        </div>
        <div class="shift-details">
          <div class="shift-type-icon">
            <i data-lucide="${shiftType.icon}"></i>
          </div>
          <div>
            <div class="shift-info-name">${shiftType.name}</div>
            <div class="shift-info-time">${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}</div>
          </div>
        </div>
        <div class="shift-count-pill">${assignedCount} Employee${assignedCount !== 1 ? 's' : ''}</div>
      </div>
    `;
  }).join('');
}

function renderShiftDistributionChart() {
  let morning = 0, afternoon = 0, night = 0;
  state.shifts.forEach(shift => {
    const category = getShiftCategory(shift.startTime).key;
    if (category === 'morning') morning++;
    else if (category === 'afternoon') afternoon++;
    else night++;
  });

  const total = state.shifts.length;

  const totalEl = document.getElementById('chart-total-count');
  if (totalEl) totalEl.textContent = total;

  const legendMorning = document.getElementById('legend-val-morning');
  const legendAfternoon = document.getElementById('legend-val-afternoon');
  const legendNight = document.getElementById('legend-val-night');

  if (legendMorning) legendMorning.textContent = morning;
  if (legendAfternoon) legendAfternoon.textContent = afternoon;
  if (legendNight) legendNight.textContent = night;

  // SVG Donut calculation
  const circle = document.getElementById('donut-circle-segment');
  if (circle && total > 0) {
    const percentage = (morning / total) * 100;
    const strokeDash = `${percentage} 100`;
    circle.setAttribute('stroke-dasharray', strokeDash);
  }
}

function renderRecentSwapRequests() {
  const container = document.getElementById('recent-swaps-list');
  if (!container) return;

  if (state.swaps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="arrow-left-right" class="empty-icon"></i>
        <div class="empty-title">No Swap Requests</div>
        <div class="empty-subtitle">Employee swap requests will appear here.</div>
      </div>
    `;
    return;
  }

  const recent = [...state.swaps].slice(0, 3);

  container.innerHTML = recent.map(swap => {
    const reqName = swap.requester ? swap.requester.name : 'Unknown';
    const colName = swap.colleague ? swap.colleague.name : 'Unknown';
    const initials = getInitials(reqName);
    const badgeClass = getStatusBadgeClass(swap.status);

    return `
      <div class="shift-item-row" style="margin-bottom: 8px;">
        <div class="user-avatar" style="background-color: var(--primary-teal);">
          ${initials}
        </div>
        <div style="flex: 1; margin: 0 12px;">
          <div class="shift-info-name">${reqName} &rarr; ${colName}</div>
          <div class="shift-info-time">${swap.roster && swap.roster.shift ? swap.roster.shift.shiftDate : 'Recent'}</div>
        </div>
        <span class="badge ${badgeClass}">${swap.status}</span>
      </div>
    `;
  }).join('');
}

function renderDashboardMiniTables() {
  // Mini Employees Table
  const empTbody = document.getElementById('dash-emp-tbody');
  if (empTbody) {
    const list = state.employees.slice(0, 3);
    empTbody.innerHTML = list.map(emp => `
      <tr>
        <td>${emp.id}</td>
        <td><strong>${emp.name}</strong></td>
        <td>${emp.email}</td>
        <td><span class="badge ${emp.role === 'MANAGER' ? 'badge-manager' : 'badge-role'}">${emp.role}</span></td>
        <td>
          <div class="action-btn-group">
            <button class="btn-icon-action" onclick="openEditEmployeeModal(${emp.id})"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon-action delete" onclick="confirmDelete('employee', ${emp.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Mini Shifts Table
  const shiftTbody = document.getElementById('dash-shift-tbody');
  if (shiftTbody) {
    const list = state.shifts.slice(0, 3);
    shiftTbody.innerHTML = list.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${s.shiftDate}</td>
        <td>${formatTime(s.startTime)}</td>
        <td>${formatTime(s.endTime)}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn-icon-action" onclick="openEditShiftModal(${s.id})"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon-action delete" onclick="confirmDelete('shift', ${s.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Mini Rosters Table
  const rosterTbody = document.getElementById('dash-roster-tbody');
  if (rosterTbody) {
    const list = state.rosters.slice(0, 3);
    rosterTbody.innerHTML = list.map(r => `
      <tr>
        <td>${r.id}</td>
        <td><strong>${r.employee ? r.employee.name : 'N/A'}</strong></td>
        <td>${r.shift ? r.shift.shiftDate : 'N/A'}</td>
        <td>${r.shift ? `${formatTime(r.shift.startTime)} - ${formatTime(r.shift.endTime)}` : 'N/A'}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn-icon-action delete" onclick="confirmDelete('roster', ${r.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

// --- EMPLOYEES PAGE ---
function renderEmployeesPage() {
  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  const query = state.searchQuery;
  const filtered = state.employees.filter(emp =>
    emp.name.toLowerCase().includes(query) ||
    emp.email.toLowerCase().includes(query) ||
    emp.role.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i data-lucide="users" class="empty-icon"></i>
            <div class="empty-title">No Employees Found</div>
            <div class="empty-subtitle">Add your first employee to get started.</div>
            <button class="btn btn-primary btn-sm" onclick="openAddEmployeeModal()">+ Add Employee</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(emp => `
    <tr>
      <td>${emp.id}</td>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar" style="width:30px; height:30px; font-size:12px;">${getInitials(emp.name)}</div>
          <strong>${emp.name}</strong>
        </div>
      </td>
      <td>${emp.email}</td>
      <td><span class="badge ${emp.role === 'MANAGER' ? 'badge-manager' : 'badge-role'}">${emp.role}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-icon-action" title="Edit" onclick="openEditEmployeeModal(${emp.id})"><i data-lucide="edit-2"></i></button>
          <button class="btn-icon-action delete" title="Delete" onclick="confirmDelete('employee', ${emp.id})"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// --- SHIFTS PAGE ---
function renderShiftsPage() {
  const tbody = document.getElementById('shifts-tbody');
  if (!tbody) return;

  const query = state.searchQuery;
  const filtered = state.shifts.filter(s =>
    s.shiftDate.includes(query) ||
    s.startTime.includes(query) ||
    s.endTime.includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i data-lucide="calendar" class="empty-icon"></i>
            <div class="empty-title">No Shifts Found</div>
            <div class="empty-subtitle">Create a shift to organize employee work hours.</div>
            <button class="btn btn-primary btn-sm" onclick="openAddShiftModal()">+ Add Shift</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const category = getShiftCategory(s.startTime);
    return `
      <tr>
        <td>${s.id}</td>
        <td><strong>${s.shiftDate}</strong></td>
        <td>${formatTime(s.startTime)}</td>
        <td>${formatTime(s.endTime)}</td>
        <td>
          <span class="badge" style="background:#EBE7DF; color:var(--text-primary); font-size:11px;">
            <i data-lucide="${category.icon}" style="width:12px; height:12px; margin-right:4px;"></i>
            ${category.name}
          </span>
        </td>
        <td>
          <div class="action-btn-group">
            <button class="btn-icon-action" title="Edit" onclick="openEditShiftModal(${s.id})"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon-action delete" title="Delete" onclick="confirmDelete('shift', ${s.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- ROSTERS PAGE ---
function renderRostersPage() {
  const tbody = document.getElementById('rosters-tbody');
  if (!tbody) return;

  const query = state.searchQuery;
  const filtered = state.rosters.filter(r => {
    const empName = r.employee ? r.employee.name.toLowerCase() : '';
    const shiftDate = r.shift ? r.shift.shiftDate : '';
    return empName.includes(query) || shiftDate.includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i data-lucide="clipboard-list" class="empty-icon"></i>
            <div class="empty-title">No Roster Assignments</div>
            <div class="empty-subtitle">Assign employees to work shifts.</div>
            <button class="btn btn-primary btn-sm" onclick="openAssignRosterModal()">+ Assign Roster</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar" style="width:28px; height:28px; font-size:11px;">${getInitials(r.employee ? r.employee.name : 'N/A')}</div>
          <strong>${r.employee ? r.employee.name : 'N/A'}</strong>
        </div>
      </td>
      <td>${r.shift ? r.shift.shiftDate : 'N/A'}</td>
      <td>${r.shift ? `${formatTime(r.shift.startTime)} - ${formatTime(r.shift.endTime)}` : 'N/A'}</td>
      <td>
        <div class="action-btn-group">
          <button class="btn-icon-action delete" title="Remove Roster" onclick="confirmDelete('roster', ${r.id})"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// --- SWAP REQUESTS PAGE ---
function renderSwapsPage() {
  // Stat counters
  const pendingCount = state.swaps.filter(s => s.status === 'PENDING').length;
  const acceptedCount = state.swaps.filter(s => s.status === 'ACCEPTED').length;
  const declinedCount = state.swaps.filter(s => s.status === 'DECLINED').length;
  const approvedCount = state.swaps.filter(s => s.status === 'APPROVED').length;

  const countPending = document.getElementById('swap-stat-pending');
  const countAccepted = document.getElementById('swap-stat-accepted');
  const countDeclined = document.getElementById('swap-stat-declined');
  const countApproved = document.getElementById('swap-stat-approved');

  if (countPending) countPending.textContent = pendingCount;
  if (countAccepted) countAccepted.textContent = acceptedCount;
  if (countDeclined) countDeclined.textContent = declinedCount;
  if (countApproved) countApproved.textContent = approvedCount;

  const tbody = document.getElementById('swaps-tbody');
  if (!tbody) return;

  const query = state.searchQuery;
  const filtered = state.swaps.filter(s => {
    const req = s.requester ? s.requester.name.toLowerCase() : '';
    const col = s.colleague ? s.colleague.name.toLowerCase() : '';
    const st = s.status ? s.status.toLowerCase() : '';
    return req.includes(query) || col.includes(query) || st.includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i data-lucide="arrow-left-right" class="empty-icon"></i>
            <div class="empty-title">No Swap Requests</div>
            <div class="empty-subtitle">Create a swap request between colleagues.</div>
            <button class="btn btn-primary btn-sm" onclick="openRequestSwapModal()">+ Request Shift Swap</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const badgeClass = getStatusBadgeClass(s.status);
    const reqName = s.requester ? s.requester.name : 'N/A';
    const colName = s.colleague ? s.colleague.name : 'N/A';
    const shiftInfo = s.roster && s.roster.shift ? `${s.roster.shift.shiftDate} (${formatTime(s.roster.shift.startTime)})` : 'N/A';

    return `
      <tr>
        <td>#${s.id}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="user-avatar" style="width:26px; height:26px; font-size:10px;">${getInitials(reqName)}</div>
            ${reqName}
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="user-avatar" style="width:26px; height:26px; font-size:10px; background:#687B85;">${getInitials(colName)}</div>
            ${colName}
          </div>
        </td>
        <td>${shiftInfo}</td>
        <td><span class="badge ${badgeClass}">${s.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openSwapTimelineModal(${s.id})">
            <i data-lucide="eye" style="width:14px;"></i> Timeline
          </button>
        </td>
        <td>
          <div class="action-btn-group">
            ${s.status === 'PENDING' ? `
              <button class="btn btn-accent btn-sm" onclick="colleagueAcceptSwap(${s.id})">Colleague Accept</button>
              <button class="btn btn-secondary btn-sm" onclick="colleagueDeclineSwap(${s.id})">Decline</button>
            ` : ''}
            ${s.status === 'ACCEPTED' ? `
              <button class="btn btn-primary btn-sm" onclick="managerApproveSwap(${s.id})">Manager Approve</button>
            ` : ''}
            <button class="btn-icon-action delete" title="Delete Request" onclick="confirmDelete('swap', ${s.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- REPORTS PAGE ---
function renderReportsPage() {
  // Update report summary cards
  const rEmp = document.getElementById('report-total-emp');
  const rShift = document.getElementById('report-total-shifts');
  const rRoster = document.getElementById('report-total-rosters');
  const rSwap = document.getElementById('report-total-swaps');

  if (rEmp) rEmp.textContent = state.employees.length;
  if (rShift) rShift.textContent = state.shifts.length;
  if (rRoster) rRoster.textContent = state.rosters.length;
  if (rSwap) rSwap.textContent = state.swaps.length;
}

// ==========================================================================
// MODALS & FORM ACTIONS
// ==========================================================================

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('active');
  });
}

function openModal(modalId) {
  closeAllModals();
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    refreshIcons();
  }
}

// --- EMPLOYEE MODAL ---
window.openAddEmployeeModal = function() {
  document.getElementById('modal-employee-title').textContent = 'Add New Employee';
  document.getElementById('emp-id').value = '';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-email').value = '';
  document.getElementById('emp-role').value = 'EMPLOYEE';
  openModal('modal-employee');
};

window.openEditEmployeeModal = function(id) {
  const emp = state.employees.find(e => e.id === id);
  if (!emp) return;
  document.getElementById('modal-employee-title').textContent = 'Edit Employee';
  document.getElementById('emp-id').value = emp.id;
  document.getElementById('emp-name').value = emp.name;
  document.getElementById('emp-email').value = emp.email;
  document.getElementById('emp-role').value = emp.role;
  openModal('modal-employee');
};

// --- SHIFT MODAL ---
window.openAddShiftModal = function() {
  document.getElementById('modal-shift-title').textContent = 'Add New Shift';
  document.getElementById('shift-id').value = '';
  document.getElementById('shift-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('shift-start').value = '09:00';
  document.getElementById('shift-end').value = '17:00';
  openModal('modal-shift');
};

window.openEditShiftModal = function(id) {
  const shift = state.shifts.find(s => s.id === id);
  if (!shift) return;
  document.getElementById('modal-shift-title').textContent = 'Edit Shift';
  document.getElementById('shift-id').value = shift.id;
  document.getElementById('shift-date').value = shift.shiftDate;
  document.getElementById('shift-start').value = shift.startTime ? shift.startTime.substring(0, 5) : '09:00';
  document.getElementById('shift-end').value = shift.endTime ? shift.endTime.substring(0, 5) : '17:00';
  openModal('modal-shift');
};

// --- ROSTER MODAL ---
window.openAssignRosterModal = function() {
  const empSelect = document.getElementById('roster-emp-select');
  const shiftSelect = document.getElementById('roster-shift-select');

  if (empSelect) {
    empSelect.innerHTML = state.employees.map(e => `
      <option value="${e.id}">${e.name} (${e.role})</option>
    `).join('');
  }

  if (shiftSelect) {
    shiftSelect.innerHTML = state.shifts.map(s => `
      <option value="${s.id}">${s.shiftDate} | ${formatTime(s.startTime)} - ${formatTime(s.endTime)}</option>
    `).join('');
  }

  openModal('modal-roster');
};

// --- SWAP MODAL ---
window.openRequestSwapModal = function() {
  const rosterSelect = document.getElementById('swap-roster-select');
  const reqSelect = document.getElementById('swap-req-select');
  const colSelect = document.getElementById('swap-col-select');

  if (rosterSelect) {
    rosterSelect.innerHTML = state.rosters.map(r => `
      <option value="${r.id}">Roster #${r.id}: ${r.employee ? r.employee.name : 'Unassigned'} - Shift ${r.shift ? r.shift.shiftDate : ''}</option>
    `).join('');
  }

  if (reqSelect) {
    reqSelect.innerHTML = state.employees.map(e => `
      <option value="${e.id}">${e.name}</option>
    `).join('');
  }

  if (colSelect) {
    colSelect.innerHTML = state.employees.map(e => `
      <option value="${e.id}">${e.name}</option>
    `).join('');
  }

  openModal('modal-swap');
};

// --- SWAP TIMELINE MODAL ---
window.openSwapTimelineModal = function(id) {
  const swap = state.swaps.find(s => s.id === id);
  if (!swap) return;

  const step1 = document.getElementById('tl-step-1');
  const step2 = document.getElementById('tl-step-2');
  const step3 = document.getElementById('tl-step-3');
  const step4 = document.getElementById('tl-step-4');

  if (step1) step1.className = 'timeline-step completed';

  if (step2) {
    if (swap.colleagueAccepted) step2.className = 'timeline-step completed';
    else if (swap.status === 'PENDING') step2.className = 'timeline-step active';
    else step2.className = 'timeline-step';
  }

  if (step3) {
    if (swap.managerApproved) step3.className = 'timeline-step completed';
    else if (swap.status === 'ACCEPTED') step3.className = 'timeline-step active';
    else step3.className = 'timeline-step';
  }

  if (step4) {
    if (swap.status === 'APPROVED') step4.className = 'timeline-step completed';
    else step4.className = 'timeline-step';
  }

  const detailsEl = document.getElementById('swap-timeline-details');
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div style="background:var(--main-bg); padding:16px; border-radius:12px; font-size:13.5px;">
        <div><strong>Request ID:</strong> #${swap.id}</div>
        <div><strong>Requester:</strong> ${swap.requester ? swap.requester.name : 'N/A'}</div>
        <div><strong>Colleague:</strong> ${swap.colleague ? swap.colleague.name : 'N/A'}</div>
        <div><strong>Colleague Accepted:</strong> ${swap.colleagueAccepted ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Manager Approved:</strong> ${swap.managerApproved ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Current Status:</strong> <span class="badge ${getStatusBadgeClass(swap.status)}">${swap.status}</span></div>
      </div>
    `;
  }

  openModal('modal-swap-timeline');
};

// --- SWAP ACTIONS ---

// ==========================================================================
// FORM SUBMISSION & BACKEND API CALLS
// ==========================================================================

function setupFormHandlers() {
  // Employee Form
  const empForm = document.getElementById('form-employee');
  if (empForm) {
    empForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('emp-id').value;
      const name = document.getElementById('emp-name').value.trim();
      const email = document.getElementById('emp-email').value.trim();
      const role = document.getElementById('emp-role').value;

      try {
        if (id) {
          await EmployeeAPI.update(id, { name, email, role });
          showToast('Employee updated successfully.', 'success');
        } else {
          await EmployeeAPI.create({ name, email, role });
          showToast('Employee created successfully.', 'success');
        }
        closeAllModals();
        loadAllData();
      } catch (err) {
        showToast(err.message || 'Failed to save employee.', 'error');
      }
    });
  }

  // Shift Form
  const shiftForm = document.getElementById('form-shift');
  if (shiftForm) {
    shiftForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('shift-id').value;
      const shiftDate = document.getElementById('shift-date').value;
      let startTime = document.getElementById('shift-start').value;
      let endTime = document.getElementById('shift-end').value;

      if (startTime.length === 5) startTime += ':00';
      if (endTime.length === 5) endTime += ':00';

      try {
        if (id) {
          await ShiftAPI.update(id, { shiftDate, startTime, endTime });
          showToast('Shift updated successfully.', 'success');
        } else {
          await ShiftAPI.create({ shiftDate, startTime, endTime });
          showToast('Shift created successfully.', 'success');
        }
        closeAllModals();
        loadAllData();
      } catch (err) {
        showToast(err.message || 'Failed to save shift.', 'error');
      }
    });
  }

  // Roster Form
  const rosterForm = document.getElementById('form-roster');
  if (rosterForm) {
    rosterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = document.getElementById('roster-emp-select').value;
      const shiftId = document.getElementById('roster-shift-select').value;

      try {
        await RosterAPI.create(empId, shiftId);
        showToast('Roster assigned successfully.', 'success');
        closeAllModals();
        loadAllData();
      } catch (err) {
        showToast(err.message || 'Failed to assign roster.', 'error');
      }
    });
  }

  // Swap Request Form
  const swapForm = document.getElementById('form-swap');
  if (swapForm) {
    swapForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rosterId = document.getElementById('swap-roster-select').value;
      const requesterId = document.getElementById('swap-req-select').value;
      const colleagueId = document.getElementById('swap-col-select').value;

      if (requesterId === colleagueId) {
        showToast('Requester and colleague must be different employees.', 'warning');
        return;
      }

      try {
        await SwapAPI.create(rosterId, requesterId, colleagueId);
        showToast('Swap request submitted successfully.', 'success');
        closeAllModals();
        loadAllData();
      } catch (err) {
        showToast(err.message || 'Failed to submit swap request.', 'error');
      }
    });
  }

  // Delete Confirm Action
  const btnDoDelete = document.getElementById('btn-do-delete');
  if (btnDoDelete) {
    btnDoDelete.addEventListener('click', window.handleDoDelete);
  }
}



// --- SWAP ACTIONS ---
window.colleagueAcceptSwap = async function(id) {
  try {
    await SwapAPI.accept(id);
    showToast('Colleague accepted swap request.', 'success');
    loadAllData();
  } catch (err) {
    showToast(err.message || 'Failed to accept swap.', 'error');
  }
};

window.colleagueDeclineSwap = async function(id) {
  try {
    await SwapAPI.decline(id);
    showToast('Colleague declined swap request.', 'info');
    loadAllData();
  } catch (err) {
    showToast(err.message || 'Failed to decline swap.', 'error');
  }
};

window.managerApproveSwap = async function(id) {
  try {
    await SwapAPI.approve(id);
    showToast('Manager approved swap! Rosters updated.', 'success');
    loadAllData();
  } catch (err) {
    // Shows overlapping or rules errors cleanly!
    showToast(err.message || 'Failed to approve swap.', 'error');
  }
};

// ==========================================================================
// TOAST & HELPER FUNCTIONS
// ==========================================================================

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-msg">${message}</div>
    <button class="modal-close" style="width:24px; height:24px; font-size:16px;">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function renderNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  const items = [
    'System synced with Spring Boot REST API',
    `Loaded ${state.employees.length} employees`,
    `Loaded ${state.shifts.length} active shifts`,
    `Active swap requests: ${state.swaps.length}`
  ];

  container.innerHTML = items.map(txt => `
    <div class="notification-item">
      <div>${txt}</div>
      <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Just now</div>
    </div>
  `).join('');
}

function getShiftCategory(startTime) {
  if (!startTime) return { key: 'morning', name: 'Morning Shift', icon: 'sun' };
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return { key: 'morning', name: 'Morning Shift', icon: 'sun' };
  if (hour >= 12 && hour < 17) return { key: 'afternoon', name: 'Afternoon Shift', icon: 'sun-medium' };
  return { key: 'night', name: 'Night Shift', icon: 'moon' };
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'PENDING': return 'badge-pending';
    case 'ACCEPTED': return 'badge-accepted';
    case 'DECLINED': return 'badge-declined';
    case 'APPROVED': return 'badge-approved';
    case 'REJECTED': return 'badge-rejected';
    default: return 'badge-role';
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatDateShort(dateStr) {
  if (!dateStr) return { day: '29', month: 'SEP' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '29', month: 'SEP' };
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: months[d.getMonth()]
  };
}

function formatTime(timeStr) {
  if (!timeStr) return '09:00';
  return timeStr.substring(0, 5);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
