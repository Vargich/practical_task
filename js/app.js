// ===== СОСТОЯНИЕ =====
let currentPage = 'home';

// Сохраняем оригинальный HTML главной ТОЛЬКО при первой загрузке
let homeHTML = '';
document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-content');
  if (main && window.location.pathname.includes('index')) {
    homeHTML = main.innerHTML;
  }
});

// ===== YANDEX MAPS =====
function initMapInContainer() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;
  mapContainer.innerHTML = '';
  if (typeof ymaps !== 'undefined') {
    ymaps.ready(() => {
      if (typeof initYandexMap === 'function') initYandexMap();
    });
  }
}

// ===== МОДАЛЬНОЕ ОКНО =====
window.openAuthModal = function(e) {
  if (e) e.preventDefault();
  document.getElementById('authModal').style.display = 'flex';
};
window.closeAuthModal = function() {
  document.getElementById('authModal').style.display = 'none';
};
document.getElementById('authModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeAuthModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

window.switchTab = function(tab) {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (tab === 'login') {
    tabLogin.style.background = '#FF5733'; tabLogin.style.color = 'white';
    tabRegister.style.background = '#f3f4f6'; tabRegister.style.color = 'black';
    loginForm.style.display = 'block'; registerForm.style.display = 'none';
  } else {
    tabRegister.style.background = '#FF5733'; tabRegister.style.color = 'white';
    tabLogin.style.background = '#f3f4f6'; tabLogin.style.color = 'black';
    registerForm.style.display = 'block'; loginForm.style.display = 'none';
  }
  document.getElementById('authMessage').innerHTML = '';
};

window.handleLogin = function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showMsg('Заполните все поля', true);
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    showMsg('Добро пожаловать, ' + user.name + '!', false);
    setTimeout(() => { closeAuthModal(); updateUserUI(user.name); }, 1000);
  } else showMsg('Неверный email или пароль', true);
};

window.handleRegister = function(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) return showMsg('Заполните все поля', true);
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.find(u => u.email === email)) return showMsg('Пользователь с таким email уже существует', true);
  users.push({ name, email, password });
  localStorage.setItem('users', JSON.stringify(users));
  showMsg('Регистрация успешна! Войдите.', false);
  setTimeout(() => { switchTab('login'); document.getElementById('loginEmail').value = email; }, 1000);
};

function showMsg(msg, err) {
  const el = document.getElementById('authMessage');
  el.innerHTML = '<span style="color:' + (err ? 'red' : 'green') + '">' + msg + '</span>';
}

// ===== ОТОБРАЖЕНИЕ ИМЕНИ =====
function updateUserUI(name) {
  const loginBtn = document.getElementById('headerLoginBtn');
  if (loginBtn) {
    loginBtn.innerHTML = '<i class="fas fa-user-check"></i> <span>' + name + '</span>';
    loginBtn.onclick = function(e) { e.preventDefault(); window.location.href = 'account.html'; };
    loginBtn.removeAttribute('onclick');
  }
}

(function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) updateUserUI(currentUser.name);
})();

// ===== МОБИЛЬНОЕ МЕНЮ =====
document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
  this.classList.toggle('open');
  document.getElementById('shopNav')?.classList.toggle('open');
});

document.querySelectorAll('#shopNav a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('shopNav')?.classList.remove('open');
    document.getElementById('mobileMenuBtn')?.classList.remove('open');
  });
});

// ===== НАВИГАЦИЯ =====
function updateActiveNav(page) {
  document.querySelectorAll('#shopNav a').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) link.classList.add('active');
  });
}

document.querySelectorAll('#shopNav a').forEach(link => {
  if (link.getAttribute('href') === 'index.html' || link.getAttribute('href') === '#home') link.dataset.page = 'home';
  else if (link.getAttribute('href') === '#catalog') link.dataset.page = 'catalog';
  else if (link.getAttribute('href') === '#about' || link.textContent.trim().toLowerCase().includes('о нас')) link.dataset.page = 'about';
});

document.querySelectorAll('#shopNav a[data-page]').forEach(link => {
  link.addEventListener('click', function(e) {
    const page = this.dataset.page;
    if (page === 'home') { e.preventDefault(); goHome(); }
    else if (page === 'catalog') { e.preventDefault(); goToCatalog(); }
    else if (page === 'about') { e.preventDefault(); loadAboutPage(); }
    updateActiveNav(page);
  });
});

