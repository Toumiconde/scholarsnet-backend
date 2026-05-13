const router = require('express').Router();
const ctrl = require('../controllers/publicationController');
const protect = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ctrl.getAll);
router.get('/:pid', ctrl.getOne);
router.post('/', protect, ctrl.create);
router.put('/:pid', protect, ctrl.update);
router.delete('/:pid', protect, ctrl.remove);
router.post('/import', protect, upload.single('file'), ctrl.importJSON);

module.exports = router;