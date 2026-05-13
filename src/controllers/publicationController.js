const Publication = require('../models/Publication');

// Recherche avec filtres + $regex
exports.getAll = async (req, res) => {
    try {
        const { q, auteur, annee, type } = req.query;
        const filter = {};
        if (q) filter.$or = [
            { titre: { $regex: q, $options: 'i' } },
            { mots_cles: { $regex: q, $options: 'i' } }
        ];
        if (auteur) filter['auteurs.nom'] = { $regex: auteur, $options: 'i' };
        if (annee) filter.annee = parseInt(annee);
        if (type) filter.type = type;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const publications = await Publication.find(filter)
            .sort({ annee: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await Publication.countDocuments(filter);
        res.json({ publications, total, page });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Détail d'une publication
exports.getOne = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Non trouvé' });
        res.json(pub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Créer
exports.create = async (req, res) => {
    try {
        const pub = await Publication.create(req.body);
        res.status(201).json(pub);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Modifier
exports.update = async (req, res) => {
    try {
        const pub = await Publication.findOneAndUpdate(
            { pid: req.params.pid }, req.body, { new: true }
        );
        res.json(pub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer
exports.remove = async (req, res) => {
    try {
        await Publication.findOneAndDelete({ pid: req.params.pid });
        res.json({ message: 'Publication supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Import en masse JSON/DBLP
exports.importJSON = async (req, res) => {
    try {
        const data = JSON.parse(req.file.buffer.toString());
        const pubs = Array.isArray(data) ? data : data.publications || [];
        const result = await Publication.insertMany(pubs, { ordered: false });
        res.json({ importés: result.length, total: pubs.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};