window.goHome = function() {
  const main = document.getElementById('main-content');
  if (main && homeHTML) {
    main.innerHTML = homeHTML;
    currentPage = 'home';
    updateActiveNav('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    initCatalog();
    initPattern();
    initShopsAndMap();
    updateCartCount();
    document.getElementById('currentYear').textContent = new Date().getFullYear();
  } else {
    location.reload();
  }
};

window.goToCatalog = function() {
  if (currentPage === 'about') goHome();
  currentPage = 'catalog';
  updateActiveNav('catalog');
  setTimeout(() => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
};

window.loadAboutPage = function(e) {
  if (e) e.preventDefault();
  const main = document.getElementById('main-content');
  if (!main) return;
  currentPage = 'about';
  updateActiveNav('about');
  main.innerHTML = `
    <section class="about-page"><div class="about-page__container"><h1>О компании</h1><div class="about-content"><div class="about-text"><h2>Метиз Электрод — надёжный партнёр с 2006 года</h2><p>Более 15 лет мы обеспечиваем предприятия и организации всем необходимым. Поставщик промышленных материалов и оборудования для Камышина и Волгоградской области.</p><div class="about-features"><span>⚙️ Метизы и крепёж</span><span>🔥 Сварочное оборудование</span><span>🛠️ Инструмент</span><span>📦 Промышленный прокат</span><span>👷 Средства защиты</span><span>⛓️ Такелаж</span></div></div><div class="about-advantages"><div class="advantage-item">Работаем с НДС</div><div class="advantage-item">Наличный и безналичный расчет</div><div class="advantage-item">Широкий складской ассортимент</div><div class="advantage-item">Ориентация на потребности предприятий</div></div></div></div></section>
    <section class="contact-page"><div class="contact-page__container"><h2>Контакты</h2><div class="contact-cards"><div class="contact-card"><h3>Менеджеры</h3><p><i class="fas fa-phone-alt"></i> <a href="tel:+78445790099">+7(84457) 9-00-99</a></p></div><div class="contact-card"><h3>Коммерческий отдел</h3><p><i class="fas fa-phone-alt"></i> <a href="tel:+79610893812">+7(961)089-38-12</a></p></div><div class="contact-card"><h3>Почта</h3><p><i class="fas fa-envelope"></i> <a href="mailto:metiz-elektrod@mail.ru">metiz-elektrod@mail.ru</a></p></div></div><div class="contact-map"><div class="list"><div class="info-shop"><ul id="shops"></ul></div><div class="map-wrapper"><button class="show-shops-btn">Список магазинов</button><div id="map"></div></div></div></div></div></section>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initShopsAndMap();
  setTimeout(() => initMapInContainer(), 300);
};

// ===== ПОДСВЕТКА МЕНЮ =====
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (currentPage !== 'home') return;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;
    updateActiveNav(window.scrollY + 200 < catalog.offsetTop ? 'home' : 'catalog');
  }, 100);
});

// ===== КАТАЛОГ =====
const products = [
  { id:1, name:"Сварочный инвертор РДС 200А", price:15900, oldPrice:18900, category:"welding", image:"image/invertor.png", rating:5, reviews:24, badge:"hit" },
  { id:2, name:"Электроды МР-3 3 мм (5 кг)", price:1200, category:"welding", image:"image/electrode.png", rating:4, reviews:18 },
  { id:3, name:"Горелка аргонодуговая TIG-26", price:8500, category:"welding", image:"image/argon.png", rating:5, reviews:7, badge:"new" },
  { id:4, name:"Полуавтомат сварочный ПДГ-250", price:45000, oldPrice:52000, category:"welding", image:"image/auto.png", rating:4, reviews:12, badge:"hit" },
  { id:5, name:"Цепь стальная 10 мм (метр)", price:350, category:"rigging", image:"image/test.png", rating:4, reviews:31 },
  { id:6, name:"Трос стальной 5 м", price:800, category:"rigging", image:"image/test.png", rating:5, reviews:9 },
  { id:7, name:"Строп текстильный 2 т", price:550, category:"rigging", image:"image/test.png", rating:3, reviews:5 },
  { id:8, name:"Лист нержавеющий 2 мм", price:3200, category:"metal", image:"image/nerj.png", rating:4, reviews:15 },
  { id:9, name:"Бронзовый пруток 10 мм", price:2800, category:"metal", image:"image/bronze.png", rating:5, reviews:8 },
  { id:10, name:"Алюминиевый уголок 40х40", price:950, category:"metal", image:"image/alumium.png", rating:4, reviews:22 },
  { id:11, name:"Медная проволока 2 мм", price:1800, category:"metal", image:"image/copper.png", rating:3, reviews:4 },
  { id:12, name:"Дрель ударная 750 Вт", price:4200, oldPrice:5100, category:"tools", image:"image/screw-driver.png", rating:5, reviews:42, badge:"hit" },
  { id:13, name:"Набор отвёрток 10 шт", price:1500, category:"tools", image:"image/screw (1).png", rating:4, reviews:16 },
  { id:14, name:"Перфоратор 1000 Вт", price:8500, category:"tools", image:"image/cross.png", rating:4, reviews:11, badge:"new" },
  { id:15, name:"Крепёж нержавеющий (набор)", price:350, oldPrice:450, category:"rigging", image:"image/nerj_krep.png", rating:5, reviews:28 },
  { id:16, name:"Болт М12х50 (10 шт)", price:180, category:"fasteners", image:"image/screw.png", rating:4, reviews:35 },
  { id:17, name:"Гайка М12 (20 шт)", price:120, category:"fasteners", image:"image/screw.png", rating:5, reviews:19 },
  { id:18, name:"Шайба пружинная М12", price:15, category:"fasteners", image:"image/screw.png", rating:3, reviews:7 },
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentFilter = 'all';
let currentCatalogPage = 1;
let currentSearch = '';
const ITEMS_PER_PAGE = 8;

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); updateCartSidebar(); }
function updateCartCount() {
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = cart.reduce((s,i) => s + i.quantity, 0));
}

window.addToCart = function(id) {
  const p = products.find(x => x.id === id);
  const exist = cart.find(x => x.id === id);
  exist ? exist.quantity++ : cart.push({...p, quantity:1});
  saveCart();
  showToast(p.name + ' добавлен в корзину');
};

window.removeFromCart = function(id) { cart = cart.filter(x => x.id !== id); saveCart(); updateCartSidebar(); showToast('Товар удалён'); };
window.updateQty = function(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
};

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

window.filterCatalog = function(cat) {
  currentFilter = cat;
  currentCatalogPage = 1;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-chip[data-filter="'+cat+'"]')?.classList.add('active');
  renderProducts();
};

function getFilteredProducts() {
  let f = products;
  if (currentFilter !== 'all') f = f.filter(p => p.category === currentFilter);
  if (currentSearch) f = f.filter(p => p.name.toLowerCase().includes(currentSearch.toLowerCase()));
  return f;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = getFilteredProducts();
  const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (currentCatalogPage - 1) * ITEMS_PER_PAGE;
  const items = filtered.slice(start, start + ITEMS_PER_PAGE);
  grid.innerHTML = items.map(p => `
    <div class="product-card">
      ${p.badge ? '<span class="product-card__badge '+p.badge+'">'+(p.badge==='hit'?'Хит':'Новинка')+'</span>' : ''}
      <div class="product-card__img"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
      <div class="product-card__info">
        <span class="product-card__category">${getCategoryName(p.category)}</span>
        <h3>${p.name}</h3>
        <div class="product-card__rating">${'★'.repeat(Math.floor(p.rating||0))} <span>(${p.reviews||0})</span></div>
        <div class="product-card__price"><span class="product-card__price-current">${p.price.toLocaleString()} ₽</span>${p.oldPrice ? '<span class="product-card__price-old">'+p.oldPrice.toLocaleString()+' ₽</span>' : ''}</div>
        <button class="product-card__btn" onclick="addToCart(${p.id})">В корзину</button>
      </div>
    </div>`).join('');
  let pag = document.getElementById('pagination');
  if (!pag) { pag = document.createElement('div'); pag.id = 'pagination'; pag.className = 'pagination'; grid.after(pag); }
  pag.innerHTML = total <= 1 ? '' : Array.from({length: total}, (_,i) => `<button class="${i+1===currentCatalogPage?'active':''}" onclick="goToPage(${i+1})">${i+1}</button>`).join('');
}

window.goToPage = function(p) { currentCatalogPage = p; renderProducts(); document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'}); };

function getCategoryName(c) {
  const m = { welding:'Сварка', rigging:'Такелаж', metal:'Прокат', tools:'Инструмент', fasteners:'Крепёж' };
  return m[c] || c;
}

// ===== КОРЗИНА =====
window.openCart = function(e) {
  if (e) e.preventDefault();
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartSidebar')?.classList.add('open');
  updateCartSidebar();
};
window.closeCart = function() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
};

function updateCartSidebar() {
  const items = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  if (!items || !total) return;
  if (cart.length === 0) {
    items.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;"><i class="fas fa-shopping-cart" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>Корзина пуста</div>';
    total.textContent = '0 ₽'; return;
  }
  items.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__img"><img src="${item.image}" alt="${item.name}" /></div>
      <div class="cart-item__info"><h4>${item.name}</h4><div class="cart-item__price">${item.price.toLocaleString()} ₽</div>
        <div class="cart-item__qty"><button onclick="updateQty(${item.id},-1)">−</button><span>${item.quantity}</span><button onclick="updateQty(${item.id},1)">+</button></div>
      </div>
      <button class="cart-item__remove" onclick="removeFromCart(${item.id})">&times;</button>
    </div>`).join('');
  total.textContent = cart.reduce((s,i) => s + i.price * i.quantity, 0).toLocaleString() + ' ₽';
}

window.checkout = function() {
  if (cart.length === 0) return alert('Корзина пуста');
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) { closeCart(); openAuthModal(); return alert('Войдите для оформления заказа'); }
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push({ id: Date.now(), items: [...cart], total: cart.reduce((s,i) => s + i.price * i.quantity, 0), date: new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}), time: new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}), status: 'processing', userName: user.name, userEmail: user.email });
  localStorage.setItem('orders', JSON.stringify(orders));
  cart = []; saveCart(); updateCartSidebar(); closeCart();
  showToast('Заказ оформлен!');
  setTimeout(() => { if (confirm('Перейти в личный кабинет?')) location.href = 'account.html'; }, 1500);
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initCatalog() {
  document.querySelectorAll('.filter-chip').forEach(b => b.addEventListener('click', () => filterCatalog(b.dataset.filter)));
  const s = document.getElementById('globalSearch');
  if (s) {
    s.addEventListener('input', e => { currentSearch = e.target.value; currentCatalogPage = 1; renderProducts(); document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'}); });
    s.addEventListener('focus', () => document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'}));
    s.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'}); } });
  }
  renderProducts();
}

function initPattern() {
  const p = document.querySelector('.pattern-track');
  if (p) new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) p.classList.add('animate'); else p.classList.remove('animate'); }), {threshold:0.1}).observe(p);
}

function initShopsAndMap() {
  const shops = document.getElementById('shops');
  if (shops) shops.addEventListener('click', function(e) { if (e.target.tagName === 'LI') { document.querySelectorAll('#shops li').forEach(l => l.classList.remove('active')); e.target.classList.add('active'); } });
  const btn = document.querySelector('.show-shops-btn');
  const panel = document.querySelector('.info-shop');
  if (btn && panel) btn.addEventListener('click', () => panel.classList.toggle('open'));
}

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productsGrid')) {
    initCatalog();
    initPattern();
    updateCartCount();
    updateActiveNav('home');
    document.getElementById('currentYear').textContent = new Date().getFullYear();
  }
  if (document.getElementById('shops') && document.getElementById('map')) {
    initShopsAndMap();
    setTimeout(initMapInContainer, 300);
  }
});

// ===== ИЗБРАННОЕ =====
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
window.toggleWishlist = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const exist = wishlist.find(i => i.id === id);
  exist ? wishlist = wishlist.filter(i => i.id !== id) : wishlist.push(p);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  showToast(exist ? 'Удалено из избранного' : 'Добавлено в избранное');
};