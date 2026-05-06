const multer = require('multer');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка загрузки фото
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'image/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'product_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Только изображения'));
  }
});

// Excel upload storage
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'excel_' + Date.now() + path.extname(file.originalname))
});
const uploadExcel = multer({ storage: excelStorage });

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
      article TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      category_id INTEGER,
      image TEXT DEFAULT 'image/no-photo.png',
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
const catCount = db.exec('SELECT COUNT(*) as count FROM categories');
  if (catCount[0]?.values[0][0] === 0) {
    const cats = [
      ['Сварка', 'welding'],
      ['Такелаж', 'rigging'],
      ['Прокат', 'metal'],
      ['Инструмент', 'tools'],
      ['Крепёж', 'fasteners'],
    ];
    cats.forEach(c => db.run("INSERT INTO categories (name, slug) VALUES (?, ?)", c));
  }

  // Заполняем товары
  const prodCount = db.exec('SELECT COUNT(*) as count FROM products');
  if (prodCount[0]?.values[0][0] === 0) {
    const products = [
      ['Сварочный инвертор РДС 200А', 'СВ-001', 15900, 1, 'image/invertor.png', 'hit', 1],
      ['Электроды МР-3 3 мм (5 кг)', 'СВ-002', 1200, 1, 'image/electrode.png', null, 1],
      ['Горелка аргонодуговая TIG-26', 'СВ-003', 8500, 1, 'image/argon.png', 'new', 1],
      ['Полуавтомат сварочный ПДГ-250', 'СВ-004', 45000, 1, 'image/auto.png', 'hit', 1],
      ['Цепь стальная 10 мм (метр)', 'ТК-001', 350, 2, 'image/test.png', null, 1],
      ['Трос стальной 5 м', 'ТК-002', 800, 2, 'image/test.png', null, 1],
      ['Строп текстильный 2 т', 'ТК-003', 550, 2, 'image/test.png', null, 1],
      ['Лист нержавеющий 2 мм', 'ПР-001', 3200, 3, 'image/nerj.png', null, 1],
      ['Бронзовый пруток 10 мм', 'ПР-002', 2800, 3, 'image/bronze.png', null, 1],
      ['Алюминиевый уголок 40х40', 'ПР-003', 950, 3, 'image/alumium.png', null, 1],
      ['Медная проволока 2 мм', 'ПР-004', 1800, 3, 'image/copper.png', null, 1],
      ['Дрель ударная 750 Вт', 'ИН-001', 4200, 4, 'image/screw-driver.png', 'hit', 1],
      ['Набор отвёрток 10 шт', 'ИН-002', 1500, 4, 'image/screw (1).png', null, 1],
      ['Перфоратор 1000 Вт', 'ИН-003', 8500, 4, 'image/cross.png', 'new', 1],
      ['Болт М12х50 (10 шт)', 'КР-001', 180, 5, 'image/screw.png', null, 1],
      ['Гайка М12 (20 шт)', 'КР-002', 120, 5, 'image/screw.png', null, 1],
      ['Шайба пружинная М12', 'КР-003', 15, 5, 'image/screw.png', null, 1],
      ['Крепёж нержавеющий (набор)', 'КР-004', 350, 2, 'image/nerj_krep.png', null, 1],
    ];
    products.forEach(p => {
      db.run('INSERT INTO products (name, article, price, category_id, image, badge, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?)', p);
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
  while (stmt.step()) result.push(stmt.getAsObject());
  stmt.free();
  return result;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql, params = []) {
  // Проверка на undefined
  const safeParams = params.map(p => p === undefined ? null : p);
  db.run(sql, safeParams);
  saveDatabase();
}

// ===== ПУБЛИЧНЫЕ API =====

app.get('/api/categories', (req, res) => {
  res.json(queryAll('SELECT * FROM categories'));
});

app.get('/api/products', (req, res) => {
  const { category, search, page = 1, limit = 8, sort } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (category && category !== 'all') { where += ' AND c.slug = ?'; params.push(category); }

  let orderBy = 'ORDER BY p.id DESC';
  const sqlAll = `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderBy}`;
  let allProducts = queryAll(sqlAll, params);

  if (search) {
    const s = search.toLowerCase();
    allProducts = allProducts.filter(p => p.name && p.name.toLowerCase().includes(s));
  }
  if (sort === 'price-asc') allProducts.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') allProducts.sort((a, b) => b.price - a.price);
  else if (sort === 'name') allProducts.sort((a, b) => a.name.localeCompare(b.name));

  const total = allProducts.length;
  const offset = (Number(page) - 1) * Number(limit);
  const products = allProducts.slice(offset, offset + Number(limit));

  res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

app.get('/api/products/:id', (req, res) => {
  const p = queryOne('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Не найден' });
  res.json(p);
});

app.post('/api/auth-check', (req, res) => {
  const { phone, email } = req.body;
  let user;
  if (phone) user = queryOne('SELECT id, name, email, phone FROM users WHERE phone = ?', [phone]);
  else if (email) user = queryOne('SELECT id, name, email, phone FROM users WHERE email = ?', [email]);
  res.json(user ? { exists: true, user } : { exists: false });
});

app.post('/api/register-quick', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Введите имя' });
  if (!phone && !email) return res.status(400).json({ error: 'Нет контакта' });

  if (phone) {
    const u = queryOne('SELECT id, name, email, phone FROM users WHERE phone = ?', [phone]);
    if (u) return res.json({ success: true, user: u });
  }
  if (email) {
    const u = queryOne('SELECT id, name, email, phone FROM users WHERE email = ?', [email]);
    if (u) return res.json({ success: true, user: u });
  }

  try {
    run('INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)', [name, phone || '', email || '', 'phone_auth']);
    const user = queryOne('SELECT id, name, email, phone FROM users WHERE ' + (phone ? 'phone = ?' : 'email = ?'), [phone || email]);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile/:id', (req, res) => {
  const { name, phone, address } = req.body;
  run('UPDATE users SET name=?, phone=?, address=? WHERE id=?', [name, phone, address, req.params.id]);
  res.json({ success: true, user: queryOne('SELECT id, name, email, phone, address FROM users WHERE id=?', [req.params.id]) });
});

app.post('/api/orders', (req, res) => {
  const { userId, items, total } = req.body;
  db.run('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)', [userId, total, 'processing']);
  saveDatabase();
  const orderId = db.exec('SELECT MAX(id) as id FROM orders')[0].values[0][0];
  if (items && items.length > 0) {
    items.forEach(item => {
      db.run('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [orderId, item.id, item.quantity, item.price]);
    });
    saveDatabase();
  }
  res.json({ success: true, orderId });
});

app.get('/api/orders/:userId', (req, res) => {
  const orders = queryAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
  res.json(orders.map(order => ({
    ...order,
    items: queryAll('SELECT oi.*, p.name, p.image, p.article FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [order.id])
  })));
});

// Отмена заказа пользователем
app.put('/api/orders/:id/cancel', (req, res) => {
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  if (order.status !== 'processing') return res.status(400).json({ error: 'Можно отменить только заказ в обработке' });
  run('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
  res.json({ success: true });
});

app.get('/api/wishlist/:userId', (req, res) => {
  res.json(queryAll('SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?', [req.params.userId]));
});

app.post('/api/wishlist', (req, res) => {
  const { userId, productId } = req.body;
  const exist = queryOne('SELECT id FROM wishlist WHERE user_id=? AND product_id=?', [userId, productId]);
  if (exist) { run('DELETE FROM wishlist WHERE id=?', [exist.id]); res.json({ added: false }); }
  else { run('INSERT INTO wishlist (user_id, product_id) VALUES (?,?)', [userId, productId]); res.json({ added: true }); }
});

// ===== ЗАЩИТА АДМИНКИ =====
app.use('/api/admin', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Требуется авторизация' });

  const base64 = authHeader.split(' ')[1] || '';
  const [login, password] = Buffer.from(base64, 'base64').toString().split(':');

  const user = queryOne('SELECT * FROM users WHERE (email = ? OR phone = ?) AND is_admin = 1', [login, login]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
});

// ===== АДМИНКА =====

// Загрузка фото
app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  res.json({ success: true, path: 'image/' + req.file.filename });
});

// Загрузка из Excel
app.post('/api/admin/upload-excel', uploadExcel.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    let added = 0;
    let errors = 0;
    
    data.forEach(row => {
      if (row.name && row.price) {
        try {
          db.run('INSERT INTO products (name, article, price, category_id, image, badge, in_stock) VALUES (?,?,?,?,?,?,?)',
            [row.name, row.article || '', row.price || 0, row.category_id || 1, 'image/no-photo.png', row.badge || null, row.in_stock ?? 1]);
          added++;
        } catch (e) {
          errors++;
        }
      }
    });
    saveDatabase();
    
    res.json({ success: true, added, total: data.length, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Товары
app.get('/api/admin/products', (req, res) => res.json(queryAll('SELECT * FROM products ORDER BY id DESC')));
app.get('/api/admin/products/:id', (req, res) => res.json(queryOne('SELECT * FROM products WHERE id=?', [req.params.id])));
app.post('/api/admin/products', (req, res) => {
  const { name, article, price, category_id, image, badge, in_stock } = req.body;
  run('INSERT INTO products (name, article, price, category_id, image, badge, in_stock) VALUES (?,?,?,?,?,?,?)', 
    [name || '', article || '', price || 0, category_id || 1, image || 'image/no-photo.png', badge || null, in_stock ?? 1]);
  res.json({ success: true });
});
app.put('/api/admin/products/:id', (req, res) => {
  const { name, article, price, category_id, image, badge, in_stock } = req.body;
  run('UPDATE products SET name=?, article=?, price=?, category_id=?, image=?, badge=?, in_stock=? WHERE id=?', 
    [name || '', article || '', price || 0, category_id || 1, image || 'image/no-photo.png', badge || null, in_stock ?? 1, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/admin/products/:id', (req, res) => { run('DELETE FROM products WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Категории
app.post('/api/admin/categories', (req, res) => { run('INSERT INTO categories (name, slug) VALUES (?,?)', [req.body.name, req.body.slug]); res.json({ success: true }); });
app.put('/api/admin/categories/:id', (req, res) => { run('UPDATE categories SET name=?, slug=? WHERE id=?', [req.body.name, req.body.slug, req.params.id]); res.json({ success: true }); });
app.delete('/api/admin/categories/:id', (req, res) => { run('DELETE FROM categories WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Пользователи
app.get('/api/admin/users', (req, res) => res.json(queryAll('SELECT id, name, email, phone, address, created_at FROM users ORDER BY id DESC')));

// Заказы
app.get('/api/admin/orders', (req, res) => {
  const orders = queryAll('SELECT o.*, u.name as user_name, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
  res.json(orders.map(o => ({ ...o, items: queryAll('SELECT oi.*, p.name, p.image, p.article FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [o.id]) })));
});
app.put('/api/admin/orders/:id', (req, res) => { run('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]); res.json({ success: true }); });
app.delete('/api/admin/orders/:id', (req, res) => { run('DELETE FROM order_items WHERE order_id=?', [req.params.id]); run('DELETE FROM orders WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Запуск
initDatabase().then(() => {
  app.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`));
});