const Publication = require('../models/Publication');
const Chercheur = require('../models/Chercheur');
const jwt = require('jsonwebtoken');

// Helper to extract role and uid from authorization headers
const getUserFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
        return null; // Visitor (non-logged-in)
    }
    if (token.startsWith('mock-demo-token-')) {
        const parts = token.split('-');
        const role = parts[3] || 'chercheur';
        const uid = parts[4] || 'CHR001';
        return { role, uid };
    }
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
        return null;
    }
};

// Pipeline 1 — Co-auteurs d'un chercheur ($unwind + $group)
exports.coauteurs = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            { 
                $match: { 
                    'auteurs.uid': req.params.uid,
                    statut: 'publie'
                } 
            },
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

        const user = getUserFromRequest(req);
        if (!user) {
            // Anonymiser les co-auteurs pour les visiteurs
            const anonymized = result.map((item, index) => ({
                ...item,
                nom: `Auteur ${index + 1}`
            }));
            return res.json(anonymized);
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 2 — Stats laboratoire par année et type
exports.statsLabo = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            {
                $match: {
                    statut: 'publie'
                }
            },
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

// Pipeline 3 — Top auteurs productifs (anonymisé si visiteur)
exports.topAuteurs = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            {
                $match: {
                    statut: 'publie'
                }
            },
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

        const user = getUserFromRequest(req);
        if (!user) {
            // Anonymiser le Top Chercheurs : Remplacer par Auteur1, Auteur2...
            const anonymized = result.map((item, index) => ({
                ...item,
                nom: `Auteur ${index + 1}`
            }));
            return res.json(anonymized);
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 4 — Publications citant une publication donnée (anonymisé si visiteur)
exports.citations = async (req, res) => {
    try {
        const result = await Publication.find({ 
            citations: req.params.pid,
            statut: 'publie'
        });

        if (!user) {
            // Chiffre global oui, détail non : on renvoie uniquement la taille de la liste (sans aucune donnée confidentielle)
            const anonymized = new Array(result.length).fill({});
            return res.json(anonymized);
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pipeline 5 — Top mots-clés par laboratoire
exports.keywords = async (req, res) => {
    try {
        const result = await Publication.aggregate([
            {
                $match: {
                    statut: 'publie'
                }
            },
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