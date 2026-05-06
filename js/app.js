// ===== СОСТОЯНИЕ =====
let currentPage = "home";
let homeHTML = "";
let homeSaved = false;

// ===== YANDEX MAPS =====
function initMapInContainer() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  mapContainer.innerHTML = "";
  if (typeof ymaps !== "undefined") {
    ymaps.ready(() => {
      if (typeof initYandexMap === "function") initYandexMap();
    });
  }
}

// ===== МОДАЛЬНОЕ ОКНО =====
window.closeAuthModal = function () {
  document.getElementById("authModal").style.display = "none";
};
document.getElementById("authModal")?.addEventListener("click", function (e) {
  if (e.target === this) closeAuthModal();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeAuthModal();
});

// ===== АВТОРИЗАЦИЯ =====
let authCode = null;
let authContact = null;
let authContactType = null;

window.goToStep1 = function () {
  document.getElementById("authStep1").style.display = "block";
  document.getElementById("authStep2").style.display = "none";
  document.getElementById("authStep3").style.display = "none";
};
window.moveCodeInput = function (input) {
  input.value = input.value.replace(/\D/g, "");
  if (input.value.length === 1) {
    const next = input.nextElementSibling;
    if (next && next.classList.contains("code-input")) next.focus();
  }
};
window.checkCodeComplete = function (input) {
  input.value = input.value.replace(/\D/g, "");
  if (input.value.length === 1) setTimeout(verifyCode, 200);
};

window.sendCode = function () {
  const input = document.getElementById("authContact");
  const raw = input.value.trim();
  if (!raw) return alert("Введите телефон или email");

  if (raw.includes("@") || /[a-zA-Z]/.test(raw)) {
    authContact = raw;
    authContactType = "email";
  } else {
    authContact = raw.replace(/\D/g, "");
    authContactType = "phone";
  }

  authCode = String(Math.floor(10000 + Math.random() * 90000));
  alert("Код: " + authCode);
  document.getElementById("authStep1").style.display = "none";
  document.getElementById("authStep2").style.display = "block";
  document.getElementById("codeDestination").textContent =
    authContactType === "email" ? authContact : "+" + authContact;
  document.querySelectorAll(".code-input").forEach((i) => (i.value = ""));
  document.querySelector(".code-input").focus();
};

window.verifyCode = function () {
  const inputs = document.querySelectorAll(".code-input");
  let code = "";
  inputs.forEach((i) => (code += i.value));
  if (code !== authCode) return alert("Неверный код");

  const data = {};
  if (authContactType === "phone") data.phone = authContact;
  else data.email = authContact;

  api.authCheck(data).then((res) => {
    if (res.exists) {
      localStorage.setItem("currentUser", JSON.stringify(res.user));
      closeAuthModal();
      updateUserUI(res.user.name);
    } else {
      document.getElementById("authStep2").style.display = "none";
      document.getElementById("authStep3").style.display = "block";
    }
  });
};

window.completeRegistration = function () {
  const name = document.getElementById("regName").value.trim();
  if (!name) {
    alert("Введите имя");
    return;
  }

  const data = { name };
  if (authContactType === "phone") data.phone = authContact;
  else data.email = authContact;

  console.log("Отправляю:", data);

  api
    .registerQuick(data)
    .then((res) => {
      console.log("Ответ:", res);
      if (res.success) {
        localStorage.setItem("currentUser", JSON.stringify(res.user));
        closeAuthModal();
        updateUserUI(res.user.name);
        showToast("Регистрация успешна!");
      } else {
        alert("Ошибка: " + (res.error || "неизвестная"));
      }
    })
    .catch((err) => {
      console.error("Ошибка запроса:", err);
      alert("Ошибка сервера. Проверьте консоль.");
    });
};

window.openAuthModal = function (e) {
  if (e) e.preventDefault();
  document.getElementById("authStep1").style.display = "block";
  document.getElementById("authStep2").style.display = "none";
  document.getElementById("authStep3").style.display = "none";
  const input = document.getElementById("authContact");
  if (input) {
    input.value = "";
    input.placeholder = "+7 (___) ___-__-__ или email@example.com";
  }
  document.getElementById("authInputIcon").className = "fas fa-phone-alt";
  document.getElementById("authModal").style.display = "flex";
};

