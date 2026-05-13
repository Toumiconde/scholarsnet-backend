const mongoose = require('mongoose');

const projetSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: String,
    date_debut: Date,
    date_fin: Date,
    statut: { type: String, enum: ['planifie', 'en_cours', 'termine', 'suspendu'] },
    responsable_uid: { type: String, ref: 'Chercheur' },
    membres: [String],
    financeur: String,
    budget: Number,
    publications_associees: [String],
}, { timestamps: true });

module.exports = mongoose.model('Projet', projetSchema);