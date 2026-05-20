const router = require('express').Router();
const ctrl = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', protect, ctrl.me);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);
router.post('/admin-reset-password', protect, ctrl.adminResetPassword);

module.exports = router;