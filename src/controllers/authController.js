const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chercheur = require('../models/Chercheur');
const Notification = require('../models/Notification');

// Inscription
exports.register = async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const chercheur = await Chercheur.create({ ...req.body, password: hash });
        
        const typeCompte = chercheur.role === 'admin' ? 'Administrateur' : 'Chercheur';
        await Notification.create({
            destinataire: 'admin',
            emetteur: chercheur.nom,
            type: chercheur.role === 'admin' ? 'mise_a_jour' : 'nouveau_chercheur',
            texte: `Nouveau compte ${typeCompte} créé : ${chercheur.prenom} ${chercheur.nom}`
        });

        res.status(201).json({ message: 'Compte créé', uid: chercheur.uid });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            const message = field === 'email' ? 'Cet email est déjà utilisé par un autre compte.' : 'Cet identifiant (UID) est déjà utilisé.';
            return res.status(400).json({ error: message });
        }
        res.status(400).json({ error: err.message });
    }
};

// Vérification du rôle par email (pour l'UX frontend)
exports.checkRole = async (req, res) => {
    try {
        console.log("Backend hit: /auth/check-role with email:", req.body.email);
        const chercheur = await Chercheur.findOne({ email: req.body.email });
        if (!chercheur) {
            console.log("-> Role: inconnu");
            return res.json({ role: 'inconnu' });
        }
        console.log("-> Role:", chercheur.role);
        res.json({ role: chercheur.role });
    } catch (err) {
        console.log("-> Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const chercheur = await Chercheur.findOne({ email: req.body.email });
        if (!chercheur) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        
        // Sécurité : Interdire l'accès si le compte est suspendu
        if (chercheur.actif === false) {
            return res.status(403).json({ message: 'Votre compte a été suspendu par un administrateur. Veuillez contacter le support.' });
        }

        const valid = await bcrypt.compare(req.body.password, chercheur.password);
        if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
        const token = jwt.sign(
            { uid: chercheur.uid, role: chercheur.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Notification de connexion
        await Notification.create({
            destinataire: 'admin',
            emetteur: chercheur.nom,
            type: 'connexion',
            texte: `Le chercheur ${chercheur.prenom} ${chercheur.nom} vient de se connecter.`
        });

        res.json({ token, chercheur: { uid: chercheur.uid, nom: chercheur.nom, email: chercheur.email, role: chercheur.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Déconnexion
exports.logout = async (req, res) => {
    try {
        const chercheur = await Chercheur.findOne({ uid: req.user.uid });
        if (chercheur) {
            await Notification.create({
                destinataire: 'admin',
                emetteur: chercheur.nom,
                type: 'deconnexion',
                texte: `Le chercheur ${chercheur.prenom} ${chercheur.nom} s'est déconnecté.`
            });
        }
        res.json({ message: 'Déconnexion enregistrée.' });
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

// Demande de réinitialisation de mot de passe (Mot de passe oublié)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "L'adresse email est requise." });

        const chercheur = await Chercheur.findOne({ email });
        if (!chercheur) return res.status(404).json({ message: "Aucun chercheur trouvé avec cet email." });

        // Sécurité : Interdire la réinitialisation si le compte est suspendu
        if (chercheur.actif === false) {
            return res.status(403).json({ message: "Action impossible : Votre compte a été suspendu par un administrateur." });
        }

        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Utiliser updateOne pour éviter les erreurs de validation Mongoose sur le mot de passe manquant
        await Chercheur.updateOne(
            { _id: chercheur._id },
            {
                $set: {
                    resetPasswordToken: token,
                    resetPasswordExpires: Date.now() + 3600000 // Valide 1 heure
                }
            }
        );

        // En local, on retourne le lien pour pouvoir le copier/tester facilement
        const resetLink = `http://localhost:5173/reset-password/${token}`;
        res.json({
            message: "Lien de réinitialisation généré avec succès.",
            token,
            resetLink
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Réinitialisation effective du mot de passe via Token
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: "Le nouveau mot de passe est requis." });

        const chercheur = await Chercheur.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!chercheur) {
            return res.status(400).json({ message: "Le lien de réinitialisation est invalide ou a expiré." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Utiliser updateOne pour la réinitialisation
        await Chercheur.updateOne(
            { _id: chercheur._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
            }
        );

        res.json({ message: "Votre mot de passe a été modifié avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Réinitialisation par l'Administrateur
exports.adminResetPassword = async (req, res) => {
    try {
        // Sécurité : Vérifier le rôle admin (protection préalable par protect middleware)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Réservé à l'administrateur." });
        }

        const { uid, password } = req.body;
        if (!uid || !password) {
            return res.status(400).json({ message: "L'UID du chercheur et le nouveau mot de passe sont requis." });
        }

        const chercheur = await Chercheur.findOne({ uid });
        if (!chercheur) return res.status(404).json({ message: "Chercheur non trouvé." });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Utiliser updateOne pour contourner la validation du mot de passe manquant
        await Chercheur.updateOne(
            { _id: chercheur._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
            }
        );

        res.json({ message: `Le mot de passe du chercheur ${chercheur.prenom} ${chercheur.nom} (${uid}) a été réinitialisé.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};