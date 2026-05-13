const Publication = require('../models/Publication');

// Pipeline 1 — Co-auteurs d'un chercheur ($unwind + $group)
exports.coauteurs = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            { $match: { 'auteurs.uid': req.params.uid } },
            { $unwind: '$auteurs' },
            { $match: { 'auteurs.uid': { $ne: req.params.uid } } },
            {
                $group: {
                    _id: '$auteurs.uid',
                    nom: { $first: '$auteurs.nom' },
                    nb: { $sum: 1 }
                }
            },
            { $sort: { nb: -1 } },
            { $limit: 10 }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 2 — Stats laboratoire par année et type
exports.statsLabo = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            { $unwind: '$auteurs' },
            {
                $lookup: {
                    from: 'chercheurs',
                    localField: 'auteurs.uid',
                    foreignField: 'uid',
                    as: 'chercheur'
                }
            },
            { $unwind: '$chercheur' },
            { $match: { 'chercheur.laboratoire': req.params.nom } },
            {
                $group: {
                    _id: { annee: '$annee', type: '$type' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.annee': -1 } }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 3 — Top auteurs productifs
exports.topAuteurs = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            { $unwind: '$auteurs' },
            {
                $group: {
                    _id: '$auteurs.uid',
                    nom: { $first: '$auteurs.nom' },
                    nb_pubs: { $sum: 1 }
                }
            },
            { $sort: { nb_pubs: -1 } },
            { $limit: 10 }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 4 — Publications citant une publication donnée
exports.citations = async (req, res) => {
    try {
        const result = await Publication.find({ citations: req.params.pid });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 5 — Top mots-clés par laboratoire
exports.keywords = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            { $unwind: '$auteurs' },
            {
                $lookup: {
                    from: 'chercheurs',
                    localField: 'auteurs.uid',
                    foreignField: 'uid',
                    as: 'chercheur'
                }
            },
            { $unwind: '$chercheur' },
            { $match: { 'chercheur.laboratoire': req.params.labo } },
            { $unwind: '$mots_cles' },
            { $group: { _id: '$mots_cles', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};