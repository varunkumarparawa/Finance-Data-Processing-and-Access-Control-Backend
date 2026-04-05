const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Financial records table
    db.run(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Create demo data if tables are empty
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (row.count === 0) {
        // Add demo users
        db.run(`INSERT INTO users (username, email, role, status) 
                VALUES ('john_viewer', 'john@example.com', 'viewer', 'active')`);
        db.run(`INSERT INTO users (username, email, role, status) 
                VALUES ('sarah_analyst', 'sarah@example.com', 'analyst', 'active')`);
        db.run(`INSERT INTO users (username, email, role, status) 
                VALUES ('admin_user', 'admin@example.com', 'admin', 'active')`);

        // Add demo records
        db.run(`INSERT INTO records (userId, amount, type, category, description, date) 
                VALUES (1, 5000, 'income', 'salary', 'Monthly salary', '2024-12-01')`);
        db.run(`INSERT INTO records (userId, amount, type, category, description, date) 
                VALUES (2, 500, 'expense', 'food', 'Groceries', '2024-12-15')`);
        db.run(`INSERT INTO records (userId, amount, type, category, description, date) 
                VALUES (2, 200, 'expense', 'utilities', 'Electric bill', '2024-12-10')`);
        db.run(`INSERT INTO records (userId, amount, type, category, description, date) 
                VALUES (3, 3000, 'income', 'freelance', 'Project payment', '2024-12-20')`);

        console.log('Demo data created');
      }
    });
  });
}

// User queries
function getUser(userId, callback) {
  db.get('SELECT * FROM users WHERE id = ?', [userId], callback);
}

function getAllUsers(callback) {
  db.all('SELECT id, username, email, role, status FROM users', callback);
}

function createUser(username, email, role, callback) {
  db.run(
    'INSERT INTO users (username, email, role) VALUES (?, ?, ?)',
    [username, email, role],
    function(err) {
      if (!err) callback(null, this.lastID);
      else callback(err);
    }
  );
}

function updateUser(userId, updates, callback) {
  const { username, email, role, status } = updates;
  db.run(
    'UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?',
    [username || null, email || null, role || null, status || null, userId],
    callback
  );
}

function deleteUser(userId, callback) {
  db.run('DELETE FROM users WHERE id = ?', [userId], callback);
}

function updateUserStatus(userId, status, callback) {
  db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId], callback);
}

// Record queries
function getRecord(recordId, callback) {
  db.get('SELECT * FROM records WHERE id = ?', [recordId], callback);
}

function getRecordsByUser(userId, filters, callback) {
  let query = 'SELECT * FROM records WHERE userId = ?';
  const params = [userId];

  if (filters.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.startDate) {
    query += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND date <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY date DESC';
  db.all(query, params, callback);
}

function getAllRecords(filters, callback) {
  let query = 'SELECT r.*, u.username FROM records r JOIN users u ON r.userId = u.id WHERE 1=1';
  const params = [];

  if (filters.type) {
    query += ' AND r.type = ?';
    params.push(filters.type);
  }
  if (filters.category) {
    query += ' AND r.category = ?';
    params.push(filters.category);
  }
  if (filters.startDate) {
    query += ' AND r.date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND r.date <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY r.date DESC';
  db.all(query, params, callback);
}

function createRecord(userId, amount, type, category, description, date, callback) {
  db.run(
    'INSERT INTO records (userId, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, amount, type, category, description, date],
    function(err) {
      if (!err) callback(null, this.lastID);
      else callback(err);
    }
  );
}

function updateRecord(recordId, updates, callback) {
  const { amount, type, category, description, date } = updates;
  db.run(
    'UPDATE records SET amount = ?, type = ?, category = ?, description = ?, date = ? WHERE id = ?',
    [amount, type, category, description, date, recordId],
    callback
  );
}

function deleteRecord(recordId, callback) {
  db.run('DELETE FROM records WHERE id = ?', [recordId], callback);
}

// Summary/Dashboard queries
function getIncomeExpenseSummary(userId, callback) {
  const query = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
    FROM records 
    WHERE userId = ?
  `;
  db.get(query, [userId], callback);
}

function getCategoryWiseTotals(userId, callback) {
  const query = `
    SELECT 
      category,
      type,
      SUM(amount) as total,
      COUNT(*) as count
    FROM records 
    WHERE userId = ?
    GROUP BY category, type
    ORDER BY total DESC
  `;
  db.all(query, [userId], callback);
}

function getRecentRecords(userId, limit, callback) {
  const query = `
    SELECT * FROM records 
    WHERE userId = ? 
    ORDER BY date DESC 
    LIMIT ?
  `;
  db.all(query, [userId, limit], callback);
}

function getMonthlyTrends(userId, callback) {
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM records 
    WHERE userId = ?
    GROUP BY month, type
    ORDER BY month DESC
    LIMIT 12
  `;
  db.all(query, [userId], callback);
}

module.exports = {
  db,
  initializeDatabase,
  // User functions
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  // Record functions
  getRecord,
  getRecordsByUser,
  getAllRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  // Summary functions
  getIncomeExpenseSummary,
  getCategoryWiseTotals,
  getRecentRecords,
  getMonthlyTrends
};
