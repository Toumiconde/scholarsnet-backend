const mongoose = require('mongoose');
const crypto = require('crypto');

// Schéma récursif pour les replies imbriquées
const replySchema = new mongoose.Schema({
    texte:         { type: String, required: true },
    auteur_nom:    { type: String, default: 'Visiteur anonyme' },
    auteur_uid:    { type: String, default: null }, // null = visiteur non-connecté
    token:         { type: String, default: () => crypto.randomBytes(24).toString('hex') }, // token secret pour suppression
    date:          { type: Date, default: Date.now },
    replies:       [] // replies imbriquées (Mongoose accepte les tableaux vides récursifs)
});

const commentaireSchema = new mongoose.Schema({
    texte:         { type: String, required: true },
    auteur_nom:    { type: String, default: 'Visiteur anonyme' },
    auteur_uid:    { type: String, default: null },
    token:         { type: String, default: () => crypto.randomBytes(24).toString('hex') },
    date:          { type: Date, default: Date.now },
    replies:       [replySchema]
});

const publicationSchema = new mongoose.Schema({
    pid:    { type: String, unique: true, required: true },
    titre:  { type: String, required: true },
    resume: { type: String, default: '' }, // Abstract/résumé de la publication
    annee:  { type: Number, required: true },
    type:   { type: String, enum: ['article', 'book', 'inproceedings', 'conference', 'thesis', 'phdthesis', 'mastersthesis', 'report', 'techreport', 'incollection'], required: true },
    auteurs: [{
        uid: String,
        nom: String,
        ordre: Number
    }],
    mots_cles: [String],
    langue:    String,
    citations: [String],

    // Champs ARTICLE uniquement
    journal: String, volume: Number, pages: String, doi: String,

    // Champs INPROCEEDINGS / CONFERENCE uniquement
    booktitle: String, ville: String, ville_conf: String, taux_acceptation: Number, acceptation_rate: Number,

    // Champs THESIS uniquement
    directeur: { uid: String, nom: String },
    institution: String, institution_auteur: String,
    mention: String,

    // Champs BOOK / INCOLLECTION uniquement
    editeur: String, publisher: String, isbn: String, nb_pages: Number,

    statut: {
        type: String,
        enum: ['brouillon', 'en_cours', 'soumis', 'revision', 'publie'],
        default: 'brouillon'
    },
    date_soumission:  Date,
    date_publication: Date,
    pdf_path:         String,
    lien_externe:     String,
    date_ajout:       { type: Date, default: Date.now },

    // ── Réactions (style réseau social académique) ──────────────────────────
    reactions: {
        coeur:   { type: Number, default: 0 }, // ❤️ J'aime
        pouce:   { type: Number, default: 0 }, // 👍 Intéressant
        feu:     { type: Number, default: 0 }, // 🔥 Impressionnant
        surpris: { type: Number, default: 0 }, // 😮 Surprenant
        bravo:   { type: Number, default: 0 }  // 👏 Bravo
    },
    partages: { type: Number, default: 0 },

    // ── Commentaires imbriqués avec token de suppression ────────────────────
    commentaires: [commentaireSchema],

    archive: { type: Boolean, default: false }
}, { timestamps: true });

// Index
publicationSchema.index({ titre: 'text', mots_cles: 'text' });
publicationSchema.index({ 'auteurs.uid': 1 });
publicationSchema.index({ 'auteurs.nom': 1 });
publicationSchema.index({ annee: 1 });
publicationSchema.index({ type: 1 });

module.exports = mongoose.model('Publication', publicationSchema);