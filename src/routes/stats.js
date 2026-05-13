const router = require('express').Router();
const ctrl = require('../controllers/statsController');

router.get('/coauteurs/:uid', ctrl.coauteurs);
router.get('/labo/:nom', ctrl.statsLabo);
router.get('/top-auteurs', ctrl.topAuteurs);
router.get('/citations/:pid', ctrl.citations);
router.get('/keywords/:labo', ctrl.keywords);

module.exports = router;