const BASE_URL = 'https://webbantruyen-backend-latest.onrender.com/api'

function getToken() { return localStorage.getItem('authToken') }

function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

// ── Danh sách đơn hàng cá nhân ──────────────────────────
async function loadMyOrders() {
  const container = document.querySelector('#myOrdersList')
  if (!container) return

  try {
    const res = await fetch(`${BASE_URL}/orders`, { headers: authHeaders() })
    const json = await res.json()
    const orders = json.data || []

    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-msg">Bạn chưa có đơn hàng nào.</p>'
      return
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card" onclick="viewOrderDetail('${order.id}')">
        <div class="order-card-header">
          <span class="order-id">#${order.id?.slice(-8).toUpperCase()}</span>
          <span class="order-status ${getStatusClass(order.status)}">${getStatusLabel(order.status)}</span>
        </div>
        <div class="order-card-body">
          <span class="order-date">${formatDate(order.createdAt)}</span>
          <span class="order-total">${order.totalAmount?.toLocaleString('vi-VN')} đ</span>
        </div>
        <div class="order-items-preview">
          ${(order.items || []).slice(0, 2).map(item =>
      `<span>${item.productName} x${item.quantity}</span>`
    ).join(', ')}
          ${order.items?.length > 2 ? `<span>+${order.items.length - 2} sản phẩm khác</span>` : ''}
        </div>
      </div>
    `).join('')
  } catch (e) {
    console.error('Lỗi load orders:', e)
    container.innerHTML = '<p class="empty-msg">Không thể tải đơn hàng.</p>'
  }
}

// ── Chi tiết đơn hàng ────────────────────────────────────
async function loadOrderDetail(orderId) {
  const container = document.querySelector('#orderDetail')
  if (!container) return

  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers: authHeaders() })
    const json = await res.json()
    const order = json.data

    container.innerHTML = `
      <div class="order-detail-header">
        <h2>Đơn hàng #${order.id?.slice(-8).toUpperCase()}</h2>
        <span class="order-status ${getStatusClass(order.status)}">${getStatusLabel(order.status)}</span>
      </div>
      <div class="order-detail-info">
        <p><strong>Ngày đặt:</strong> ${formatDate(order.createdAt)}</p>
        <p><strong>Địa chỉ:</strong> ${order.shippingAddress || 'Chưa cập nhật'}</p>
        ${order.couponCode ? `<p><strong>Mã giảm giá:</strong> ${order.couponCode} (-${order.discount?.toLocaleString('vi-VN')} đ)</p>` : ''}
      </div>
      <table class="order-items-table">
        <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
        <tbody>
          ${(order.items || []).map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>${item.price?.toLocaleString('vi-VN')} đ</td>
              <td>${(item.price * item.quantity)?.toLocaleString('vi-VN')} đ</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="3"><strong>Tổng cộng</strong></td><td><strong>${order.totalAmount?.toLocaleString('vi-VN')} đ</strong></td></tr>
        </tfoot>
      </table>
    `
  } catch (e) {
    console.error('Lỗi load order detail:', e)
  }
}

function viewOrderDetail(orderId) {
  window.location.href = `order-detail.html?id=${orderId}`
}

// ── Helpers ──────────────────────────────────────────────
function getStatusClass(status) {
  const map = { PENDING: 'status-pending', PROCESSING: 'status-processing', SHIPPED: 'status-shipped', DELIVERED: 'status-delivered', CANCELLED: 'status-cancelled' }
  return map[status] || ''
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
  const params = new URLSearchParams(window.location.search)
  const orderId = params.get('id')

  if (orderId) {
    loadOrderDetail(orderId)
  } else {
    loadMyOrders()
  }
})
