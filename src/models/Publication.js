const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    pid: { type: String, unique: true, required: true },
    titre: { type: String, required: true },
    annee: { type: Number, required: true },
    type: { type: String, enum: ['article', 'book', 'inproceedings', 'thesis', 'report'], required: true },
    auteurs: [{
        uid: String,
        nom: String,
        ordre: Number
    }],
    mots_cles: [String],
    langue: String,
    citations: [String],

    // Champs ARTICLE uniquement
    journal: String, volume: Number, pages: String, doi: String,

    // Champs INPROCEEDINGS uniquement
    booktitle: String, ville_conf: String, acceptation_rate: Number,

    // Champs THESIS uniquement
    directeur: { uid: String, nom: String },
    institution: String,
    mention: String,

    // Champs BOOK uniquement
    editeur: String, isbn: String, nb_pages: Number,

}, { timestamps: true });

// Index
publicationSchema.index({ titre: 'text', mots_cles: 'text' });
publicationSchema.index({ 'auteurs.uid': 1 });
publicationSchema.index({ 'auteurs.nom': 1 });
publicationSchema.index({ annee: 1 });
publicationSchema.index({ type: 1 });

module.exports = mongoose.model('Publication', publicationSchema);