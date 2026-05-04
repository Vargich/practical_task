const API = 'http://localhost:3000/api';



const api = {
  // Категории
  getCategories: () => fetch(`${API}/categories`).then(r => r.json()),

  // Товары
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API}/products?${query}`).then(r => r.json());
  },

  getProduct: (id) => fetch(`${API}/products/${id}`).then(r => r.json()),

  // Пользователь
  register: (data) => fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  login: (data) => fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  updateProfile: (id, data) => fetch(`${API}/profile/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Заказы
  createOrder: (data) => fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  getOrders: (userId) => fetch(`${API}/orders/${userId}`).then(r => r.json()),

  // Избранное
  getWishlist: (userId) => fetch(`${API}/wishlist/${userId}`).then(r => r.json()),

  toggleWishlist: (userId, productId) => fetch(`${API}/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId })
  }).then(r => r.json()),

   // Быстрая авторизация по коду
  authCheck: (data) => fetch(`${API}/auth-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  registerQuick: (data) => fetch(`${API}/register-quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
};

