// Code JavaScript cho trang giỏ hàng (cart.html)
document.addEventListener('DOMContentLoaded', () => {
    console.log("Cart Page Initialized!");

    const API_BASE = 'http://localhost:8080';
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

    const cartItemsWrapper = document.querySelector('.cart-items-wrapper');
    const summaryTotal = document.querySelector('.summary-row span:last-child');
    const summaryTamTinh = document.querySelector('.summary-row.total span:last-child');

    const renderCart = (cartData) => {
        if (!cartItemsWrapper) return;

        const items = cartData.items || [];
        if (items.length === 0) {
            cartItemsWrapper.innerHTML = '<p class="no-data">Giỏ hàng của bạn đang trống.</p>';
            if (summaryTotal) summaryTotal.textContent = '0 đ';
            if (summaryTamTinh) summaryTamTinh.textContent = '0 đ';
            return;
        }

        cartItemsWrapper.innerHTML = items.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <input type="checkbox" class="cart-checkbox" checked />
                <img src="${item.productImageUrl || 'https://placehold.co/75x100'}" alt="${item.productName}" class="cart-item-img" />
                <div class="cart-item-title" onclick="window.location.href='product-detail.html?id=${item.productId}'" style="cursor:pointer">${item.productName}</div>
                <div class="cart-item-pricing">
                    <div class="cart-item-price">${(item.price || 0).toLocaleString('vi-VN')} đ</div>
                </div>
                <div class="qty-selector">
                    <button class="qty-btn qty-minus" onclick="updateQty('${item.productId}', ${item.quantity - 1})">-</button>
                    <input type="text" class="qty-input" value="${item.quantity}" readonly />
                    <button class="qty-btn qty-plus" onclick="updateQty('${item.productId}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn-remove-cart" title="Xóa sản phẩm" onclick="removeFromCart('${item.productId}')">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `).join('');

        const total = cartData.totalAmount || 0;
        if (summaryTotal) summaryTotal.textContent = total.toLocaleString('vi-VN') + ' đ';
        if (summaryTamTinh) summaryTamTinh.textContent = total.toLocaleString('vi-VN') + ' đ';
    };

    const loadCart = async () => {
        try {
            const data = await apiRequest('/api/cart');
            renderCart(data);

            // Sync badge
            const itemsCount = (data.items || []).reduce((acc, item) => acc + item.quantity, 0);
            localStorage.setItem('cartCount', itemsCount);
            if (window.updateBadges) window.updateBadges();
        } catch (err) {
            console.error("Lỗi khi tải giỏ hàng:", err);
            if (cartItemsWrapper) {
                cartItemsWrapper.innerHTML = '<p class="error">Không thể tải giỏ hàng. Vui lòng đăng nhập.</p>';
            }
        }
    };

    window.removeFromCart = async (productId) => {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            await apiRequest(`/api/cart/${productId}`, {
                method: 'DELETE'
            });
            loadCart();
        } catch (err) {
            alert(err.message || 'Xóa thất bại');
        }
    };

    window.updateQty = async (productId, newQty) => {
        if (newQty < 1) return;
        try {
            await apiRequest(`/api/cart/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: newQty })
            });
            loadCart();
        } catch (err) {
            alert(err.message || 'Cập nhật số lượng thất bại');
        }
    };

    if (getToken()) {
        loadCart();
    } else {
        if (cartItemsWrapper) {
            cartItemsWrapper.innerHTML = '<p class="error">Vui lòng <a href="login.html">đăng nhập</a> để xem giỏ hàng.</p>';
        }
    }
});
