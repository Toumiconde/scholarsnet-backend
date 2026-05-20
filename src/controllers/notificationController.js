const Notification = require('../models/Notification');

// Récupérer toutes les notifications de l'utilisateur connecté
exports.getAll = async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'admin') {
            query.destinataire = 'admin';
        } else if (req.user.role === 'chercheur') {
            query.destinataire = req.user.uid;
        } else {
            return res.status(403).json({ message: 'Action non autorisée.' });
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification non trouvée.' });

        // Vérifier les droits
        if (req.user.role === 'admin' && notification.destinataire !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé.' });
        }
        if (req.user.role === 'chercheur' && notification.destinataire !== req.user.uid) {
            return res.status(403).json({ message: 'Non autorisé.' });
        }

        notification.lu = true;
        await notification.save();

        res.json({ message: 'Notification marquée comme lue.', notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
    try {
        let destinataire = '';
        if (req.user.role === 'admin') {
            destinataire = 'admin';
        } else if (req.user.role === 'chercheur') {
            destinataire = req.user.uid;
        } else {
            return res.status(403).json({ message: 'Non autorisé.' });
        }

        await Notification.updateMany({ destinataire, lu: false }, { lu: true });
        res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
