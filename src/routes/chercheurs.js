const router = require('express').Router();

router.get('/', (req, res) => res.json({ message: 'Chercheurs route OK' }));

module.exports = router;