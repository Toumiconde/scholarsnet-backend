const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getAll);
router.patch('/:id/lire', protect, ctrl.markAsRead);
router.patch('/lire-tout', protect, ctrl.markAllAsRead);

module.exports = router;
