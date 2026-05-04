const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db;

async function initDatabase() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  
  try {
    const buffer = fs.readFileSync('metiz.db');
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      old_price REAL,
      category_id INTEGER,
      image TEXT DEFAULT 'image/no-photo.png',
      rating REAL DEFAULT 4.5,
      reviews INTEGER DEFAULT 0,
      badge TEXT,
      description TEXT,
      in_stock INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL DEFAULT 'phone_auth',
    address TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total REAL NOT NULL,
      status TEXT DEFAULT 'processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Заполняем категории
  const catCount = db.exec('SELECT COUNT(*) as count FROM categories');
  if (catCount[0]?.values[0][0] === 0) {
    db.run("INSERT INTO categories (name, slug) VALUES ('Сварка', 'welding')");
    db.run("INSERT INTO categories (name, slug) VALUES ('Такелаж', 'rigging')");
    db.run("INSERT INTO categories (name, slug) VALUES ('Прокат', 'metal')");
    db.run("INSERT INTO categories (name, slug) VALUES ('Инструмент', 'tools')");
    db.run("INSERT INTO categories (name, slug) VALUES ('Крепёж', 'fasteners')");
  }

  // Заполняем товары
  const prodCount = db.exec('SELECT COUNT(*) as count FROM products');
  if (prodCount[0]?.values[0][0] === 0) {
    const products = [
      ['Сварочный инвертор РДС 200А', 15900, 18900, 1, 'image/invertor.png', 5, 24, 'hit'],
      ['Электроды МР-3 3 мм (5 кг)', 1200, null, 1, 'image/electrode.png', 4, 18, null],
      ['Горелка аргонодуговая TIG-26', 8500, null, 1, 'image/argon.png', 5, 7, 'new'],
      ['Полуавтомат сварочный ПДГ-250', 45000, 52000, 1, 'image/auto.png', 4, 12, 'hit'],
      ['Цепь стальная 10 мм (метр)', 350, null, 2, 'image/test.png', 4, 31, null],
      ['Трос стальной 5 м', 800, null, 2, 'image/test.png', 5, 9, null],
      ['Строп текстильный 2 т', 550, null, 2, 'image/test.png', 3, 5, null],
      ['Лист нержавеющий 2 мм', 3200, null, 3, 'image/nerj.png', 4, 15, null],
      ['Бронзовый пруток 10 мм', 2800, null, 3, 'image/bronze.png', 5, 8, null],
      ['Алюминиевый уголок 40х40', 950, null, 3, 'image/alumium.png', 4, 22, null],
      ['Медная проволока 2 мм', 1800, null, 3, 'image/copper.png', 3, 4, null],
      ['Дрель ударная 750 Вт', 4200, 5100, 4, 'image/screw-driver.png', 5, 42, 'hit'],
      ['Набор отвёрток 10 шт', 1500, null, 4, 'image/screw (1).png', 4, 16, null],
      ['Перфоратор 1000 Вт', 8500, null, 4, 'image/cross.png', 4, 11, 'new'],
      ['Крепёж нержавеющий (набор)', 350, 450, 2, 'image/nerj_krep.png', 5, 28, null],
      ['Болт М12х50 (10 шт)', 180, null, 5, 'image/screw.png', 4, 35, null],
      ['Гайка М12 (20 шт)', 120, null, 5, 'image/screw.png', 5, 19, null],
      ['Шайба пружинная М12', 15, null, 5, 'image/screw.png', 3, 7, null],
    ];
    products.forEach(p => {
      db.run(
        'INSERT INTO products (name, price, old_price, category_id, image, rating, reviews, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    });
  }

  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('metiz.db', buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

// ===== API =====

app.get('/api/categories', (req, res) => {
  const cats = queryAll('SELECT * FROM categories');
  res.json(cats);
});

app.get('/api/products', (req, res) => {
  const { category, search, page = 1, limit = 8, sort } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    where += ' AND c.slug = ?';
    params.push(category);
  }

  let orderBy = 'ORDER BY p.id DESC';
  if (sort === 'price-asc') orderBy = 'ORDER BY p.price ASC';
  else if (sort === 'price-desc') orderBy = 'ORDER BY p.price DESC';
  else if (sort === 'name') orderBy = 'ORDER BY p.name ASC';
  else if (sort === 'rating') orderBy = 'ORDER BY p.rating DESC';

  // Получаем ВСЕ товары (без LIMIT) для правильного подсчёта и фильтрации
  const sqlAll = `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderBy}`;
  let allProducts = queryAll(sqlAll, params);

  // Фильтруем по поиску в JavaScript (без учёта регистра)
  if (search) {
    const searchLower = search.toLowerCase();
    allProducts = allProducts.filter(p => p.name && p.name.toLowerCase().includes(searchLower));
  }

  // Сортировка в JS (на случай если sql.js не поддерживает)
  if (sort === 'price-asc') allProducts.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') allProducts.sort((a, b) => b.price - a.price);
  else if (sort === 'name') allProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'rating') allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const totalFiltered = allProducts.length;
  const offset = (Number(page) - 1) * Number(limit);
  const products = allProducts.slice(offset, offset + Number(limit));

  res.json({ 
    products, 
    total: totalFiltered, 
    page: Number(page), 
    totalPages: Math.ceil(totalFiltered / Number(limit)) 
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = queryOne(
    'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
    [req.params.id]
  );
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  res.json(product);
});

app.post('/api/register', (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });

  const existEmail = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existEmail) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

  const existPhone = queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existPhone) return res.status(400).json({ error: 'Пользователь с таким телефоном уже существует' });

  const hash = bcrypt.hashSync(password, 10);
  run('INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)', [name, phone, email, hash]);

  const user = queryOne('SELECT id, name, email, phone, address FROM users WHERE email = ?', [email]);
  res.json({ success: true, user });
});

app.post('/api/login', (req, res) => {
  const { phone, email, password } = req.body;
  
  let user;
  if (phone) {
    user = queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
  } else if (email) {
    user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  } else {
    return res.status(400).json({ error: 'Введите телефон или email' });
  }

  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный пароль' });

  const { password: _, ...userData } = user;
  res.json({ success: true, user: userData });
});

app.put('/api/profile/:id', (req, res) => {
  const { name, phone, address } = req.body;
  run('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.params.id]);
  const user = queryOne('SELECT id, name, email, phone, address FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true, user });
});
app.post('/api/orders', (req, res) => {
  const { userId, items, total } = req.body;
  
  // Вставляем заказ
  db.run('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)', [userId, total, 'processing']);
  
  // Получаем ID заказа по-другому
  const result = db.exec('SELECT MAX(id) as id FROM orders');
  const orderId = result[0].values[0][0];
  
  console.log('Создан заказ #' + orderId, 'товаров:', items ? items.length : 0);
  
  // Сохраняем товары
  if (items && items.length > 0) {
    items.forEach(item => {
      console.log('  Добавляю товар:', item.id, '×' + item.quantity, 'по', item.price);
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    });
    saveDatabase();
  }
  
  // Проверяем, сохранились ли товары
  const checkItems = db.exec('SELECT COUNT(*) as c FROM order_items WHERE order_id = ' + orderId);
  console.log('Товаров в заказе после сохранения:', checkItems[0].values[0][0]);
  
  res.json({ success: true, orderId });
});

app.get('/api/orders/:userId', (req, res) => {
  const orders = queryAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
  const result = orders.map(order => {
    const items = queryAll(
      'SELECT order_items.*, products.name, products.image FROM order_items JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?',
      [order.id]
    );
    return { ...order, items };
  });
  res.json(result);
});

app.get('/api/wishlist/:userId', (req, res) => {
  const items = queryAll(
    'SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?',
    [req.params.userId]
  );
  res.json(items);
});

app.post('/api/wishlist', (req, res) => {
  const { userId, productId } = req.body;
  const exist = queryOne('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
  if (exist) {
    run('DELETE FROM wishlist WHERE id = ?', [exist.id]);
    res.json({ added: false });
  } else {
    run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    res.json({ added: true });
  }
});

// ===== АДМИНКА =====

app.get('/api/admin/products', (req, res) => {
  const products = queryAll('SELECT * FROM products ORDER BY id DESC');
  res.json(products);
});

app.get('/api/admin/products/:id', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(product);
});

app.post('/api/admin/products', (req, res) => {
  const { name, price, old_price, category_id, image, rating, reviews, badge, in_stock } = req.body;
  run(
    'INSERT INTO products (name, price, old_price, category_id, image, rating, reviews, badge, in_stock) VALUES (?,?,?,?,?,?,?,?,?)',
    [name, price, old_price, category_id, image, rating, reviews, badge, in_stock ?? 1]
  );
  res.json({ success: true });
});

app.put('/api/admin/products/:id', (req, res) => {
  const { name, price, old_price, category_id, image, rating, reviews, badge, in_stock } = req.body;
  run(
    'UPDATE products SET name=?, price=?, old_price=?, category_id=?, image=?, rating=?, reviews=?, badge=?, in_stock=? WHERE id=?',
    [name, price, old_price, category_id, image, rating, reviews, badge, in_stock ?? 1, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/admin/products/:id', (req, res) => {
  run('DELETE FROM products WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

app.post('/api/admin/categories', (req, res) => {
  const { name, slug } = req.body;
  run('INSERT INTO categories (name, slug) VALUES (?,?)', [name, slug]);
  res.json({ success: true });
});

app.put('/api/admin/categories/:id', (req, res) => {
  const { name, slug } = req.body;
  run('UPDATE categories SET name=?, slug=? WHERE id=?', [name, slug, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  run('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/users', (req, res) => {
  const users = queryAll('SELECT id, name, email, phone, address, created_at FROM users ORDER BY id DESC');
  res.json(users);
});

app.get('/api/admin/orders', (req, res) => {
  const orders = queryAll('SELECT o.*, u.name as user_name, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
  const result = orders.map(order => {
    const items = queryAll(
      'SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [order.id]
    );
    return { ...order, items };
  });
  res.json(result);
});
app.put('/api/admin/orders/:id', (req, res) => {
  run('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/admin/orders/:id', (req, res) => {
  run('DELETE FROM order_items WHERE order_id=?', [req.params.id]);
  run('DELETE FROM orders WHERE id=?', [req.params.id]);
  res.json({ success: true });
});


// Проверка существования пользователя (для авторизации по коду)
app.post('/api/auth-check', (req, res) => {
  const { phone, email } = req.body;
  let user;
  if (phone) {
    user = queryOne('SELECT id, name, email, phone FROM users WHERE phone = ?', [phone]);
  } else if (email) {
    user = queryOne('SELECT id, name, email, phone FROM users WHERE email = ?', [email]);
  }
  
  if (user) {
    res.json({ exists: true, user });
  } else {
    res.json({ exists: false });
  }
});

// Быстрая регистрация (только имя + телефон/email)
// Быстрая регистрация (только имя + телефон/email)
app.post('/api/register-quick', (req, res) => {
  const { name, phone, email } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Введите имя' });
  if (!phone && !email) return res.status(400).json({ error: 'Не указан телефон или email' });

  // Проверяем, существует ли уже пользователь с таким телефоном или email
  if (phone) {
    const existPhone = queryOne('SELECT id, name, email, phone FROM users WHERE phone = ?', [phone]);
    if (existPhone) {
      // Пользователь уже существует — просто возвращаем его
      return res.json({ success: true, user: existPhone });
    }
  }
  
  if (email) {
    const existEmail = queryOne('SELECT id, name, email, phone FROM users WHERE email = ?', [email]);
    if (existEmail) {
      // Пользователь уже существует — просто возвращаем его
      return res.json({ success: true, user: existEmail });
    }
  }

  // Новый пользователь — создаём
  try {
    run(
      'INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)', 
      [name, phone || null, email || null, 'phone_auth']
    );
    
    const user = queryOne(
      'SELECT id, name, email, phone FROM users WHERE ' + (phone ? 'phone = ?' : 'email = ?'), 
      [phone || email]
    );
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' });
  }
});

// Запуск
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Админка: http://localhost:${PORT}/admin.html`);
  });
});