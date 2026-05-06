const readline = require('readline');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function createAdmin() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  
  let db;
  try {
    db = new SQL.Database(fs.readFileSync('metiz.db'));
  } catch {
    console.log('База не найдена. Сначала запустите сервер.');
    process.exit(1);
  }

  rl.question('Логин: ', (email) => {
    rl.question('Пароль: ', (password) => {
      const hash = bcrypt.hashSync(password, 10);
      
      const exist = db.exec(`SELECT COUNT(*) as c FROM users WHERE email = '${email}'`);
      if (exist[0]?.values[0][0] > 0) {
        db.run(`UPDATE users SET password = ?, is_admin = 1 WHERE email = ?`, [hash, email]);
      } else {
        db.run(`INSERT INTO users (name, email, password, is_admin) VALUES ('Админ', ?, ?, 1)`, [email, hash]);
      }
      
      fs.writeFileSync('metiz.db', Buffer.from(db.export()));
      console.log('Админ создан!');
      rl.close();
    });
  });
}

createAdmin();