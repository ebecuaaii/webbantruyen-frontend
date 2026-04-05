// Code JavaScript cho trang danh sách yêu thích (wishlist.html)
document.addEventListener('DOMContentLoaded', () => {
    console.log("Wishlist Page Initialized!");

    const API_BASE = 'https://webbantruyen-backend-latest.onrender.com/api';
    const getToken = () => localStorage.getItem('authToken');

    const apiRequest = async (path, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        const token = getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (err) {
            payload = null;
        }

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                window.location.href = 'login.html';
            }
            const message = payload?.message || payload?.data?.message || 'Request failed';
            throw new Error(message);
        }

        if (payload && typeof payload.status !== 'undefined') {
            if (payload.status >= 400) {
                throw new Error(payload.message || 'Request failed');
            }
            return payload.data;
        }

        return payload;
    };

    const wishlistContainer = document.querySelector('.wishlist-products');
    const wishlistCountEl = document.querySelector('.wishlist-count .count');

    const renderWishlist = (products) => {
        if (!wishlistContainer) return;

        if (wishlistCountEl) {
            wishlistCountEl.textContent = products.length;
        }

        if (products.length === 0) {
            wishlistContainer.innerHTML = '<p class="no-data">Danh sách yêu thích của bạn đang trống.</p>';
            return;
        }

        wishlistContainer.innerHTML = products.map(product => `
          <div class="wishlist-item" data-id="${product.id}">
            <button class="btn-remove-wishlist" title="Xóa khỏi yêu thích" onclick="removeFromWishlist('${product.id}')">
              <i class="fas fa-times"></i>
            </button>
            <div class="product-image" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">
              <img src="${product.imageUrl || 'https://placehold.co/180x220'}" alt="${product.name}" />
            </div>
            <div class="product-info">
              <h3 class="product-name" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
              <p class="product-author">${product.author || 'Unknown'}</p>
              <div class="product-rating">
                <span class="stars">⭐⭐⭐⭐⭐</span>
                <span class="review-count">(0 đánh giá)</span>
              </div>
              <div class="product-price-section">
                ${product.oldPrice ? `<span class="price-original">${product.oldPrice.toLocaleString('vi-VN')} đ</span>` : ''}
                <span class="price-current">${(product.price || 0).toLocaleString('vi-VN')} đ</span>
                ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
              </div>
              <button class="btn-add-cart" onclick="addToCart('${product.id}')">Thêm vào giỏ hàng</button>
            </div>
          </div>
        `).join('');
    };

    const loadWishlist = async () => {
        try {
            const data = await apiRequest('/api/wishlist');
            const products = data.products || [];
            renderWishlist(products);
            // Cập nhật số lượng yêu thích vào localStorage để đồng bộ badge
            localStorage.setItem('favoriteCount', products.length);
            // Trigger update badge nếu hàm tồn tại (thường là trong main.js)
            if (window.updateBadges) window.updateBadges();
        } catch (err) {
            console.error("Lỗi khi tải danh sách yêu thích:", err);
            if (wishlistContainer) {
                wishlistContainer.innerHTML = '<p class="error">Không thể tải danh sách yêu thích. Vui lòng đăng nhập.</p>';
            }
        }
    };

    window.removeFromWishlist = async (productId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích?')) return;
        try {
            await apiRequest(`/api/wishlist/${productId}`, {
                method: 'DELETE'
            });
            loadWishlist();
        } catch (err) {
            alert(err.message || 'Xóa thất bại');
        }
    };

    if (getToken()) {
        loadWishlist();
    } else {
        if (wishlistContainer) {
            wishlistContainer.innerHTML = '<p class="error">Vui lòng <a href="login.html">đăng nhập</a> để xem danh sách yêu thích.</p>';
        }
    }
});
