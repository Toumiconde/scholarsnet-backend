const router  = require('express').Router();
const ctrl    = require('../controllers/chercheurController');
const protect = require('../middleware/authMiddleware');

router.get('/',        ctrl.getAll);
router.get('/:uid',    ctrl.getOne);
router.post('/',       protect, ctrl.create);
router.put('/:uid',    protect, ctrl.update);
router.delete('/:uid', protect, ctrl.remove);

module.exports = router;