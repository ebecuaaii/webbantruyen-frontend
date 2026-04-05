const BASE_URL = 'https://webbantruyen-backend-latest.onrender.com/api'
const getToken = () => localStorage.getItem('authToken')
const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' })

const productId = new URLSearchParams(window.location.search).get('id')

async function loadProductDetail() {
    if (!productId) return
    try {
        const res = await fetch(`${BASE_URL}/products/${productId}`)
        const json = await res.json()
        const p = json.data

        document.title = `${p.name} - Kaleidoscope`
        const el = id => document.getElementById(id)
        if (el('productName')) el('productName').textContent = p.name
        if (el('productAuthor')) el('productAuthor').textContent = p.author || ''
        if (el('productPrice')) el('productPrice').textContent = (p.price || 0).toLocaleString('vi-VN') + ' đ'
        if (el('productDesc')) el('productDesc').textContent = p.description || ''
        if (el('productImage')) el('productImage').src = p.imageUrl || 'https://placehold.co/300x400'
        if (el('productStock')) el('productStock').textContent = p.stock > 0 ? 'Còn hàng' : 'Hết hàng'
    } catch (e) { console.error('Lỗi load product:', e) }
}

async function loadReviews() {
    if (!productId) return
    const container = document.getElementById('reviewList')
    if (!container) return
    try {
        const res = await fetch(`${BASE_URL}/products/${productId}/reviews`)
        const json = await res.json()
        const reviews = json.data || []
        if (!reviews.length) { container.innerHTML = '<p>Chưa có đánh giá nào.</p>'; return }
        container.innerHTML = reviews.map(r => `
            <div class="review-item">
                <strong>${r.username || 'Ẩn danh'}</strong>
                <span class="review-rating">${'⭐'.repeat(r.rating || 5)}</span>
                <p>${r.comment}</p>
            </div>
        `).join('')
    } catch (e) { console.error('Lỗi load reviews:', e) }
}

async function submitReview(e) {
    e.preventDefault()
    if (!getToken()) { window.location.href = 'login.html'; return }
    const form = e.target
    const rating = form.querySelector('[name="rating"]')?.value
    const comment = form.querySelector('[name="comment"]')?.value
    try {
        await fetch(`${BASE_URL}/products/${productId}/reviews`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ rating: parseInt(rating), comment })
        })
        form.reset()
        loadReviews()
    } catch (e) { alert('Lỗi gửi đánh giá: ' + e.message) }
}

async function addToCart() {
    if (!getToken()) { window.location.href = 'login.html'; return }
    const qty = parseInt(document.getElementById('qtyInput')?.value || 1)
    try {
        await fetch(`${BASE_URL}/cart`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ productId, quantity: qty })
        })
        alert('Đã thêm vào giỏ hàng!')
    } catch (e) { alert('Lỗi: ' + e.message) }
}


if (!getToken()) { window.location.href = 'login.html'; return }
const qty = parseInt(document.getElementById('qtyInput')?.value || 1)
try {
    await fetch(`${BASE_URL}/cart`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ productId, quantity: qty })
    })
    window.location.href = 'checkout.html'
} catch (e) { alert('Lỗi: ' + e.message) }


async function addToWishlist() {
    if (!getToken()) { window.location.href = 'login.html'; return }
    try {
        await fetch(`${BASE_URL}/wishlist/${productId}`, { method: 'POST', headers: authHeaders() })
        alert('Đã thêm vào yêu thích!')
    } catch (e) { alert('Lỗi: ' + e.message) }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail()
    loadReviews()
    document.getElementById('reviewForm')?.addEventListener('submit', submitReview)
    document.getElementById('btnAddCart')?.addEventListener('click', addToCart)
    document.getElementById('btnWishlist')?.addEventListener('click', addToWishlist)
    document.querySelectorAll('.btn-buy-now').forEach(btn => btn.addEventListener('click', buyNow))
})
