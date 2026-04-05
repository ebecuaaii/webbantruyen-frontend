// FE/js/admin.js

const API_BASE = 'http://localhost:8080';

// Helper lấy Token
const getToken = () => localStorage.getItem('authToken');

// Hàm gọi API chung cho Admin với xử lý Error chuẩn hóa
const adminRequest = async (path, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    let payload = null;
    try {
        payload = await response.json();
    } catch (err) {
        payload = null;
    }

    if (!response.ok || (payload && payload.status >= 400)) {
        throw new Error(payload?.message || payload?.data?.message || 'Yêu cầu thất bại từ server');
    }
    return payload?.data || payload;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Dashboard Logic Initialized!");

    const currentPath = window.location.pathname;

    // ─── LOGIC SIDEBAR ACTIVE (Giữ nguyên) ───
    document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // ─── XỬ LÝ ĐĂNG XUẤT ───
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Xác nhận đăng xuất khỏi hệ thống quản trị?")) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                window.location.href = 'admin-login.html';
            }
        });
    }

    // ─── PHỤ TRỢ: LOAD DANH MỤC CHO SELECT ───
    const loadCategorySelect = async () => {
        const selects = document.querySelectorAll('#categorySelect, [name="categoryId"]');
        if (selects.length === 0) return;
        try {
            const categories = await adminRequest('/api/categories');
            selects.forEach(select => {
                const currentVal = select.getAttribute('data-value');
                select.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
                    categories.map(c => `
                        <option value="${c.id}" ${currentVal === c.id ? 'selected' : ''}>${c.name}</option>
                    `).join('');
            });
        } catch (err) { console.error("Không nạp được danh mục:", err); }
    };

    // ─── PHỤ TRỢ: XỬ LÝ XEM TRƯỚC VÀ CHUYỂN ĐỔI ẢNH FILE ───
    const setupImageUpload = () => {
        const fileInputs = document.querySelectorAll('input[type="file"].image-picker');
        fileInputs.forEach(input => {
            input.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64String = event.target.result;
                    const container = input.closest('.form-group') || input.closest('.image-upload');

                    // Linh hoạt tìm cả text input hoặc hidden input có tên imageUrl/thumbnailUrl
                    const urlInput = container.querySelector('input[type="text"], input[type="hidden"]');
                    const preview = container.querySelector('.preview-image');

                    if (urlInput) urlInput.value = base64String;
                    if (preview) preview.src = base64String;
                };
                reader.readAsDataURL(file);
            });
        });
    };

    // ─── PHỤ TRỢ: XỬ LÝ CHỌN NHIỀU ẢNH (GALLERY PREVIEW) ───
    const setupMultipleImageUpload = () => {
        const multiPickers = document.querySelectorAll('.multiple-picker');
        multiPickers.forEach(picker => {
            picker.addEventListener('change', function (e) {
                const gallery = picker.closest('.form-group').querySelector('.image-gallery-grid');
                if (!gallery) return;

                Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const div = document.createElement('div');
                        div.className = 'gallery-item';
                        div.style = 'position: relative; width: 100px; height: 100px;';
                        div.innerHTML = `
                            <img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
                            <span style="position: absolute; top: -8px; right: -8px; background: #9f2425; color: white; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; pointer-events: auto;" onclick="this.parentElement.remove()">×</span>
                        `;
                        gallery.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                });
            });
        });
    };

    if (currentPath.includes('product')) loadCategorySelect();
    setupImageUpload();
    setupMultipleImageUpload();

    // ─── QUẢN LÝ ĐƠN HÀNG (admin-orders.html) ───
    if (currentPath.includes('admin-orders.html')) {
        let allOrders = [];
        let filteredOrders = [];
        const itemsPerPage = 10;
        let currentPage = 1;

        const statusMap = {
            'PENDING': { text: 'Chờ xác nhận', class: 'pending' },
            'PROCESSING': { text: 'Đang xử lý', class: 'confirmed' },
            'SHIPPED': { text: 'Đang giao', class: 'shipping' },
            'DELIVERED': { text: 'Đã giao', class: 'completed' },
            'CANCELLED': { text: 'Hủy', class: 'cancelled' }
        };

        const renderTable = (page) => {
            const tbody = document.getElementById('orderTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageOrders = filteredOrders.slice(start, end);

            if (pageOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Không tìm thấy đơn hàng nào.</td></tr>';
                return;
            }

            tbody.innerHTML = pageOrders.map(o => `
                <tr>
                    <td><input type="checkbox" /></td>
                    <td><span class="order-code">${o.orderCode || o.id.substring(0, 10)}</span></td>
                    <td>${o.userName || 'N/A'}</td>
                    <td>${(o.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
                    <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                    <td><span class="status-badge ${statusMap[o.status]?.class || ''}">${statusMap[o.status]?.text || o.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-view-o" data-id="${o.id}" title="Chi tiết"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon btn-edit-o" data-id="${o.id}" data-status="${o.status}" title="Cập nhật"><i class="fas fa-edit"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Bind Actions
            document.querySelectorAll('.btn-view-o').forEach(btn => btn.onclick = () => viewOrderDetail(btn.dataset.id));
            document.querySelectorAll('.btn-edit-o').forEach(btn => btn.onclick = () => showStatusUpdate(btn.dataset.id, btn.dataset.status));

            renderPagination();
        };

        const renderPagination = () => {
            const container = document.getElementById('paginationContainer');
            if (!container) return;
            const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
            container.innerHTML = '';

            if (totalPages <= 1) return;

            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn-paging';
            prevBtn.disabled = currentPage === 1;
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.onclick = () => { currentPage--; renderTable(currentPage); };
            container.appendChild(prevBtn);

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `btn-paging ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => { currentPage = i; renderTable(currentPage); };
                container.appendChild(btn);
            }

            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn-paging';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.onclick = () => { currentPage++; renderTable(currentPage); };
            container.appendChild(nextBtn);
        };

        const applyFilters = () => {
            const status = document.getElementById('statusFilter').value;
            const date = document.getElementById('dateFilter').value;

            filteredOrders = allOrders.filter(o => {
                let match = true;
                if (status && o.status !== status) match = false;
                if (date) {
                    const oDate = new Date(o.createdAt).toISOString().split('T')[0];
                    if (oDate !== date) match = false;
                }
                return match;
            });

            currentPage = 1;
            renderTable(currentPage);
        };

        const loadOrders = async () => {
            try {
                allOrders = await adminRequest('/api/admin/orders');
                // Sắp xếp đơn hàng mới nhất lên đầu
                allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                applyFilters();
            } catch (err) {
                console.error("Lỗi khi tải đơn hàng:", err);
            }
        };

        // Modal Logic
        const modal = document.getElementById('orderDetailModal');
        const closeModal = modal?.querySelector('.close-modal');
        const detailContent = document.getElementById('orderDetailContent');

        if (closeModal) {
            closeModal.onclick = () => { modal.style.display = 'none'; };
            window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        }

        const viewOrderDetail = async (id) => {
            try {
                const o = await adminRequest(`/api/admin/orders/${id}`);
                if (!modal || !detailContent) return;

                detailContent.innerHTML = `
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                        <div>
                            <p><strong>Mã đơn hàng:</strong> ${o.orderCode || o.id}</p>
                            <p><strong>Khách hàng:</strong> ${o.fullName || o.userName}</p>
                            <p><strong>Số điện thoại:</strong> ${o.phone || 'N/A'}</p>
                            <p><strong>Ngày đặt:</strong> ${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <div>
                            <p><strong>Địa chỉ nhận hàng:</strong><br>${o.address || 'N/A'}</p>
                            <p><strong>Trạng thái:</strong> <span class="status-badge ${statusMap[o.status]?.class}">${statusMap[o.status]?.text}</span></p>
                            <p><strong>Ghi chú:</strong> ${o.note || 'Không có'}</p>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <h4>Sản phẩm đã đặt</h4>
                        <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #eee; text-align: left;">
                                    <th style="padding: 10px;">Sản phẩm</th>
                                    <th style="padding: 10px;">Số lượng</th>
                                    <th style="padding: 10px;">Đơn giá</th>
                                    <th style="padding: 10px;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(o.items || []).map(item => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                                            <img src="${item.imageUrl || 'https://placehold.co/40x50'}" style="width:40px; height:50px; object-fit: cover;" />
                                            <span>${item.productName}</span>
                                        </td>
                                        <td style="padding: 10px;">${item.quantity}</td>
                                        <td style="padding: 10px;">${(item.price || 0).toLocaleString('vi-VN')} đ</td>
                                        <td style="padding: 10px;">${(item.subtotal || 0).toLocaleString('vi-VN')} đ</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="text-align: right; margin-top: 20px; font-size: 18px;">
                            <strong>Tổng cộng: <span style="color: #9f2425">${(o.totalAmount || 0).toLocaleString('vi-VN')} đ</span></strong>
                        </div>
                    </div>
                `;
                modal.style.display = 'flex';
            } catch (err) { alert("Lỗi chi tiết: " + err.message); }
        };

        const showStatusUpdate = (id, currentStatus) => {
            const modal = document.getElementById('statusModal') || createStatusModal()
            const select = modal.querySelector('#statusSelect')
            select.value = currentStatus
            modal.style.display = 'flex'
            modal.querySelector('#btnConfirmStatus').onclick = () => {
                updateAdminOrderStatus(id, select.value)
                modal.style.display = 'none'
            }
            modal.querySelector('#btnCancelStatus').onclick = () => modal.style.display = 'none'
        }

        const createStatusModal = () => {
            const modal = document.createElement('div')
            modal.id = 'statusModal'
            modal.style = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;align-items:center;justify-content:center;'
            modal.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:28px;min-width:320px;">
                    <h3 style="margin:0 0 16px;">Cập nhật trạng thái</h3>
                    <select id="statusSelect" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:20px;">
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="SHIPPED">Đang vận chuyển</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                    <div style="display:flex;gap:10px;justify-content:flex-end;">
                        <button id="btnCancelStatus" style="padding:8px 20px;border:1px solid #ddd;border-radius:8px;cursor:pointer;background:#fff;">Hủy</button>
                        <button id="btnConfirmStatus" style="padding:8px 20px;background:#9f2425;color:#fff;border:none;border-radius:8px;cursor:pointer;">Xác nhận</button>
                    </div>
                </div>
            `
            document.body.appendChild(modal)
            return modal
        }

        const updateAdminOrderStatus = async (id, status) => {
            try {
                await adminRequest(`/api/admin/orders/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status })
                });
                alert('Cập nhật trạng thái thành công!');
                loadOrders();
            } catch (err) { alert("Lỗi cập nhật: " + err.message); }
        };

        document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
        document.getElementById('dateFilter')?.addEventListener('change', applyFilters);

        loadOrders();
    }

    // ─── QUẢN LÝ COUPON (admin-coupons.html) ───
    if (currentPath.includes('admin-coupons.html')) {
        const loadCoupons = async () => {
            try {
                const coupons = await adminRequest('/api/admin/coupons')
                const tbody = document.querySelector('.admin-table tbody')
                if (!tbody) return
                tbody.innerHTML = coupons.map(c => `
                    <tr>
                        <td><strong>${c.code}</strong></td>
                        <td>${c.description || '-'}</td>
                        <td>${c.discountPercent ? c.discountPercent + '%' : (c.discountAmount?.toLocaleString('vi-VN') + ' đ') || '-'}</td>
                        <td>${c.minOrderAmount?.toLocaleString('vi-VN') || '-'} đ</td>
                        <td>${c.usedCount || 0}/${c.maxUsage || '∞'}</td>
                        <td>${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
                        <td><span class="status-badge ${c.active ? 'active' : 'inactive'}">${c.active ? 'Hoạt động' : 'Tắt'}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon btn-edit-coupon" data-id="${c.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon danger btn-del-coupon" data-id="${c.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')

                document.querySelectorAll('.btn-del-coupon').forEach(btn => {
                    btn.onclick = async () => {
                        if (!confirm('Xóa coupon này?')) return
                        try {
                            await adminRequest(`/api/admin/coupons/${btn.dataset.id}`, { method: 'DELETE' })
                            loadCoupons()
                        } catch (err) { alert(err.message) }
                    }
                })
            } catch (err) { console.error('Lỗi load coupons:', err) }
        }
        loadCoupons()

        // Form tạo/sửa coupon
        const couponForm = document.getElementById('couponForm')
        if (couponForm) {
            couponForm.addEventListener('submit', async e => {
                e.preventDefault()
                const id = couponForm.querySelector('[name="id"]')?.value
                const payload = {
                    code: couponForm.querySelector('[name="code"]').value.trim(),
                    description: couponForm.querySelector('[name="description"]')?.value,
                    discountPercent: parseFloat(couponForm.querySelector('[name="discountPercent"]')?.value) || null,
                    discountAmount: parseFloat(couponForm.querySelector('[name="discountAmount"]')?.value) || null,
                    minOrderAmount: parseFloat(couponForm.querySelector('[name="minOrderAmount"]')?.value) || null,
                    maxUsage: parseInt(couponForm.querySelector('[name="maxUsage"]')?.value) || null,
                    active: couponForm.querySelector('[name="active"]')?.checked ?? true,
                    expiresAt: couponForm.querySelector('[name="expiresAt"]')?.value || null
                }
                try {
                    if (id) await adminRequest(`/api/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
                    else await adminRequest('/api/admin/coupons', { method: 'POST', body: JSON.stringify(payload) })
                    alert('Lưu thành công!')
                    couponForm.reset()
                    loadCoupons()
                } catch (err) { alert(err.message) }
            })
        }
    }

    // ─── QUẢN LÝ SẢN PHẨM (admin-products.html) ───
    if (currentPath.includes('admin-products.html')) {
        let allProducts = [];
        const itemsPerPage = 12;
        let currentPage = 1;

        const renderProducts = (page) => {
            const tbody = document.querySelector('.admin-table tbody');
            if (!tbody) return;
            const start = (page - 1) * itemsPerPage;
            const pageProducts = allProducts.slice(start, start + itemsPerPage);

            tbody.innerHTML = pageProducts.map(p => `
                <tr>
                    <td><input type="checkbox" /></td>
                    <td>${p.name}</td>
                    <td>${p.categoryName || p.categoryId || 'N/A'}</td>
                    <td>${(p.price || 0).toLocaleString('vi-VN')} đ</td>
                    <td>${p.quantity || 0}</td>
                    <td><span class="status-badge ${(p.quantity || 0) > 0 ? 'active' : 'inactive'}">${(p.quantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <a href="admin-product-edit.html?id=${p.id}" class="btn-icon" title="Sửa"><i class="fas fa-edit"></i></a>
                            <button class="btn-icon danger btn-del-p" data-id="${p.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.btn-del-p').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm(`Xóa sản phẩm này?`)) {
                        try {
                            await adminRequest(`/api/admin/products/${btn.dataset.id}`, { method: 'DELETE' });
                            allProducts = allProducts.filter(p => p.id !== btn.dataset.id);
                            renderProducts(currentPage);
                            renderProductPagination();
                        } catch (err) { alert(err.message); }
                    }
                };
            });
            renderProductPagination();
        };

        const renderProductPagination = () => {
            const container = document.querySelector('.pagination');
            if (!container) return;
            const totalPages = Math.ceil(allProducts.length / itemsPerPage);
            container.innerHTML = '';
            if (totalPages <= 1) return;

            const prev = document.createElement('button');
            prev.className = 'btn-paging'; prev.disabled = currentPage === 1;
            prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prev.onclick = () => { currentPage--; renderProducts(currentPage); };
            container.appendChild(prev);

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `btn-paging ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => { currentPage = i; renderProducts(currentPage); };
                container.appendChild(btn);
            }

            const next = document.createElement('button');
            next.className = 'btn-paging'; next.disabled = currentPage === totalPages;
            next.innerHTML = '<i class="fas fa-chevron-right"></i>';
            next.onclick = () => { currentPage++; renderProducts(currentPage); };
            container.appendChild(next);
        };

        const loadProducts = async () => {
            try {
                allProducts = await adminRequest('/api/admin/products');
                renderProducts(currentPage);
            } catch (err) { console.error("Lỗi danh sách SP:", err); }
        };
        loadProducts();
    }

    // ─── QUẢN LÝ DANH MỤC (admin-categories.html) ───
    if (currentPath.includes('admin-categories.html')) {
        const loadCategories = async () => {
            try {
                const categories = await adminRequest('/api/categories');
                const tbody = document.querySelector('.admin-table tbody');
                if (!tbody) return;

                tbody.innerHTML = categories.map(c => `
                    <tr>
                        <td><input type="checkbox" /></td>
                        <td>${c.name}</td>
                        <td>${c.description || ''}</td>
                        <td>--</td>
                        <td><span class="status-badge active">Hiển thị</span></td>
                        <td>
                            <div class="action-buttons">
                                <a href="admin-category-edit.html?id=${c.id}" class="btn-icon" title="Sửa"><i class="fas fa-edit"></i></a>
                                <button class="btn-icon danger btn-del-c" data-id="${c.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                document.querySelectorAll('.btn-del-c').forEach(btn => {
                    btn.onclick = async () => {
                        if (confirm(`Xóa danh mục ID: ${btn.dataset.id}?`)) {
                            try {
                                await adminRequest(`/api/admin/categories/${btn.dataset.id}`, { method: 'DELETE' });
                                alert('Đã xóa!');
                                loadCategories();
                            } catch (err) { alert(err.message); }
                        }
                    };
                });
            } catch (err) { console.error("Lỗi danh mục:", err); }
        };
        loadCategories();
    }

    // ─── QUẢN LÝ TÀI KHOẢN (admin-users.html) ───
    if (currentPath.includes('admin-users.html')) {
        let allUsers = [];
        const itemsPerPage = 8;
        let currentPage = 1;

        const renderTable = (page) => {
            const tbody = document.getElementById('adminUserTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageUsers = allUsers.slice(start, end);

            if (pageUsers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Không tìm thấy tài khoản nào.</td></tr>';
                return;
            }

            tbody.innerHTML = pageUsers.map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>${u.phone || '-'}</td>
                    <td>${u.email}</td>
                    <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '29/3/2026'}</td>
                    <td><span class="status-badge ${u.enabled ? 'active' : 'inactive'}">${u.enabled ? 'Hoạt động' : 'Tạm khóa'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <a href="admin-user-add.html?id=${u.id}" class="btn-icon" title="Sửa"><i class="fas fa-edit"></i></a>
                            <button class="btn-icon danger btn-del-u" data-id="${u.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.btn-del-u').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm(`Xóa tài khoản ID: ${btn.dataset.id}?`)) {
                        try {
                            await adminRequest(`/api/admin/users/${btn.dataset.id}`, { method: 'DELETE' });
                            alert('Đã xóa!');
                            loadUsers();
                        } catch (err) { alert(err.message); }
                    }
                };
            });
            renderPagination();
        };

        const renderPagination = () => {
            const container = document.getElementById('adminUserPagination');
            if (!container) return;
            const totalPages = Math.ceil(allUsers.length / itemsPerPage);
            container.innerHTML = '';

            if (totalPages <= 1) return;

            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn-paging';
            prevBtn.disabled = currentPage === 1;
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.onclick = () => { currentPage--; renderTable(currentPage); };
            container.appendChild(prevBtn);

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `btn-paging ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => { currentPage = i; renderTable(currentPage); };
                container.appendChild(btn);
            }

            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn-paging';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.onclick = () => { currentPage++; renderTable(currentPage); };
            container.appendChild(nextBtn);
        };

        const loadUsers = async () => {
            try {
                allUsers = await adminRequest('/api/admin/users');
                applyUserFilters();
            } catch (err) {
                console.error("Lỗi khi tải người dùng:", err);
            }
        };

        const applyUserFilters = () => {
            const search = document.getElementById('userSearchInput')?.value?.toLowerCase() || '';
            const sort = document.getElementById('userSortSelect')?.value || 'newest';

            let filtered = allUsers.filter(u =>
                (u.username || '').toLowerCase().includes(search) ||
                (u.email || '').toLowerCase().includes(search) ||
                (u.phone || '').includes(search)
            );

            if (sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            else if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            else if (sort === 'name') filtered.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

            allUsers = filtered;
            currentPage = 1;
            renderTable(currentPage);
            allUsers = [...allUsers];
        };

        document.getElementById('userSearchInput')?.addEventListener('input', () => {
            adminRequest('/api/admin/users').then(data => { allUsers = data; applyUserFilters(); });
        });
        document.getElementById('userSortSelect')?.addEventListener('change', () => {
            adminRequest('/api/admin/users').then(data => { allUsers = data; applyUserFilters(); });
        });

        loadUsers();
    }

    // ─── FORM XỬ LÝ (ADD/EDIT) ───
    const adminForm = document.querySelector('.admin-form');
    if (adminForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');
        const isProduct = currentPath.includes('product');
        const isUser = currentPath.includes('user');
        const isCategory = currentPath.includes('category');

        if (editId && isUser) {
            document.getElementById('pageTitle').textContent = 'Chỉnh sửa tài khoản';
        }

        // Điền dữ liệu cho Form Edit
        if (editId) {
            let path = '';
            if (isProduct) path = `/api/products/${editId}`;
            else if (isCategory) path = `/api/categories/${editId}`;
            else if (isUser) path = `/api/admin/users/${editId}`;

            adminRequest(path).then(data => {
                if (!data) return;
                Object.keys(data).forEach(key => {
                    const input = adminForm.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') input.checked = data[key];
                        else if (input.name === 'password') input.value = ''; // Don't show password
                        else input.value = data[key];

                        // Chạy preview cho ảnh nếu là URL field
                        const preview = input.closest('.form-group')?.querySelector('.preview-image');
                        if (preview && (key.toLowerCase().includes('url') || key === 'imageUrl' || key === 'thumbnailUrl')) {
                            preview.src = data[key];
                        }
                    }
                });
            }).catch(err => console.error("Nạp dữ liệu cũ lỗi:", err));
        }

        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(adminForm);
            const payload = Object.fromEntries(formData.entries());

            // Handle checkbox for boolean values
            const checkboxes = adminForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                payload[cb.name] = cb.checked;
            });

            // Chuyển kiểu số cho các trường Backend mong đợi kiểu double/int
            if (isProduct) {
                payload.price = parseFloat(payload.price || 0);
                payload.quantity = parseInt(payload.quantity || 0);
            }

            let baseUrl = '';
            if (isProduct) baseUrl = '/api/admin/products';
            else if (isCategory) baseUrl = '/api/admin/categories';
            else if (isUser) baseUrl = '/api/admin/users';

            const url = editId ? `${baseUrl}/${editId}` : baseUrl;
            const method = editId ? 'PUT' : 'POST';

            try {
                await adminRequest(url, {
                    method: method,
                    body: JSON.stringify(payload)
                });
                alert('Dữ liệu đã được lưu thành công!');
                let redirect = '';
                if (isProduct) redirect = 'admin-products.html';
                else if (isCategory) redirect = 'admin-categories.html';
                else if (isUser) redirect = 'admin-users.html';
                window.location.href = redirect;
            } catch (err) {
                alert('Lỗi khi lưu: ' + err.message);
            }
        });
    }
});