// ===== УМНЫЙ ВВОД: ТЕЛЕФОН / EMAIL =====
(function () {
  const input = document.getElementById("authContact");
  if (!input) return;

  let isEmail = false;

  input.addEventListener("input", function () {
    const val = this.value;
    const icon = document.getElementById("authInputIcon");

    // Если есть @ или буквы — режим EMAIL
    if (val.includes("@") || /[a-zA-Z]/.test(val)) {
      if (!isEmail) {
        isEmail = true;
        // Убираем всё: +, 7, скобки, дефисы, пробелы
        this.value = val
          .replace(/^\+7[\s\(\)\-]*/, "")
          .replace(/[\s\(\)\-]/g, "");
      }
      icon.className = "fas fa-envelope";
      this.placeholder = "email@example.com";
      return;
    }

    // Режим ТЕЛЕФОН
    isEmail = false;
    icon.className = "fas fa-phone-alt";
    this.placeholder = "+7 (___) ___-__-__";

    let clean = val.replace(/\D/g, "");

    if (clean.length === 0) {
      this.value = "";
      return;
    }

    if (clean.startsWith("8")) clean = "7" + clean.slice(1);
    if (clean.length > 0 && !clean.startsWith("7")) clean = "7" + clean;
    if (clean.length > 11) clean = clean.slice(0, 11);

    let formatted = "+7";
    if (clean.length > 1) formatted += " (" + clean.slice(1, 4);
    if (clean.length >= 4) formatted += ") " + clean.slice(4, 7);
    if (clean.length >= 7) formatted += "-" + clean.slice(7, 9);
    if (clean.length >= 9) formatted += "-" + clean.slice(9, 11);

    this.value = formatted;
    this.setSelectionRange(formatted.length, formatted.length);
  });

  // Backspace — удаляет скобки, дефисы, пробелы вместе с цифрами перед ними
  // Backspace
  // Backspace — просто даём удалить и переформатируем
  input.addEventListener("keydown", function (e) {
    if (isEmail) return;

    if (e.key === "Backspace") {
      const cursorPos = this.selectionStart;
      let val = this.value;

      if (cursorPos > 0) {
        const prevChar = val[cursorPos - 1];

        // Если удаляем символ маски
        if (/[\s()\-\+]/.test(prevChar)) {
          e.preventDefault();

          // 👉 ищем ближайшую цифру слева
          let i = cursorPos - 1;
          while (i > 0 && /\D/.test(val[i])) {
            i--;
          }

          const before = val.slice(0, i);
          const after = val.slice(cursorPos);

          this.value = before + after;

          this.setSelectionRange(i, i);
          this.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }
  });
})();
// ===== ИМЯ =====
function updateUserUI(name) {
  const btn = document.getElementById("headerLoginBtn");
  if (btn) {
    btn.innerHTML =
      '<i class="fas fa-user-check"></i> <span>' + name + "</span>";
    btn.onclick = function (e) {
      e.preventDefault();
      location.href = "account.html";
    };
  }
}
(function () {
  const u = JSON.parse(localStorage.getItem("currentUser"));
  if (u) updateUserUI(u.name);
})();

// ===== МОБИЛЬНОЕ МЕНЮ =====
document
  .getElementById("mobileMenuBtn")
  ?.addEventListener("click", function () {
    this.classList.toggle("open");
    document.getElementById("shopNav")?.classList.toggle("open");
  });

// ===== НАВИГАЦИЯ =====
function updateActiveNav(page) {
  document.querySelectorAll("#shopNav a").forEach((l) => {
    l.classList.remove("active");
    if (l.dataset.page === page) l.classList.add("active");
  });
}

window.goHome = function () {
  if (!homeSaved) {
    location.reload();
    return;
  }
  const m = document.getElementById("main-content");
  if (m && homeHTML) {
    m.innerHTML = homeHTML;
    currentPage = "home";
    updateActiveNav("home");
    window.scrollTo(0, 0);
    setTimeout(() => {
      initCatalog();
      initPattern();
      updateCartCount();
    }, 100);
  } else location.reload();
};

window.goToCatalog = function () {
  if (currentPage === "about" && homeSaved) {
    const m = document.getElementById("main-content");
    if (m && homeHTML) {
      m.innerHTML = homeHTML;
      setTimeout(() => {
        initCatalog();
        initPattern();
        updateCartCount();
      }, 100);
    }
  }
  // НЕ меняем currentPage — пусть скролл сам решает
  updateActiveNav("catalog");
  setTimeout(
    () =>
      document
        .getElementById("catalog")
        ?.scrollIntoView({ behavior: "smooth" }),
    200,
  );
};
window.loadAboutPage = function (e) {
  if (e) e.preventDefault();
  const m = document.getElementById("main-content");
  if (!m) return;
  currentPage = "about";
  updateActiveNav("about");
  m.innerHTML = `
    <section class="about-page">
      <div class="about-page__container">
        <h1>О компании</h1>
        <div class="about-content">
          <div class="about-text">
            <h2>Метиз Электрод — надёжный партнёр с 2006 года</h2>
            <p>Более 15 лет мы обеспечиваем предприятия и организации всем необходимым. Поставщик промышленных материалов и оборудования для Камышина и Волгоградской области.</p>
            <div class="about-features">
              <span>⚙️ Метизы и крепёж</span><span>🔥 Сварочное оборудование</span>
              <span>🛠️ Инструмент</span><span>📦 Промышленный прокат</span>
              <span>👷 Средства защиты</span><span>⛓️ Такелаж</span>
            </div>
          </div>
          <div class="about-advantages">
            <div class="advantage-item">Работаем с НДС</div>
            <div class="advantage-item">Наличный и безналичный расчет</div>
            <div class="advantage-item">Широкий складской ассортимент</div>
            <div class="advantage-item">Ориентация на потребности предприятий</div>
          </div>
        </div>
      </div>
    </section>
    <section class="contact-page">
      <div class="contact-page__container">
        <h2>Контакты</h2>
        <div class="contact-cards">
          <div class="contact-card"><h3>Менеджеры</h3><p><i class="fas fa-phone-alt"></i> <a href="tel:+78445790099">+7(84457) 9-00-99</a></p></div>
          <div class="contact-card"><h3>Коммерческий отдел</h3><p><i class="fas fa-phone-alt"></i> <a href="tel:+79610893812">+7(961)089-38-12</a></p></div>
          <div class="contact-card"><h3>Почта</h3><p><i class="fas fa-envelope"></i> <a href="mailto:metiz-elektrod@mail.ru">metiz-elektrod@mail.ru</a></p></div>
        </div>
        <div class="contact-map">
          <div class="list">
            <div class="info-shop"><ul id="shops"></ul></div>
            <div class="map-wrapper"><button class="show-shops-btn">Список магазинов</button><div id="map"></div></div>
          </div>
        </div>
      </div>
    </section>
    <footer class="shop-footer">
      <div class="shop-footer__container">
        <span class="shop-footer__copy">&copy; <span id="currentYearAbout">2024</span> Метиз Электрод</span>
        <nav class="shop-footer__links">
          <a href="#" onclick="goHome()">Главная</a>
          <a href="#" onclick="goToCatalog()">Каталог</a>
          <a href="#" onclick="loadAboutPage(event)">О нас</a>
        </nav>
        <a href="tel:+79610893812" class="shop-footer__phone">+7 (961) 089-38-12</a>
      </div>
    </footer>
  `;
  window.scrollTo(0, 0);
  setTimeout(() => {
    initShopsAndMap();
    initMapInContainer();
    document.getElementById("currentYearAbout").textContent =
      new Date().getFullYear();
  }, 200);
};
document.querySelectorAll("#shopNav a").forEach((link) => {
  const h = link.getAttribute("href");
  if (h === "index.html" || h === "#home" || h === "/")
    link.dataset.page = "home";
  else if (h === "#catalog") link.dataset.page = "catalog";
  else if (h === "#about") link.dataset.page = "about";
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const p = this.dataset.page;
    if (p === "home") goHome();
    else if (p === "catalog") goToCatalog();
    else if (p === "about") loadAboutPage();
    updateActiveNav(p);
    document.getElementById("shopNav")?.classList.remove("open");
    document.getElementById("mobileMenuBtn")?.classList.remove("open");
  });
});

