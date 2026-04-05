const GEO_API = 'https://provinces.open-api.vn/api'

const provinceSelect = document.querySelector('[name="province"], #provinceSelect, select[name="province"]')
    || document.querySelectorAll('select')[0]
const districtSelect = document.querySelector('[name="district"], #districtSelect')
    || document.querySelectorAll('select')[1]
const wardSelect = document.querySelector('[name="ward"], #wardSelect')
    || document.querySelectorAll('select')[2]

async function loadProvinces() {
    try {
        const res = await fetch(`${GEO_API}/p/`)
        const provinces = await res.json()
        if (!provinceSelect) return
        provinceSelect.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>' +
            provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('')
    } catch (e) { console.error('Lỗi load tỉnh:', e) }
}

async function loadDistricts(provinceCode) {
    if (!districtSelect) return
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>'
    if (wardSelect) wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>'
    if (!provinceCode) return
    try {
        const res = await fetch(`${GEO_API}/p/${provinceCode}?depth=2`)
        const data = await res.json()
        districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>' +
            data.districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('')
    } catch (e) { console.error('Lỗi load quận:', e) }
}

async function loadWards(districtCode) {
    if (!wardSelect) return
    wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>'
    if (!districtCode) return
    try {
        const res = await fetch(`${GEO_API}/d/${districtCode}?depth=2`)
        const data = await res.json()
        wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>' +
            data.wards.map(w => `<option value="${w.code}">${w.name}</option>`).join('')
    } catch (e) { console.error('Lỗi load phường:', e) }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProvinces()
    provinceSelect?.addEventListener('change', e => loadDistricts(e.target.value))
    districtSelect?.addEventListener('change', e => loadWards(e.target.value))
})
