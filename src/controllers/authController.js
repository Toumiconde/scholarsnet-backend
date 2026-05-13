const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chercheur = require('../models/Chercheur');

// Inscription
exports.register = async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const chercheur = await Chercheur.create({ ...req.body, password: hash });
        res.status(201).json({ message: 'Compte créé', uid: chercheur.uid });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const chercheur = await Chercheur.findOne({ email: req.body.email });
        if (!chercheur) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        const valid = await bcrypt.compare(req.body.password, chercheur.password);
        if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
        const token = jwt.sign(
            { uid: chercheur.uid, role: chercheur.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.json({ token, chercheur: { uid: chercheur.uid, nom: chercheur.nom, email: chercheur.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Profil connecté
exports.me = async (req, res) => {
    try {
        const chercheur = await Chercheur.findOne({ uid: req.user.uid }).select('-password');
        res.json(chercheur);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};