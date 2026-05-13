const router = require('express').Router();
const ctrl = require('../controllers/projetController');
const protect = require('../middleware/authMiddleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);
router.post('/:id/membres', protect, ctrl.addMember);
router.delete('/:id/membres/:uid', protect, ctrl.removeMember);

module.exports = router;