// ===== КАТАЛОГ =====
let currentFilter = "all",
  currentCatalogPage = 1,
  currentSearch = "";
const ITEMS_PER_PAGE = 8;

async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  try {
    const p = new URLSearchParams({
      page: currentCatalogPage,
      limit: ITEMS_PER_PAGE,
    });
    if (currentFilter !== "all") p.append("category", currentFilter);
    if (currentSearch) p.append("search", currentSearch);
    if (typeof currentSort !== "undefined" && currentSort !== "default")
      p.append("sort", currentSort);
    const r = await fetch("/api/products?" + p.toString());
    const d = await r.json();
    renderProducts(d.products, d.totalPages);

    // Обновляем счётчик
    const countEl = document.querySelector(".catalog-count");
    if (countEl) countEl.textContent = "Найдено: " + d.total + " товаров";
  } catch (e) {
    grid.innerHTML = '<p style="text-align:center;color:red;">Ошибка</p>';
  }
}

function renderProducts(products, totalPages) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  if (!products || !products.length) {
    grid.innerHTML = '<p style="text-align:center;padding:3rem;">Товары не найдены</p>';
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }
  grid.innerHTML = products
    .map((p) => {
      let badges = '';
      if (p.badge === 'hit') badges += '<span class="product-badge badge-hit">🔥 Хит</span>';
      if (p.badge === 'new') badges += '<span class="product-badge badge-new">✨ Новинка</span>';
      
      if (!p.in_stock) badges += '<span class="product-badge badge-out">Под заказ</span>';
      
      return `
    <div class="product-card">
      ${badges ? '<div class="product-badges">' + badges + '</div>' : ''}
      <div class="product-card__img" onclick="openProductModal(${p.id})" style="cursor:pointer;">
        <img src="${p.image || 'image/no-photo.png'}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-card__info">
        <span class="product-card__category">${p.category_name || ''}</span>
        <h3>${p.name}</h3>
        <div class="product-card__price">
          <span class="product-card__price-current">${Number(p.price).toLocaleString()} ₽</span>
          ${p.old_price ? '<span class="product-card__price-old">' + Number(p.old_price).toLocaleString() + ' ₽</span>' : ''}
        </div>
        <button class="product-card__btn" onclick="event.stopPropagation();addToCart(${p.id})">В корзину</button>
      </div>
    </div>`;
    }).join("");
  
  const pag = document.getElementById("paginationContainer");
  if (pag && totalPages > 1) {
    let h = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++)
      h += `<button class="${i === currentCatalogPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    pag.innerHTML = h + '</div>';
  } else if (pag) pag.innerHTML = '';
}
window.goToPage = function (p) {
  currentCatalogPage = p;
  loadProducts();
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
};
window.filterCatalog = function (c) {
  currentFilter = c;
  currentCatalogPage = 1;
  loadProducts();
};

function initCatalog() {
  fetch("/api/categories")
    .then((r) => r.json())
    .then((cats) => {
      const c = document.getElementById("catalogFilters");
      if (c) {
        c.innerHTML =
          '<button class="filter-chip active" data-filter="all">Все</button>' +
          cats
            .map(
              (x) =>
                `<button class="filter-chip" data-filter="${x.slug}">${x.name}</button>`,
            )
            .join("");
        c.querySelectorAll(".filter-chip").forEach((b) =>
          b.addEventListener("click", function () {
            filterCatalog(this.dataset.filter);
            c.querySelectorAll(".filter-chip").forEach((x) =>
              x.classList.remove("active"),
            );
            this.classList.add("active");
          }),
        );
      }
    });

  // Тулбар с сортировкой
  const toolbar = document.getElementById("catalogToolbar");
  if (toolbar) {
    toolbar.innerHTML = `
      <span class="catalog-count" style="color:#6b7280;font-size:0.9rem;"></span>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <label style="font-size:0.9rem;color:#6b7280;">Сортировка:</label>
        <select id="sortSelect" style="padding:0.4rem 0.8rem;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;">
          <option value="default">По умолчанию</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="name">По названию</option>
        </select>
      </div>
    `;
    document.getElementById("sortSelect").addEventListener("change", function () {
      changeSort(this.value);
    });
  }

  loadProducts();

  // Поиск
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
        // Поиск с подсказками
    const suggestionsBox = document.getElementById("searchSuggestions");
    let searchTimeout;

    searchInput.addEventListener("input", function (e) {
      const query = e.target.value.trim();
      clearTimeout(searchTimeout);

      if (query.length === 0) {
        if (suggestionsBox) suggestionsBox.style.display = "none";
        currentSearch = "";
        currentCatalogPage = 1;
        loadProducts();
        return;
      }

      // Показываем подсказки с задержкой
      searchTimeout = setTimeout(() => {
        fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`)
          .then(r => r.json())
          .then(d => {
            if (!suggestionsBox) return;
            if (d.products && d.products.length > 0) {
              suggestionsBox.innerHTML = d.products.map(p => `
                <div onclick="selectSuggestion('${p.name.replace(/'/g, "\\'")}')" 
                     style="display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1rem;cursor:pointer;border-bottom:1px solid #f3f4f6;"
                     onmouseover="this.style.background='#f9fafb'" 
                     onmouseout="this.style.background='#fff'">
                  <img src="${p.image || 'image/no-photo.png'}" style="width:36px;height:36px;object-fit:contain;border-radius:6px;" />
                  <div style="flex:1;">
                    <div style="font-size:0.9rem;font-weight:500;">${p.name}</div>
                    <div style="font-size:0.8rem;color:#FF5733;">${Number(p.price).toLocaleString()} ₽</div>
                  </div>
                </div>
              `).join("");
              suggestionsBox.style.display = "block";
            } else {
              suggestionsBox.innerHTML = '<div style="padding:1rem;text-align:center;color:#9ca3af;">Ничего не найдено</div>';
              suggestionsBox.style.display = "block";
            }
          });
      }, 250);

      // Параллельно обновляем каталог
      currentSearch = query;
      currentCatalogPage = 1;
      loadProducts();
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Скрываем подсказки при клике вне
    document.addEventListener("click", function (e) {
      if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
      }
    });

    // Enter — поиск
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (suggestionsBox) suggestionsBox.style.display = "none";
        currentSearch = searchInput.value.trim();
        currentCatalogPage = 1;
        loadProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

      searchInput.addEventListener("focus", function () {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ===== АНИМИРОВАННЫЙ PLACEHOLDER =====
    let productNames = [];
    
    fetch('/api/products?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d.products && d.products.length > 0) {
          productNames = d.products.map(p => p.name);
        }
      });

    let idx = 0, charIdx = 0, deleting = false;

    function animatePlaceholder() {
      if (!searchInput || document.activeElement === searchInput) {
        setTimeout(animatePlaceholder, 2000);
        return;
      }
      if (productNames.length === 0) {
        setTimeout(animatePlaceholder, 1000);
        return;
      }

      const word = productNames[idx];

      if (!deleting) {
        searchInput.placeholder = word.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx >= word.length) { deleting = true; setTimeout(animatePlaceholder, 2000); return; }
      } else {
        searchInput.placeholder = word.slice(0, charIdx);
        charIdx--;
        if (charIdx <= 0) { deleting = false; idx = (idx + 1) % productNames.length; }
      }
      setTimeout(animatePlaceholder, deleting ? 40 : 80);
    }

    animatePlaceholder();
  }
}

