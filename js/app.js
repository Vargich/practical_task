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
  if (!name) return;
  const data = { name };
  if (authContactType === "phone") data.phone = authContact;
  else data.email = authContact;
  api.registerQuick(data).then((res) => {
    if (res.success) {
      localStorage.setItem("currentUser", JSON.stringify(res.user));
      closeAuthModal();
      updateUserUI(res.user.name);
    }
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
  currentPage = "catalog";
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
  `;
  window.scrollTo(0, 0);
  setTimeout(() => {
    initShopsAndMap();
    initMapInContainer();
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
  grid.innerHTML = '<p style="text-align:center;padding:3rem;">Загрузка...</p>';
  try {
    const p = new URLSearchParams({
      page: currentCatalogPage,
      limit: ITEMS_PER_PAGE,
    });
    if (currentFilter !== "all") p.append("category", currentFilter);
    if (currentSearch) p.append("search", currentSearch);
    const r = await fetch("http://localhost:3000/api/products?" + p.toString());
    const d = await r.json();
    renderProducts(d.products, d.totalPages);
  } catch (e) {
    grid.innerHTML = '<p style="text-align:center;color:red;">Ошибка</p>';
  }
}

function renderProducts(products, totalPages) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  if (!products || !products.length) {
    grid.innerHTML =
      '<p style="text-align:center;padding:3rem;">Товары не найдены</p>';
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
    <div class="product-card">
      <div class="product-card__img"><img src="${p.image || "image/no-photo.png"}" alt="${p.name}" /></div>
      <div class="product-card__info">
        <span class="product-card__category">${p.category_name || ""}</span>
        <h3>${p.name}</h3>
        <div class="product-card__price">${Number(p.price).toLocaleString()} ₽</div>
        <button class="product-card__btn" onclick="addToCart(${p.id})">В корзину</button>
      </div>
    </div>`,
    )
    .join("");
  const pag = document.getElementById("paginationContainer");
  if (pag && totalPages > 1) {
    let h = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++)
      h += `<button class="${i === currentCatalogPage ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
    pag.innerHTML = h + "</div>";
  } else if (pag) pag.innerHTML = "";
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
  fetch("http://localhost:3000/api/categories")
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
  loadProducts();

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    // Удаляем старые обработчики
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    const finalInput = document.getElementById("globalSearch");
    if (finalInput) {
      finalInput.addEventListener("input", function (e) {
        currentSearch = e.target.value;
        currentCatalogPage = 1;
        loadProducts();
        document
          .getElementById("catalog")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      finalInput.addEventListener("focus", function () {
        document
          .getElementById("catalog")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      finalInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          document
            .getElementById("catalog")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }
}

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

// ===== КОРЗИНА =====
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
  fetch("http://localhost:3000/api/products/" + id)
    .then((r) => r.json())
    .then((p) => {
      const ex = cart.find((x) => x.id === id);
      ex
        ? ex.quantity++
        : cart.push({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            quantity: 1,
          });
      saveCart();
      showToast(p.name + " добавлен");
    });
};

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:20px;right:20px;background:#111827;color:#fff;padding:1rem 1.5rem;border-radius:12px;z-index:99999;";
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
initCatalog();
initPattern();
updateCartCount();
updateActiveNav("home");
