const Projet = require('../models/Projet');

// Liste tous les projets (supporte ?statut=en_cours|planifie|termine|suspendu)
exports.getAll = async (req, res) => {
    try {
        const filter = {};
        if (req.query.statut) filter.statut = req.query.statut;
        const projets = await Projet.find(filter).sort({ createdAt: -1 });
        res.json(projets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Détail d'un projet
exports.getOne = async (req, res) => {
    try {
        const projet = await Projet.findById(req.params.id);
        if (!projet) return res.status(404).json({ message: 'Non trouvé' });
        res.json(projet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Créer
exports.create = async (req, res) => {
    try {
        const p = await Projet.create(req.body);
        res.status(201).json(p);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Modifier
exports.update = async (req, res) => {
    try {
        const projet = await Projet.findById(req.params.id);
        if (!projet) return res.status(404).json({ message: 'Non trouvé' });

        // Seul le responsable ou l'admin peut modifier
        if (projet.responsable_uid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        const p = await Projet.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        res.json(p);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer
exports.remove = async (req, res) => {
    try {
        const projet = await Projet.findById(req.params.id);
        if (!projet) return res.status(404).json({ message: 'Non trouvé' });

        // Seul le responsable ou l'admin peut supprimer
        if (projet.responsable_uid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        await Projet.findByIdAndDelete(req.params.id);
        res.json({ message: 'Projet supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Ajouter un membre
exports.addMember = async (req, res) => {
    try {
        const p = await Projet.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { membres: req.body.uid } },
            { new: true }
        );
        res.json(p);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Retirer un membre
exports.removeMember = async (req, res) => {
    try {
        const p = await Projet.findByIdAndUpdate(
            req.params.id,
            { $pull: { membres: req.params.uid } },
            { new: true }
        );
        res.json(p);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};