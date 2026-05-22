const Chercheur = require('../models/Chercheur');
const Publication = require('../models/Publication');
const Projet = require('../models/Projet');

// Liste avec filtres
exports.getAll = async (req, res) => {
    try {
        const { labo, grade, domaine } = req.query;
        const filter = {};
        if (labo) filter.laboratoire = labo;
        if (grade) filter.grade = grade;
        if (domaine) filter.domaines_recherche = domaine;
        const chercheurs = await Chercheur.find(filter).select('-password');
        res.json(chercheurs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const jwt = require('jsonwebtoken');

// Helper to extract role and uid from authorization headers
const getUserFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
        return null;
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
        return null; // Properly treat verification errors as visitors (non-logged-in)
    }
};

// Profil complet + h-index
exports.getOne = async (req, res) => {
    try {
        const chercheur = await Chercheur.findOne({ uid: req.params.uid }).select('-password');
        if (!chercheur) return res.status(404).json({ message: 'Non trouvé' });

        const user = getUserFromRequest(req);
        
        // Match only visible publications for this profile view
        const matchFilter = { 'auteurs.uid': req.params.uid };
        if (!user) {
            matchFilter.statut = 'publie';
        } else if (user.role === 'chercheur') {
            if (user.uid !== req.params.uid) {
                // Si on regarde le profil de quelqu'un d'autre, on ne voit que ses articles publiés
                // OU ceux où le chercheur connecté est également co-auteur
                matchFilter.$or = [
                    { statut: 'publie' },
                    { 'auteurs.uid': user.uid }
                ];
            }
        }
        // Admin : pas de restriction, il voit tout

        const publicationsAgg = await Publication.aggregate([
            { $match: matchFilter },
            { $project: { 
                pid: 1, 
                titre: 1, 
                annee: 1,
                nb_citations: { $size: { $ifNull: ['$citations', []] } } 
            }},
            { $sort: { nb_citations: -1 } }
        ]);

        let hIndex = 0;
        for (let i = 0; i < publicationsAgg.length; i++) {
            if (publicationsAgg[i].nb_citations >= i + 1) hIndex = i + 1; else break;
        }

        const publications = await Publication.find(matchFilter).sort({ annee: -1 });

        // Récupérer les projets
        const projets = await Projet.find({
            $or: [{ responsable_uid: req.params.uid }, { membres: req.params.uid }]
        });

        // Stats d'évolution (publications par année)
        const evolution = publications.reduce((acc, p) => {
            acc[p.annee] = (acc[p.annee] || 0) + 1;
            return acc;
        }, {});
        const statsEvolution = Object.keys(evolution).map(year => ({
            annee: parseInt(year),
            count: evolution[year]
        })).sort((a, b) => a.annee - b.annee);

        res.json({ chercheur, publications, hIndex, projets, statsEvolution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Créer
exports.create = async (req, res) => {
    try {
        const c = await Chercheur.create(req.body);
        res.status(201).json(c);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Modifier
exports.update = async (req, res) => {
    try {
        // Sécurité : Seul le propriétaire ou un admin peut modifier
        if (req.user.uid !== req.params.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Action non autorisée" });
        }
        const c = await Chercheur.findOneAndUpdate(
            { uid: req.params.uid }, req.body, { new: true }
        ).select('-password');
        res.json(c);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Désactiver / Supprimer
exports.remove = async (req, res) => {
    try {
        // Sécurité : Seul l'admin ou le propriétaire peut désactiver/supprimer
        if (req.user.uid !== req.params.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Action non autorisée" });
        }
        await Chercheur.findOneAndDelete({ uid: req.params.uid });
        res.json({ message: 'Compte définitivement supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};