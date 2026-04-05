const BASE_URL = 'http://localhost:8080/api'
const getToken = () => localStorage.getItem('authToken')
const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' })

let allCategories = []
let currentPage = 1
const pageSize = 12

async function loadCategories() {
    try {
        const res = await fetch(`${BASE_URL}/categories`)
        const json = await res.json()
        allCategories = json.data || []
        const sidebar = document.getElementById('categorySidebar')
        if (!sidebar) return
        sidebar.innerHTML = allCategories.map(c => `
            <li><a href="#" class="category-link" data-id="${c.id}">${c.name}</a></li>
        `).join('')
        sidebar.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault()
                loadProducts({ categoryId: link.dataset.id })
            })
        })
    } catch (e) { console.error('Lỗi load categories:', e) }
}

async function loadProducts({ categoryId = '', search = '', sort = '' } = {}) {
    const container = document.getElementById('productGrid')
    if (!container) return
    container.innerHTML = '<p>Đang tải...</p>'
    try {
        let url = `${BASE_URL}/products?page=${currentPage - 1}&size=${pageSize}`
        if (categoryId) url += `&categoryId=${categoryId}`
        if (search) url += `&q=${encodeURIComponent(search)}`
        if (sort) url += `&sort=${sort}`

        const res = await fetch(url)
        const json = await res.json()
        const products = json.data?.content || json.data || []

        if (!products.length) { container.innerHTML = '<p>Không tìm thấy sản phẩm.</p>'; return }

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
    } catch (e) { console.error('Lỗi load products:', e); container.innerHTML = '<p>Không thể tải sản phẩm.</p>' }
}

async function addToCart(productId) {
    if (!getToken()) { window.location.href = 'login.html'; return }
    try {
        await fetch(`${BASE_URL}/cart`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ productId, quantity: 1 })
        })
        alert('Đã thêm vào giỏ hàng!')
    } catch (e) { alert('Lỗi thêm vào giỏ: ' + e.message) }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories()
    loadProducts()

    document.getElementById('searchInput')?.addEventListener('input', e => {
        loadProducts({ search: e.target.value })
    })
    document.getElementById('sortSelect')?.addEventListener('change', e => {
        loadProducts({ sort: e.target.value })
    })
})
