const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    destinataire: { type: String, required: true }, // UID du chercheur ou "admin"
    emetteur: { type: String }, // Nom/UID de celui qui a déclenché l'action
    type: { type: String, required: true }, // ex: 'nouveau_chercheur', 'nouvel_auteur', 'reaction', 'commentaire', 'statut_publication'
    publicationPid: { type: String }, // Optionnel
    publicationTitre: { type: String }, // Optionnel
    texte: { type: String, required: true },
    lue: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