window.selectSuggestion = function (name) {
  const searchInput = document.getElementById("globalSearch");
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (searchInput) searchInput.value = name;
  if (suggestionsBox) suggestionsBox.style.display = "none";
  currentSearch = name;
  currentCatalogPage = 1;
  loadProducts();
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.changeSort = function (sort) {
  currentSort = sort;
  currentCatalogPage = 1;
  loadProducts();
};

// ===== БЕГУЩАЯ СТРОКА =====
function initPattern() {
  const p = document.querySelector(".pattern-track");
  if (p)
    new IntersectionObserver(
      (e) =>
        e.forEach((x) => {
          if (x.isIntersecting) p.classList.add("animate");
          else p.classList.remove("animate");
        }),
      { threshold: 0.1 },
    ).observe(p);
}

// ===== МАГАЗИНЫ И КАРТА =====
function initShopsAndMap() {
  const s = document.getElementById("shops");
  if (s)
    s.addEventListener("click", function (e) {
      if (e.target.tagName === "LI") {
        s.querySelectorAll("li").forEach((l) => l.classList.remove("active"));
        e.target.classList.add("active");
      }
    });
  const btn = document.querySelector(".show-shops-btn");
  const panel = document.querySelector(".info-shop");
  if (btn && panel)
    btn.addEventListener("click", () => panel.classList.toggle("open"));
}

// ===== КОРЗИНА (МОДАЛЬНОЕ ОКНО) =====
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  document
    .querySelectorAll("#cart-count")
    .forEach((e) => (e.textContent = cart.reduce((s, i) => s + i.quantity, 0)));
}

