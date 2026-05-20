const router = require('express').Router();
const ctrl = require('../controllers/publicationController');
const protect = require('../middleware/authMiddleware');
const optionalProtect = require('../middleware/optionalAuthMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ctrl.getAll);
router.get('/:pid', ctrl.getOne);
router.post('/', protect, ctrl.create);
router.put('/:pid', protect, ctrl.update);
router.delete('/:pid', protect, ctrl.remove);
router.post('/import', protect, upload.single('file'), ctrl.importJSON);
router.post('/:pid/pdf', protect, upload.single('file'), ctrl.uploadPDF);

// Option 3 — Chercheur publie lui-même
router.patch('/:pid/publier', protect, ctrl.publier);
router.patch('/:pid/retirer', protect, ctrl.retirer);

// ── Commentaires imbriqués (accessible visiteurs + connectés) ─────────────
router.post('/:pid/commentaires', optionalProtect, ctrl.addComment);
router.post('/:pid/commentaires/:commentId/replies', optionalProtect, ctrl.addReply);
router.delete('/:pid/commentaires/:commentId', optionalProtect, ctrl.deleteComment);

// ── Réactions ❤️👍🔥😮👏 (accessible à tous) ──────────────────────────────
router.post('/:pid/reactions/:type', ctrl.addReaction);

// ── Partage (compteur) ────────────────────────────────────────────────────
router.post('/:pid/partager', ctrl.partager);

module.exports = router;