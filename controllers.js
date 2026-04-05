const db = require('./database');

//  USER CONTROLLERS 

function getAllUsers(req, res) {
  db.getAllUsers((err, users) => {
    if (err) return res.status(500).json({ error: 'Error fetching users' });
    res.json({ success: true, data: users });
  });
}

function createNewUser(req, res) {
  const { username, email, role } = req.body;

  // Validation
  if (!username || !email || !role) {
    return res.status(400).json({ error: 'username, email, and role are required' });
  }

  if (!['viewer', 'analyst', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be: viewer, analyst, or admin' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  db.createUser(username, email, role, (err, userId) => {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Error creating user' });
    }
    res.status(201).json({ success: true, message: 'User created', userId });
  });
}

function getUserProfile(req, res) {
  // req.user is already populated by getCurrentUser middleware
  res.json({ 
    success: true, 
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.createdAt
    }
  });
}

function updateUserProfile(req, res) {
  const { username, email } = req.body;

  db.updateUser(req.user.id, { username, email, role: req.user.role, status: req.user.status }, (err) => {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Error updating profile' });
    }
    res.json({ success: true, message: 'Profile updated' });
  });
}

function changeUserStatus(req, res) {
  const { targetUserId } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'status must be: active or inactive' });
  }

  db.updateUserStatus(targetUserId, status, (err) => {
    if (err) return res.status(500).json({ error: 'Error updating status' });
    res.json({ success: true, message: `User status changed to ${status}` });
  });
}

// ==== RECORD CONTROLLERS ====

function getMyRecords(req, res) {
  const filters = {
    type: req.query.type,
    category: req.query.category,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  db.getRecordsByUser(req.user.id, filters, (err, records) => {
    if (err) return res.status(500).json({ error: 'Error fetching records' });
    res.json({ success: true, count: records.length, data: records });
  });
}

function getAllRecordsAdmin(req, res) {
  const filters = {
    type: req.query.type,
    category: req.query.category,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  db.getAllRecords(filters, (err, records) => {
    if (err) return res.status(500).json({ error: 'Error fetching records' });
    res.json({ success: true, count: records.length, data: records });
  });
}

function createRecord(req, res) {
  const { amount, type, category, description, date } = req.body;

  // Validation
  if (!amount || !type || !category || !date) {
    return res.status(400).json({ error: 'amount, type, category, and date are required' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be: income or expense' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  db.createRecord(req.user.id, amount, type, category, description || '', date, (err, recordId) => {
    if (err) return res.status(500).json({ error: 'Error creating record' });
    res.status(201).json({ success: true, message: 'Record created', recordId });
  });
}

function updateRecord(req, res) {
  const { amount, type, category, description, date } = req.body;

  // Simple validation - at least one field should be provided
  if (!amount && !type && !category && !description && !date) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }

  if (amount && (isNaN(amount) || amount <= 0)) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be: income or expense' });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  const updates = {
    amount: amount || req.record.amount,
    type: type || req.record.type,
    category: category || req.record.category,
    description: description !== undefined ? description : req.record.description,
    date: date || req.record.date
  };

  db.updateRecord(req.record.id, updates, (err) => {
    if (err) return res.status(500).json({ error: 'Error updating record' });
    res.json({ success: true, message: 'Record updated' });
  });
}

function deleteRecord(req, res) {
  db.deleteRecord(req.record.id, (err) => {
    if (err) return res.status(500).json({ error: 'Error deleting record' });
    res.json({ success: true, message: 'Record deleted' });
  });
}

//  DASHBOARD CONTROLLERS 

function getDashboardSummary(req, res) {
  db.getIncomeExpenseSummary(req.user.id, (err, summary) => {
    if (err) return res.status(500).json({ error: 'Error fetching summary' });

    const totalIncome = summary.totalIncome || 0;
    const totalExpense = summary.totalExpense || 0;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      }
    });
  });
}

function getCategoryBreakdown(req, res) {
  db.getCategoryWiseTotals(req.user.id, (err, categories) => {
    if (err) return res.status(500).json({ error: 'Error fetching categories' });

    // Format response
    const formattedCategories = categories.map(cat => ({
      category: cat.category,
      type: cat.type,
      total: cat.total,
      count: cat.count
    }));

    res.json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories
    });
  });
}

function getRecentActivity(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'limit must be between 1 and 100' });
  }

  db.getRecentRecords(req.user.id, limit, (err, records) => {
    if (err) return res.status(500).json({ error: 'Error fetching recent activity' });
    res.json({ success: true, count: records.length, data: records });
  });
}

function getMonthlyTrends(req, res) {
  db.getMonthlyTrends(req.user.id, (err, trends) => {
    if (err) return res.status(500).json({ error: 'Error fetching trends' });

    res.json({
      success: true,
      count: trends.length,
      data: trends
    });
  });
}

module.exports = {
  // Users
  getAllUsers,
  createNewUser,
  getUserProfile,
  updateUserProfile,
  changeUserStatus,
  // Records
  getMyRecords,
  getAllRecordsAdmin,
  createRecord,
  updateRecord,
  deleteRecord,
  // Dashboard
  getDashboardSummary,
  getCategoryBreakdown,
  getRecentActivity,
  getMonthlyTrends
};