window.addToCart = function (id) {
  // Проверяем, есть ли товар уже в корзине
  const exist = cart.find((x) => x.id === id);
  if (exist) {
    exist.quantity++;
    saveCart();
    showToast(exist.name + " добавлен в корзину (×" + exist.quantity + ")");
    return;
  }

  // Загружаем с сервера только ОДИН раз
  fetch("http://localhost:3000/api/products/" + id)
    .then((r) => r.json())
    .then((p) => {
      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        quantity: 1,
      });
      saveCart();
      showToast(p.name + " добавлен в корзину");
    });
};

window.removeFromCart = function (id) {
  cart = cart.filter((x) => x.id !== id);
  saveCart();
  updateCartSidebar();
  showToast("Товар удалён");
};

window.updateQty = function (id, delta) {
  const item = cart.find((x) => x.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter((x) => x.id !== id);
  saveCart();
  updateCartSidebar();
};

window.openCart = function (e) {
  if (e) e.preventDefault();
  if (cart.length === 0) {
    showToast("Корзина пуста");
    return;
  }
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartSidebar")?.classList.add("open");
  updateCartSidebar();
};

window.closeCart = function () {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartSidebar")?.classList.remove("open");
};

function updateCartSidebar() {
  const items = document.getElementById("cartItems");
  const total = document.getElementById("cartTotal");
  if (!items || !total) return;

  if (cart.length === 0) {
    items.innerHTML =
      '<div style="text-align:center;padding:2rem;color:#9ca3af;">Корзина пуста</div>';
    total.textContent = "0 ₽";
    return;
  }

  // Используем данные из корзины (уже сохранены) без запросов к серверу
  items.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item__img"><img src="${item.image || "image/no-photo.png"}" alt="${item.name}" /></div>
      <div class="cart-item__info">
        <h4>${item.name}</h4>
        <div class="cart-item__price">${Number(item.price).toLocaleString()} ₽</div>
        <div class="cart-item__qty">
          <button onclick="updateQty(${item.id}, -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item__remove" onclick="removeFromCart(${item.id})">&times;</button>
    </div>
  `,
    )
    .join("");

  total.textContent =
    cart
      .reduce((s, i) => s + Number(i.price) * i.quantity, 0)
      .toLocaleString() + " ₽";
}

window.checkout = function () {
  if (cart.length === 0) return showToast("Корзина пуста");
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    closeCart();
    openAuthModal();
    showToast("Войдите для оформления заказа");
    return;
  }

  api
    .createOrder({
      userId: user.id,
      items: cart.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
      total: cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
    })
    .then((res) => {
      if (res.success) {
        cart = [];
        saveCart();
        updateCartSidebar();
        closeCart();
        showToast("Заказ #" + res.orderId + " оформлен!");
        setTimeout(() => {
          if (confirm("Перейти в личный кабинет?"))
            location.href = "account.html";
        }, 1500);
      }
    })
    .catch(() => showToast("Ошибка оформления заказа"));
};

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:20px;right:20px;background:#111827;color:#fff;padding:1rem 1.5rem;border-radius:12px;z-index:99999;animation:toastIn 0.3s ease;";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ===== СТАРТ =====
const main = document.getElementById("main-content");
if (main && document.getElementById("productsGrid") && !homeSaved) {
  homeHTML = main.innerHTML;
  homeSaved = true;
}

function fullInit() {
  initCatalog();
  initPattern();
  updateCartCount();
  updateActiveNav("home");
  // Перепривязываем кнопку корзины в шапке
  const cartBtn = document.querySelector(".shop-header__cart");
  if (cartBtn) {
    cartBtn.onclick = function (e) {
      openCart(e);
    };
  }
}

fullInit();

// Обновляем goHome и goToCatalog чтобы переинициализировать корзину
const origGoHome = window.goHome;
window.goHome = function () {
  origGoHome();
  setTimeout(() => {
    const cartBtn = document.querySelector(".shop-header__cart");
    if (cartBtn)
      cartBtn.onclick = function (e) {
        openCart(e);
      };
  }, 200);
};

const origGoToCatalog = window.goToCatalog;
window.goToCatalog = function () {
  origGoToCatalog();
  setTimeout(() => {
    const cartBtn = document.querySelector(".shop-header__cart");
    if (cartBtn)
      cartBtn.onclick = function (e) {
        openCart(e);
      };
  }, 200);
};

// ===== ПОДСВЕТКА МЕНЮ ПРИ СКРОЛЛЕ =====
window.addEventListener("scroll", () => {
  const catalog = document.getElementById("catalog");
  if (!catalog) return;

  // Не работаем на странице "О нас"
  if (!document.getElementById("productsGrid")) return;

  const scrollPos = window.scrollY + 200;
  const catalogTop = catalog.offsetTop;

  if (scrollPos < catalogTop) {
    updateActiveNav("home");
  } else {
    updateActiveNav("catalog");
  }
});

window.addEventListener("scroll", function () {
  const btn = document.getElementById("scrollToTopBtn");
  if (btn) {
    if (window.scrollY > 500) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  }
});
