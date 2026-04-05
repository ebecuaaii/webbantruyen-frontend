const BASE_URL = 'https://webbantruyen-backend-latest.onrender.com/api'

function getToken() { return localStorage.getItem('authToken') }
function authHeaders() {
    return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

let cartData = null
let appliedCoupon = null

// ── Load giỏ hàng vào trang checkout ────────────────────
async function loadCheckoutCart() {
    try {
        const res = await fetch(`${BASE_URL}/cart`, { headers: authHeaders() })
        const json = await res.json()
        cartData = json.data

        const container = document.getElementById('checkoutItems')
        if (!container) return

        if (!cartData?.items?.length) {
            container.innerHTML = '<p>Giỏ hàng trống.</p>'
            return
        }

        container.innerHTML = cartData.items.map(item => `
            <div class="checkout-item" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <img src="${item.productImageUrl || 'https://placehold.co/50x65'}" alt="${item.productName}" style="width:50px;height:65px;object-fit:cover;border-radius:4px;flex-shrink:0;" />
                <div class="checkout-item-info" style="flex:1;min-width:0;">
                    <p class="item-name" style="margin:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.productName}</p>
                    <p class="item-qty" style="margin:2px 0 0;font-size:12px;color:#888;">x${item.quantity}</p>
                </div>
                <p class="item-price" style="margin:0;font-size:13px;font-weight:600;white-space:nowrap;">${(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
            </div>
        `).join('')

        updateOrderSummary()
    } catch (e) {
        console.error('Lỗi load cart:', e)
    }
}

// ── Cập nhật tổng tiền ───────────────────────────────────
function updateOrderSummary() {
    if (!cartData) return
    const subtotal = cartData.totalAmount || 0
    let discount = 0

    if (appliedCoupon) {
        if (appliedCoupon.discountPercent) discount = subtotal * appliedCoupon.discountPercent / 100
        else if (appliedCoupon.discountAmount) discount = appliedCoupon.discountAmount
    }

    const total = subtotal - discount
    const el = (id) => document.getElementById(id)
    if (el('subtotalAmount')) el('subtotalAmount').textContent = subtotal.toLocaleString('vi-VN') + ' đ'
    if (el('discountAmount')) el('discountAmount').textContent = '-' + discount.toLocaleString('vi-VN') + ' đ'
    if (el('totalAmount')) el('totalAmount').textContent = total.toLocaleString('vi-VN') + ' đ'
}

// ── Áp dụng coupon ───────────────────────────────────────
async function applyCoupon() {
    const code = document.getElementById('couponInput')?.value?.trim()
    const msgEl = document.getElementById('couponMsg')
    if (!code) return

    try {
        const subtotal = cartData?.totalAmount || 0
        const res = await fetch(`${BASE_URL}/coupons/${code}?orderAmount=${subtotal}`, { headers: authHeaders() })
        const json = await res.json()

        if (json.status >= 400) throw new Error(json.message)

        appliedCoupon = json.data
        if (msgEl) { msgEl.textContent = 'Áp dụng thành công!'; msgEl.style.color = 'green' }
        updateOrderSummary()
    } catch (e) {
        appliedCoupon = null
        if (msgEl) { msgEl.textContent = e.message || 'Mã không hợp lệ'; msgEl.style.color = 'red' }
        updateOrderSummary()
    }
}

// ── Đặt hàng ─────────────────────────────────────────────
async function placeOrder(e) {
    e.preventDefault()
    const form = document.getElementById('checkoutForm')
    const shippingAddress = form.querySelector('[name="shippingAddress"]')?.value?.trim()
    const note = form.querySelector('[name="note"]')?.value?.trim()

    // Gộp địa chỉ đầy đủ
    const province = document.querySelectorAll('select')[0]?.options[document.querySelectorAll('select')[0]?.selectedIndex]?.text || ''
    const district = document.querySelectorAll('select')[1]?.options[document.querySelectorAll('select')[1]?.selectedIndex]?.text || ''
    const ward = document.querySelectorAll('select')[2]?.options[document.querySelectorAll('select')[2]?.selectedIndex]?.text || ''
    const fullAddress = [shippingAddress, ward, district, province].filter(Boolean).join(', ')

    if (!shippingAddress) { alert('Vui lòng nhập địa chỉ giao hàng'); return }

    const payload = {
        shippingAddress: fullAddress || shippingAddress,
        note,
        couponCode: appliedCoupon?.code || null
    }

    try {
        const res = await fetch(`${BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        })
        const json = await res.json()
        if (json.status >= 400) throw new Error(json.message)

        alert('Đặt hàng thành công!')
        window.location.href = 'my-orders.html'
    } catch (e) {
        alert('Lỗi đặt hàng: ' + e.message)
    }
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) { window.location.href = 'login.html'; return }
    loadCheckoutCart()

    document.getElementById('applyCouponBtn')?.addEventListener('click', applyCoupon)
    document.getElementById('checkoutForm')?.addEventListener('submit', placeOrder)
})
