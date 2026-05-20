const Publication = require('../models/Publication');
const Notification = require('../models/Notification');
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
        return null; // Properly treat verification errors as visitors (non-logged-in)
    }
};

async function triggerVisitorNotification(pub, type, emetteur, detailsText) {
    try {
        const uids = (pub.auteurs || []).map(a => a.uid).filter(Boolean);
        const notificationsToCreate = [];
        
        // Notification pour chaque chercheur concerné (co-auteur)
        for (const uid of uids) {
            notificationsToCreate.push({
                destinataire: uid,
                emetteur,
                type,
                publicationPid: pub.pid,
                publicationTitre: pub.titre,
                texte: detailsText
            });
        }
        
        // Notification pour l'admin
        notificationsToCreate.push({
            destinataire: 'admin',
            emetteur,
            type,
            publicationPid: pub.pid,
            publicationTitre: pub.titre,
            texte: `[Admin] ${detailsText}`
        });
        
        if (notificationsToCreate.length > 0) {
            await Notification.insertMany(notificationsToCreate);
        }
    } catch (err) {
        console.error("Erreur triggerVisitorNotification:", err);
    }
}

// Recherche avec filtres + $regex (exclut les archives par défaut, respecte le cycle de vie)
exports.getAll = async (req, res) => {
    try {
        const { q, auteur, annee, type, archive } = req.query;
        const filter = {};
        
        if (archive === 'true') {
            filter.archive = true;
        } else {
            filter.archive = { $ne: true };
        }

        if (q) filter.$or = [
            { titre: { $regex: q, $options: 'i' } },
            { mots_cles: { $regex: q, $options: 'i' } }
        ];
        if (auteur) filter['auteurs.nom'] = { $regex: auteur, $options: 'i' };
        if (annee) filter.annee = parseInt(annee);
        if (type) filter.type = type;

        // --- CYCLE DE VIE - FILTRE DE VISIBILITÉ ---
        const user = getUserFromRequest(req);
        if (!user) {
            // Visiteur : voit uniquement les publications publiées
            filter.statut = 'publie';
        } else if (user.role === 'chercheur') {
            // Chercheur connecté : voit les publications publiées OU celles dont il est auteur/co-auteur
            filter.$and = [
                ...(filter.$and || []),
                {
                    $or: [
                        { statut: 'publie' },
                        { 'auteurs.uid': user.uid }
                    ]
                }
            ];
        }
        // Admin : pas de restriction sur le statut, il voit tout.

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

// Détail d'une publication avec citations (avec vérification de visibilité)
exports.getOne = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid }).lean();
        if (!pub) return res.status(404).json({ message: 'Non trouvé' });
        
        // --- VÉRIFICATION DE VISIBILITÉ ---
        const user = getUserFromRequest(req);
        if (!user) {
            if (pub.statut !== 'publie') {
                return res.status(403).json({ message: "Accès non autorisé : cette publication n'est pas publique." });
            }
        } else if (user.role === 'chercheur') {
            const isAuthor = pub.auteurs?.some(a => a.uid === user.uid);
            if (pub.statut !== 'publie' && !isAuthor) {
                return res.status(403).json({ message: "Accès non autorisé : cette publication est privée ou en révision." });
            }
        }

        // Enrichir les auteurs avec leurs emails depuis la collection Chercheur
        const Chercheur = require('../models/Chercheur');
        const enrichedAuteurs = await Promise.all((pub.auteurs || []).map(async (auteur) => {
            if (auteur.uid) {
                const chercheur = await Chercheur.findOne({ uid: auteur.uid }, 'email').lean();
                return { ...auteur, email: chercheur ? chercheur.email : null };
            }
            return { ...auteur, email: null };
        }));
        pub.auteurs = enrichedAuteurs;

        // Trouver les documents cités par cette publication (résolution des PIDs dans references)
        let referencesDocs = [];
        if (pub.references && pub.references.length > 0) {
            referencesDocs = await Publication.find({ pid: { $in: pub.references } }, 'pid titre annee type').lean();
        }

        // Trouver les documents qui citent cette publication
        let citedBy = await Publication.find({ references: pub.pid }, 'pid titre annee type').lean();

        if (!user) {
            // Chiffre global oui, détail non : on renvoie uniquement la taille de la liste (sans aucune donnée confidentielle)
            citedBy = new Array(citedBy.length).fill({});
            referencesDocs = new Array(referencesDocs.length).fill({});
        }

        res.json({ ...pub, referencesDocs, citedBy });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Créer
