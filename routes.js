const express = require('express');
const router = express.Router();
const middleware = require('./middleware');
const controller = require('./controllers');

router.get('/users', middleware.getCurrentUser, middleware.checkRole('admin'), controller.getAllUsers);
router.post('/users', middleware.getCurrentUser, middleware.checkRole('admin'), controller.createNewUser);

router.get('/profile', middleware.getCurrentUser, controller.getUserProfile);
router.put('/profile', middleware.getCurrentUser, controller.updateUserProfile);
router.patch('/users/:targetUserId/status', middleware.getCurrentUser, middleware.checkRole('admin'), controller.changeUserStatus);

router.get('/records', middleware.getCurrentUser, middleware.checkRole('viewer', 'analyst', 'admin'), controller.getMyRecords);
router.get('/admin/records', middleware.getCurrentUser, middleware.checkRole('admin'), controller.getAllRecordsAdmin);
router.post('/records', middleware.getCurrentUser, middleware.checkRole('analyst', 'admin'), controller.createRecord);
router.put('/records/:recordId', middleware.getCurrentUser, middleware.checkRole('analyst', 'admin'), middleware.checkRecordOwnership, controller.updateRecord);
router.delete('/records/:recordId', middleware.getCurrentUser, middleware.checkRole('analyst', 'admin'), middleware.checkRecordOwnership, controller.deleteRecord);

router.get('/dashboard/summary', middleware.getCurrentUser, middleware.checkRole('viewer', 'analyst', 'admin'), controller.getDashboardSummary);
router.get('/dashboard/categories', middleware.getCurrentUser, middleware.checkRole('analyst', 'admin'), controller.getCategoryBreakdown);
router.get('/dashboard/recent', middleware.getCurrentUser, middleware.checkRole('viewer', 'analyst', 'admin'), controller.getRecentActivity);
router.get('/dashboard/trends', middleware.getCurrentUser, middleware.checkRole('analyst', 'admin'), controller.getMonthlyTrends);

router.get('/', (req, res) => {
  res.json({
    message: 'Finance Dashboard Backend API',
    version: '1.0.0',
    status: 'running',
    note: 'Use ?userId=1 or header x-user-id to authenticate'
  });
});

module.exports = router;
