const db = require('./database');

// Get user from request (using userId parameter or header)
function getCurrentUser(req, res, next) {
  const userId = req.params.userId || req.query.userId || req.headers['x-user-id'];
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'User ID is required (use ?userId=X or header x-user-id)' });
  }

  db.getUser(userId, (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ error: 'User is inactive' });

    req.user = user;
    next();
  });
}

// Check if user has specific role
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
}

// Check if user owns the record or is admin
function checkRecordOwnership(req, res, next) {
  const recordId = req.params.recordId;

  if (!recordId || isNaN(recordId)) {
    return res.status(400).json({ error: 'Invalid record ID' });
  }

  db.getRecord(recordId, (err, record) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Admin can access any record, others can only access their own
    if (req.user.role !== 'admin' && record.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only access your own records' });
    }

    req.record = record;
    next();
  });
}

// Check if user is target user or admin
function checkUserAccess(req, res, next) {
  const targetUserId = parseInt(req.params.targetUserId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Admin can access any user, others can only access their own
  if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
    return res.status(403).json({ error: 'You can only access your own profile' });
  }

  next();
}

module.exports = {
  getCurrentUser,
  checkRole,
  checkRecordOwnership,
  checkUserAccess
};
