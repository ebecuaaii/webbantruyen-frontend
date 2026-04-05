const BASE_URL = 'http://localhost:8080/api'

function authHeaders() {
    return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

// ── Dashboard tổng quan ──────────────────────────────────
async function loadDashboard() {
    try {
        const res = await fetch(`${BASE_URL}/admin/dashboard`, { headers: authHeaders() })
        const json = await res.json()
        const data = json.data

        document.querySelector('[data-stat="revenue"]').textContent =
            data.totalRevenue?.toLocaleString('vi-VN') + ' VNĐ'
        document.querySelector('[data-stat="orders"]').textContent = data.totalOrders
        document.querySelector('[data-stat="users"]').textContent = data.totalUsers
        document.querySelector('[data-stat="pending"]').textContent = data.pendingOrders
    } catch (e) {
        console.error('Lỗi load dashboard:', e)
    }
}

// ── Đơn hàng gần đây ────────────────────────────────────
async function loadRecentOrders() {
    try {
        const res = await fetch(`${BASE_URL}/admin/orders`, { headers: authHeaders() })
        const json = await res.json()
        const orders = json.data?.slice(0, 5) || []

        const tbody = document.querySelector('#recentOrdersTable tbody')
        if (!tbody) return

        tbody.innerHTML = orders.map(order => `
      <tr>
        <td>
          <span class="order-id">${order.id?.slice(-8).toUpperCase()}</span>
          <span class="order-badge-${getBadgeClass(order.status)}">${getStatusLabel(order.status)}</span>
        </td>
        <td><span class="order-customer">${order.userId}</span></td>
        <td class="order-date">${formatDate(order.createdAt)}</td>
        <td class="order-price">${order.totalAmount?.toLocaleString('vi-VN')} đ</td>
      </tr>
    `).join('')
    } catch (e) {
        console.error('Lỗi load recent orders:', e)
    }
}

// ── Thống kê doanh thu theo khoảng thời gian ────────────
async function loadRevenueStats(from, to) {
    try {
        const res = await fetch(`${BASE_URL}/admin/dashboard/revenue?from=${from}&to=${to}`, {
            headers: authHeaders()
        })
        const json = await res.json()
        return json.data
    } catch (e) {
        console.error('Lỗi load revenue stats:', e)
    }
}

// ── Helpers ──────────────────────────────────────────────
function getBadgeClass(status) {
    const map = { PENDING: 'pending', PROCESSING: 'new', SHIPPED: 'shipped', DELIVERED: 'delivered', CANCELLED: 'cancelled' }
    return map[status] || 'pending'
}

function getStatusLabel(status) {
    const map = { PENDING: 'Chờ xác nhận', PROCESSING: 'Đang xử lý', SHIPPED: 'Đang vận chuyển', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy' }
    return map[status] || status
}

function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard()
    loadRecentOrders()
})
