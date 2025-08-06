// TVRI Equipment Management System - Main JavaScript
const API_BASE_URL = './api';

// Global variables
let currentTab = 'borrow';
let equipmentData = [];
let borrowingsData = [];
let statisticsData = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Initialize Bootstrap tooltips and popovers
function initializeApp() {
    // Initialize Bootstrap components
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('#mainTabs button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            currentTab = event.target.getAttribute('data-bs-target').replace('#', '');
            if (currentTab === 'return') {
                loadActiveBorrowings();
            } else if (currentTab === 'inventory') {
                loadEquipmentData();
            }
        });
    });

    // Equipment type change
    const equipmentTypeSelect = document.getElementById('equipmentType');
    if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', function() {
            loadEquipmentByType(this.value);
        });
    }

    // Form submissions
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', handleBorrowSubmit);
    }
}

// Load initial data
async function loadInitialData() {
    showLoadingOverlay('Memuat data inventaris...');
    
    try {
        await Promise.all([
            loadStatistics(),
            loadActiveBorrowings()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Gagal memuat data awal', 'danger');
    } finally {
        hideLoadingOverlay();
    }
}

// API Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// Load statistics
async function loadStatistics() {
    try {
        statisticsData = await apiRequest('statistics.php');
        updateStatisticsDisplay();
    } catch (error) {
        console.error('Error loading statistics:', error);
        showAlert('Gagal memuat statistik', 'danger');
    }
}

// Update statistics display
function updateStatisticsDisplay() {
    document.getElementById('totalEquipment').textContent = statisticsData.totalEquipment || 0;
    document.getElementById('availableEquipment').textContent = statisticsData.availableEquipment || 0;
    document.getElementById('borrowedEquipment').textContent = statisticsData.borrowedEquipment || 0;
    
    const lastUpdate = new Date(statisticsData.lastUpdate);
    document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleTimeString('id-ID');
}

// Load equipment by type
async function loadEquipmentByType(type) {
    const equipmentSelect = document.getElementById('equipmentName');
    
    if (!type) {
        equipmentSelect.innerHTML = '<option value="">Pilih jenis alat terlebih dahulu...</option>';
        equipmentSelect.disabled = true;
        return;
    }

    try {
        equipmentSelect.innerHTML = '<option value="">Memuat alat...</option>';
        equipmentSelect.disabled = true;

        const equipment = await apiRequest(`equipment.php?type=${encodeURIComponent(type)}`);
        
        equipmentSelect.innerHTML = '';
        
        if (equipment.length === 0) {
            equipmentSelect.innerHTML = '<option value="">Tidak ada alat tersedia</option>';
        } else {
            equipmentSelect.innerHTML = '<option value="">Pilih alat yang tersedia...</option>';
            equipment.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (${item.serial_number || 'No S/N'})`;
                equipmentSelect.appendChild(option);
            });
        }
        
        equipmentSelect.disabled = false;
    } catch (error) {
        console.error('Error loading equipment by type:', error);
        equipmentSelect.innerHTML = '<option value="">Error memuat alat</option>';
        showAlert('Gagal memuat daftar alat', 'danger');
    }
}

// Load active borrowings
async function loadActiveBorrowings() {
    try {
        borrowingsData = await apiRequest('borrowings.php?active=1');
        updateActiveBorrowingsDisplay();
    } catch (error) {
        console.error('Error loading active borrowings:', error);
        showAlert('Gagal memuat data peminjaman', 'danger');
    }
}

// Update active borrowings display
function updateActiveBorrowingsDisplay() {
    const container = document.getElementById('activeBorrowingsContainer');
    if (!container) return;

    if (borrowingsData.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>Tidak ada peminjaman aktif</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Peminjam</th>
                        <th>Alat</th>
                        <th>Acara</th>
                        <th>Tanggal Pinjam</th>
                        <th>Jadwal Kembali</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;

    borrowingsData.forEach(borrowing => {
        const isOverdue = isDateOverdue(borrowing.expected_return_date, borrowing.expected_return_time);
        const statusBadge = isOverdue 
            ? '<span class="badge bg-danger">Terlambat</span>'
            : '<span class="badge bg-success">Tepat waktu</span>';

        html += `
            <tr>
                <td>
                    <strong>${borrowing.borrower_name}</strong>
                    ${borrowing.borrower_email ? `<br><small class="text-muted">${borrowing.borrower_email}</small>` : ''}
                </td>
                <td>
                    <strong>${borrowing.equipment_name}</strong>
                    <br><small class="text-muted">S/N: ${borrowing.equipment_serial || 'No S/N'}</small>
                </td>
                <td>${borrowing.event_name}</td>
                <td>${formatDateTime(borrowing.pickup_date, borrowing.pickup_time)}</td>
                <td>
                    ${formatDateTime(borrowing.expected_return_date, borrowing.expected_return_time)}
                    <br>${statusBadge}
                </td>
                <td><span class="badge bg-warning">Dipinjam</span></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="showReturnModal('${borrowing.id}')">
                        <i class="fas fa-undo me-1"></i>Kembalikan
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Load equipment data for inventory
async function loadEquipmentData() {
    try {
        equipmentData = await apiRequest('equipment.php');
        updateInventoryDisplay();
    } catch (error) {
        console.error('Error loading equipment data:', error);
        showAlert('Gagal memuat data inventaris', 'danger');
    }
}

// Update inventory display
function updateInventoryDisplay() {
    const container = document.getElementById('inventoryContainer');
    if (!container) return;

    let html = `
        <div class="mb-3">
            <div class="row">
                <div class="col-md-6">
                    <input type="text" class="form-control" id="searchEquipment" placeholder="Cari berdasarkan nama alat atau serial number...">
                </div>
                <div class="col-md-3">
                    <select class="form-select" id="filterType">
                        <option value="">Semua Jenis</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-select" id="filterCondition">
                        <option value="">Semua Kondisi</option>
                        <option value="Baik">Baik</option>
                        <option value="Butuh Perbaikan">Butuh Perbaikan</option>
                        <option value="Rusak">Rusak</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Serial Number</th>
                        <th>Nama Alat</th>
                        <th>Jenis Alat</th>
                        <th>Kondisi</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="inventoryTableBody">
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    // Populate type filter
    const types = [...new Set(equipmentData.map(item => item.type))];
    const typeFilter = document.getElementById('filterType');
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    // Add search and filter event listeners
    document.getElementById('searchEquipment').addEventListener('input', filterInventory);
    document.getElementById('filterType').addEventListener('change', filterInventory);
    document.getElementById('filterCondition').addEventListener('change', filterInventory);

    // Initial display
    filterInventory();
}

// Filter inventory
function filterInventory() {
    const searchTerm = document.getElementById('searchEquipment').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const conditionFilter = document.getElementById('filterCondition').value;

    const filtered = equipmentData.filter(item => {
        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm));
        
        const matchesType = !typeFilter || item.type === typeFilter;
        const matchesCondition = !conditionFilter || item.condition === conditionFilter;

        return matchesSearch && matchesType && matchesCondition;
    });

    const tbody = document.getElementById('inventoryTableBody');
    let html = '';

    if (filtered.length === 0) {
        html = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>Tidak ada hasil pencarian</p>
                </td>
            </tr>
        `;
    } else {
        filtered.forEach((item, index) => {
            const conditionBadge = getConditionBadge(item.condition);
            const statusBadge = getStatusBadge(item.status, item.condition);

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${item.serial_number || 'No S/N'}</strong>
                        ${item.notes ? `<br><small class="text-muted">${item.notes}</small>` : ''}
                    </td>
                    <td>${item.name}</td>
                    <td><span class="badge bg-secondary">${item.type}</span></td>
                    <td>${conditionBadge}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
}

// Handle borrow form submission
async function handleBorrowSubmit(event) {
    event.preventDefault();

    if (!validateBorrowForm()) {
        return;
    }

    const formData = new FormData(event.target);
    const borrowData = {
        borrowerName: formData.get('borrowerName'),
        borrowerEmail: formData.get('borrowerEmail') || null,
        equipmentId: formData.get('equipmentName'),
        eventName: formData.get('eventName'),
        pickupDate: formData.get('pickupDate'),
        pickupTime: formData.get('pickupTime'),
        expectedReturnDate: formData.get('expectedReturnDate'),
        expectedReturnTime: formData.get('expectedReturnTime'),
        borrowCondition: formData.get('borrowCondition'),
        notes: formData.get('notes') || ''
    };

    try {
        showLoadingOverlay('Menyimpan peminjaman...');
        
        await apiRequest('borrowings.php', 'POST', borrowData);
        
        showAlert('Peminjaman berhasil dicatat!', 'success');
        event.target.reset();
        
        // Reset equipment dropdown
        document.getElementById('equipmentName').innerHTML = '<option value="">Pilih jenis alat terlebih dahulu...</option>';
        document.getElementById('equipmentName').disabled = true;
        
        // Reload data
        await Promise.all([
            loadStatistics(),
            loadActiveBorrowings()
        ]);
        
    } catch (error) {
        console.error('Error creating borrowing:', error);
        showAlert(error.message || 'Gagal menyimpan peminjaman', 'danger');
    } finally {
        hideLoadingOverlay();
    }
}

// Validate borrow form
function validateBorrowForm() {
    const form = document.getElementById('borrowForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    // Validate return time is after pickup time
    const pickupDate = form.querySelector('[name="pickupDate"]').value;
    const pickupTime = form.querySelector('[name="pickupTime"]').value;
    const returnDate = form.querySelector('[name="expectedReturnDate"]').value;
    const returnTime = form.querySelector('[name="expectedReturnTime"]').value;

    if (pickupDate && pickupTime && returnDate && returnTime) {
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const returnDateTime = new Date(`${returnDate}T${returnTime}`);

        if (returnDateTime <= pickupDateTime) {
            showAlert('Waktu pengembalian harus setelah waktu pengambilan', 'warning');
            isValid = false;
        }
    }

    return isValid;
}

// Show return modal
function showReturnModal(borrowingId) {
    const borrowing = borrowingsData.find(b => b.id === borrowingId);
    if (!borrowing) return;

    const modalHtml = `
        <div class="modal fade" id="returnModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-undo me-2"></i>Pengembalian Alat
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Info Peminjaman:</strong><br>
                            ${borrowing.borrower_name} - ${borrowing.equipment_name}<br>
                            Dipinjam: ${formatDateTime(borrowing.pickup_date, borrowing.pickup_time)}
                        </div>
                        <form id="returnForm">
                            <input type="hidden" id="returnBorrowingId" value="${borrowingId}">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="actualReturnDate" class="form-label">Tanggal Pengembalian *</label>
                                        <input type="date" class="form-control" id="actualReturnDate" required value="${getTodayDate()}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="actualReturnTime" class="form-label">Waktu Pengembalian *</label>
                                        <input type="time" class="form-control" id="actualReturnTime" required value="${getCurrentTime()}">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="returnCondition" class="form-label">Kondisi Alat Saat Dikembalikan *</label>
                                <select class="form-select" id="returnCondition" required>
                                    <option value="">Pilih kondisi...</option>
                                    <option value="Baik" ${borrowing.borrow_condition === 'Baik' ? 'selected' : ''}>Baik</option>
                                    <option value="Butuh Perbaikan">Butuh Perbaikan</option>
                                    <option value="Rusak">Rusak</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="returnNotes" class="form-label">Catatan Pengembalian</label>
                                <textarea class="form-control" id="returnNotes" rows="3" placeholder="Catatan kondisi atau masalah yang ditemukan..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" onclick="processReturn()">
                            <i class="fas fa-check me-1"></i>Konfirmasi Pengembalian
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('returnModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('returnModal'));
    modal.show();
}

// Process return
async function processReturn() {
    const borrowingId = document.getElementById('returnBorrowingId').value;
    const returnData = {
        actualReturnDate: document.getElementById('actualReturnDate').value,
        actualReturnTime: document.getElementById('actualReturnTime').value,
        returnCondition: document.getElementById('returnCondition').value,
        returnNotes: document.getElementById('returnNotes').value
    };

    // Validate required fields
    if (!returnData.actualReturnDate || !returnData.actualReturnTime || !returnData.returnCondition) {
        showAlert('Semua field yang wajib harus diisi', 'warning');
        return;
    }

    try {
        showLoadingOverlay('Memproses pengembalian...');
        
        await apiRequest(`borrowings.php/${borrowingId}/return`, 'POST', returnData);
        
        showAlert('Alat berhasil dikembalikan!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('returnModal'));
        modal.hide();
        
        // Reload data
        await Promise.all([
            loadStatistics(),
            loadActiveBorrowings()
        ]);
        
    } catch (error) {
        console.error('Error processing return:', error);
        showAlert(error.message || 'Gagal memproses pengembalian', 'danger');
    } finally {
        hideLoadingOverlay();
    }
}

// Utility functions
function formatDateTime(date, time) {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) + ', ' + time;
}

function isDateOverdue(date, time) {
    const expectedReturn = new Date(`${date}T${time}`);
    const now = new Date();
    return now > expectedReturn;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
    return new Date().toTimeString().slice(0, 5);
}

function getConditionBadge(condition) {
    switch (condition) {
        case 'Baik':
            return '<span class="badge bg-success">Baik</span>';
        case 'Butuh Perbaikan':
            return '<span class="badge bg-warning">Butuh Perbaikan</span>';
        case 'Rusak':
            return '<span class="badge bg-danger">Rusak</span>';
        default:
            return `<span class="badge bg-secondary">${condition}</span>`;
    }
}

function getStatusBadge(status, condition) {
    if (condition === 'Rusak') {
        return '<span class="badge bg-danger">Tidak Tersedia</span>';
    }
    
    switch (status) {
        case 'available':
            return '<span class="badge bg-success">Tersedia</span>';
        case 'borrowed':
            return '<span class="badge bg-warning">Dipinjam</span>';
        case 'maintenance':
            return '<span class="badge bg-info">Maintenance</span>';
        case 'damaged':
            return '<span class="badge bg-danger">Rusak</span>';
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    alertContainer.innerHTML = alertHtml;

    // Auto remove after 5 seconds
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Refresh data function
async function refreshData() {
    showLoadingOverlay('Memperbarui data...');
    
    try {
        await Promise.all([
            loadStatistics(),
            loadActiveBorrowings()
        ]);
        
        if (currentTab === 'inventory') {
            await loadEquipmentData();
        }
        
        showAlert('Data berhasil diperbarui dari server', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showAlert('Gagal memperbarui data', 'danger');
    } finally {
        hideLoadingOverlay();
    }
}

// Export data function
function exportData(type, filter = 'all') {
    const url = `${API_BASE_URL}/export.php?type=${type}&filter=${filter}`;
    window.open(url, '_blank');
    showAlert('Export dimulai - file akan diunduh dalam beberapa saat', 'info');
}