exports.create = async (req, res) => {
    try {
        // Tout chercheur connecté ou admin peut créer une publication
        if (req.user.role !== 'admin' && req.user.role !== 'chercheur') {
            return res.status(403).json({ message: "Action non autorisée : vous devez être connecté." });
        }

        // Option 3 : un chercheur ne peut créer qu'en statut 'en_cours' (jamais directement 'publie')
        // Seul un admin peut forcer un statut différent à la création.
        if (req.user.role === 'chercheur') {
            req.body.statut = 'en_cours';
        }

        // Gestion automatique des dates du cycle de vie
        if (req.body.statut === 'soumis') {
            req.body.date_soumission = new Date();
        } else if (req.body.statut === 'publie') {
            req.body.date_publication = new Date();
        }

        const pub = await Publication.create(req.body);
        res.status(201).json(pub);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Modifier (auteur ou admin uniquement, ne peut PAS changer le statut vers 'publie' via cet endpoint)
exports.update = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Non trouvé' });

        // Vérification du droit de modification : auteur ou admin
        if (req.user.role === 'chercheur') {
            const isAuthor = pub.auteurs?.some(a => a.uid === req.user.uid);
            if (!isAuthor) {
                return res.status(403).json({ message: "Action non autorisée : vous n'êtes pas l'auteur de cette publication." });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Action non autorisée" });
        }

        // Option 3 : un chercheur ne peut pas modifier le statut vers 'publie' via cet endpoint
        // La publication passe par PATCH /:pid/publier
        if (req.user.role === 'chercheur' && req.body.statut === 'publie') {
            return res.status(403).json({ message: "Utilisez le bouton 'Publier' pour publier votre travail." });
        }

        // Gestion automatique des dates du cycle de vie lors des transitions
        if (req.body.statut === 'soumis' && pub.statut !== 'soumis') {
            req.body.date_soumission = new Date();
        } else if (req.body.statut === 'publie' && pub.statut !== 'publie') {
            req.body.date_publication = new Date();
        }

        const updatedPub = await Publication.findOneAndUpdate(
            { pid: req.params.pid }, req.body, { new: true }
        );
        res.json(updatedPub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer (qui fait en fait un archivage, ou suppression définitive si déjà archivé)
exports.remove = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Non trouvé' });

        if (req.user.role !== 'admin' && req.user.role !== 'chercheur') {
            return res.status(403).json({ message: "Action non autorisée" });
        }

        // Si la publication est déjà dans la corbeille (archive === true) ou force=true, on la supprime définitivement
        if (pub.archive === true || req.query.force === 'true') {
            await Publication.findOneAndDelete({ pid: req.params.pid });
            return res.json({ message: 'Publication supprimée définitivement' });
        }

        // Sinon, on bascule à archive = true ! (Envoi dans la corbeille)
        await Publication.findOneAndUpdate({ pid: req.params.pid }, { archive: true });
        res.json({ message: 'Publication archivée avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Import en masse JSON/DBLP
exports.importJSON = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Seul un administrateur peut importer des données." });
        }
        const data = JSON.parse(req.file.buffer.toString());
        const pubs = Array.isArray(data) ? data : data.publications || [];
        const enrichedPubs = pubs.map(p => ({
            statut: p.statut || 'publie',
            ...p
        }));
        const result = await Publication.insertMany(enrichedPubs, { ordered: false });
        res.json({ importés: result.length, total: pubs.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const fs = require('fs');
const path = require('path');

// =============================================================
// COMMENTAIRES — Ajouter (visiteur anonyme OU chercheur connecté)
// =============================================================

/**
 * POST /:pid/commentaires
 * Accessible à TOUS (visiteurs inclus)
 * Retourne le token secret pour permettre la suppression ultérieure
 */
exports.addComment = async (req, res) => {
    try {
        const { texte, auteur_nom } = req.body;
        if (!texte) return res.status(400).json({ message: "Le texte du commentaire est requis." });

        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: "Publication non trouvée." });

        // Générer un token secret unique pour ce commentaire
        const crypto = require('crypto');
        const token = crypto.randomBytes(24).toString('hex');

        // Détecter si c'est un chercheur connecté ou un visiteur
        let nomFinal = auteur_nom || 'Visiteur anonyme';
        let uidFinal = null;

        const user = getUserFromRequest(req);
        if (user) {
            uidFinal = user.uid;
            const Chercheur = require('../models/Chercheur');
            const chercheur = await Chercheur.findOne({ uid: user.uid });
            if (chercheur) nomFinal = `${chercheur.prenom} ${chercheur.nom}`;
        }

        const nouveauCommentaire = {
            texte,
            auteur_nom: nomFinal,
            auteur_uid: uidFinal,
            token,
            date: new Date(),
            replies: []
        };

        pub.commentaires = pub.commentaires || [];
        pub.commentaires.push(nouveauCommentaire);
        await pub.save();

        if (!user) {
            const emetteur = nomFinal;
            const detailsText = `Le visiteur "${emetteur}" a commenté votre publication "${pub.titre}".`;
            await triggerVisitorNotification(pub, 'commentaire', emetteur, detailsText);
        }

        // On retourne le token AU VISITEUR pour qu'il puisse supprimer son commentaire
        const saved = pub.commentaires[pub.commentaires.length - 1];
        res.status(201).json({ commentaires: pub.commentaires, token, commentId: saved._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /:pid/commentaires/:commentId/replies
 * Ajouter une réponse imbriquée à un commentaire (visiteur ou connecté)
 */
exports.addReply = async (req, res) => {
    try {
        const { texte, auteur_nom } = req.body;
        if (!texte) return res.status(400).json({ message: "Le texte de la réponse est requis." });

        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: "Publication non trouvée." });

        const comment = pub.commentaires.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Commentaire non trouvé." });

        const crypto = require('crypto');
        const token = crypto.randomBytes(24).toString('hex');

        let nomFinal = auteur_nom || 'Visiteur anonyme';
        let uidFinal = null;
        const user = getUserFromRequest(req);
        if (user) {
            uidFinal = user.uid;
            const Chercheur = require('../models/Chercheur');
            const chercheur = await Chercheur.findOne({ uid: user.uid });
            if (chercheur) nomFinal = `${chercheur.prenom} ${chercheur.nom}`;
        }

        comment.replies.push({ texte, auteur_nom: nomFinal, auteur_uid: uidFinal, token, date: new Date(), replies: [] });
        await pub.save();

        if (!user) {
            const emetteur = nomFinal;
            const detailsText = `Le visiteur "${emetteur}" a répondu à un commentaire sur votre publication "${pub.titre}".`;
            await triggerVisitorNotification(pub, 'commentaire', emetteur, detailsText);
        }

        const savedReply = comment.replies[comment.replies.length - 1];
        res.status(201).json({ commentaires: pub.commentaires, token, replyId: savedReply._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /:pid/commentaires/:commentId
 * Supprimer son propre commentaire via token secret (header X-Comment-Token)
 * Un admin peut supprimer n'importe quel commentaire sans token
 */
exports.deleteComment = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: "Publication non trouvée." });

        const comment = pub.commentaires.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Commentaire non trouvé." });

        const user = getUserFromRequest(req);
        const providedToken = req.headers['x-comment-token'];

        const isAdmin = user?.role === 'admin';
        const isOwnerByToken = providedToken && comment.token === providedToken;
        const isOwnerByUid = user && comment.auteur_uid && comment.auteur_uid === user.uid;

        if (!isAdmin && !isOwnerByToken && !isOwnerByUid) {
            return res.status(403).json({ message: "Action non autorisée : vous ne pouvez supprimer que vos propres commentaires." });
        }

        comment.deleteOne();
        await pub.save();
        res.json({ message: 'Commentaire supprimé.', commentaires: pub.commentaires });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Téléverser un PDF
exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Aucun fichier fourni." });

        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: "Publication non trouvée." });

        // S'assurer que le dossier uploads existe
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Écrire le fichier PDF
        const filename = `${req.params.pid}.pdf`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);

        // Mettre à jour le chemin du PDF
        const pdfUrl = `/uploads/${filename}`;
        pub.pdf_path = pdfUrl;
        await pub.save();

        res.json({ pdf_path: pdfUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================
// OPTION 3 — Chercheur publie lui-même
// =============================================================

/**
 * PATCH /:pid/publier
 * L'auteur clique "Publier" → statut passe à 'publie'
 * Règles :
 *   - Seul l'auteur (uid présent dans pub.auteurs) OU un admin peut publier
 *   - La publication doit être en statut 'en_cours' ou 'revision'
 */
exports.publier = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Publication non trouvée.' });

        // Vérification propriété : auteur ou admin
        if (req.user.role === 'chercheur') {
            const isAuthor = pub.auteurs?.some(a => a.uid === req.user.uid);
            if (!isAuthor) {
                return res.status(403).json({ message: "Action non autorisée : vous n'êtes pas l'auteur de cette publication." });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        // Vérification statut : on peut publier uniquement depuis 'en_cours' ou 'revision'
        const statutsAutorisés = ['en_cours', 'revision', 'brouillon'];
        if (!statutsAutorisés.includes(pub.statut)) {
            return res.status(400).json({
                message: `Impossible de publier une publication au statut '${pub.statut}'.`
            });
        }

        const updatedPub = await Publication.findOneAndUpdate(
            { pid: req.params.pid },
            { statut: 'publie', date_publication: new Date() },
            { new: true }
        );

        res.json({ message: 'Publication publiée avec succès.', publication: updatedPub });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /:pid/retirer
 * L'auteur retire sa publication (revient à 'en_cours' pour corrections)
 * Règles :
 *   - Seul l'auteur OU un admin peut retirer
 *   - La publication doit être au statut 'publie'
 */
exports.retirer = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Publication non trouvée.' });

        // Vérification propriété
        if (req.user.role === 'chercheur') {
            const isAuthor = pub.auteurs?.some(a => a.uid === req.user.uid);
            if (!isAuthor) {
                return res.status(403).json({ message: "Action non autorisée : vous n'êtes pas l'auteur de cette publication." });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        if (pub.statut !== 'publie') {
            return res.status(400).json({
                message: `Impossible de retirer une publication au statut '${pub.statut}'. Seules les publications publiées peuvent être retirées.`
            });
        }

        const updatedPub = await Publication.findOneAndUpdate(
            { pid: req.params.pid },
            { statut: 'en_cours', $unset: { date_publication: '' } },
            { new: true }
        );

        res.json({ message: 'Publication retirée. Elle est de nouveau en cours de rédaction.', publication: updatedPub });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================
// RÉACTIONS — Style réseau social académique
// =============================================================

const REACTION_TYPES = ['coeur', 'pouce', 'feu', 'surpris', 'bravo'];

/**
 * POST /:pid/reactions/:type
 * Incrémente la réaction donnée — accessible à TOUS (visiteurs inclus)
 * type: coeur | pouce | feu | surpris | bravo
 */
exports.addReaction = async (req, res) => {
    try {
        const { type } = req.params;
        if (!REACTION_TYPES.includes(type)) {
            return res.status(400).json({ message: `Type de réaction invalide. Valeurs acceptées : ${REACTION_TYPES.join(', ')}` });
        }

        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Publication non trouvée.' });
        if (pub.statut && pub.statut !== 'publie') return res.status(403).json({ message: 'Impossible de réagir à une publication non publiée.' });

        const { previousType } = req.body;

        // 1. Initialiser l'objet reactions si absent du document
        if (!pub.reactions) {
            pub.reactions = { coeur: 0, pouce: 0, feu: 0, surpris: 0, bravo: 0 };
        }
        for (const rType of REACTION_TYPES) {
            if (typeof pub.reactions[rType] !== 'number') {
                pub.reactions[rType] = 0;
            }
        }

        // 2. Traiter le changement de réaction de manière 100% robuste
        if (previousType === type) {
            const currentVal = pub.reactions[type] || 0;
            pub.reactions[type] = Math.max(0, currentVal - 1);
        } else {
            // Incrémenter le nouveau
            const currentNewVal = pub.reactions[type] || 0;
            pub.reactions[type] = currentNewVal + 1;

            // Décrémenter l'ancien s'il existe et est valide
            if (previousType && REACTION_TYPES.includes(previousType)) {
                const currentPrevVal = pub.reactions[previousType] || 0;
                pub.reactions[previousType] = Math.max(0, currentPrevVal - 1);
            }
        }

        // 3. Forcer le marquage de modification de l'objet reactions et sauvegarder
        pub.markModified('reactions');
        await pub.save();

        const user = getUserFromRequest(req);
        if (!user) {
            const emetteur = 'Visiteur anonyme';
            const detailsText = `Un visiteur a réagi avec "${type}" à votre publication "${pub.titre}".`;
            await triggerVisitorNotification(pub, 'reaction', emetteur, detailsText);
        }

        res.json({ reactions: pub.reactions });
    } catch (err) {
        console.error("Erreur addReaction:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /:pid/partager
 * Incrémente le compteur de partages — accessible à TOUS
 */
exports.partager = async (req, res) => {
    try {
        const pub = await Publication.findOne({ pid: req.params.pid });
        if (!pub) return res.status(404).json({ message: 'Publication non trouvée.' });

        const updated = await Publication.findOneAndUpdate(
            { pid: req.params.pid },
            { $inc: { partages: 1 } },
            { new: true }
        );

        const user = getUserFromRequest(req);
        if (!user) {
            const emetteur = 'Visiteur anonyme';
            const detailsText = `Un visiteur a partagé le lien de votre publication "${pub.titre}".`;
            await triggerVisitorNotification(updated, 'partage', emetteur, detailsText);
        }

        res.json({ partages: updated.partages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};