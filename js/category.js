const BASE_URL = 'https://webbantruyen-backend-latest.onrender.com/api'
const getToken = () => localStorage.getItem('authToken')
const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' })

const categoryId = new URLSearchParams(window.location.search).get('id')

async function loadCategoryProducts() {
    const container = document.getElementById('productGrid')
    const titleEl = document.getElementById('categoryTitle')
    if (!container) return

    try {
        // Load category info
        if (categoryId) {
            const catRes = await fetch(`${BASE_URL}/categories/${categoryId}`)
            const catJson = await catRes.json()
            if (titleEl && catJson.data) titleEl.textContent = catJson.data.name
        }

        // Load products
        const url = categoryId
            ? `${BASE_URL}/categories/${categoryId}/products`
            : `${BASE_URL}/products`
        const res = await fetch(url)
        const json = await res.json()
        const products = json.data || []

        if (!products.length) { container.innerHTML = '<p>Không có sản phẩm nào.</p>'; return }

        container.innerHTML = products.map(p => `
            <div class="product-card">
                <a href="product-detail.html?id=${p.id}">
                    <img src="${p.imageUrl || 'https://placehold.co/180x240'}" alt="${p.name}" />
                    <div class="product-info">
                        <h3 class="product-name">${p.name}</h3>
                        <p class="product-author">${p.author || ''}</p>
                        <p class="product-price">${(p.price || 0).toLocaleString('vi-VN')} đ</p>
                    </div>
                </a>
                <button class="btn-add-cart" onclick="addToCart('${p.id}')">Thêm vào giỏ</button>
            </div>
        `).join('')
    } catch (e) { console.error('Lỗi:', e); container.innerHTML = '<p>Không thể tải sản phẩm.</p>' }
}

async function addToCart(productId) {
    if (!getToken()) { window.location.href = 'login.html'; return }
    try {
        await fetch(`${BASE_URL}/cart`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ productId, quantity: 1 })
        })
        alert('Đã thêm vào giỏ hàng!')
    } catch (e) { alert('Lỗi: ' + e.message) }
}

document.addEventListener('DOMContentLoaded', loadCategoryProducts)
