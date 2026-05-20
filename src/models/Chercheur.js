const mongoose = require('mongoose');

const chercheurSchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    universite: { type: String, default: 'UGANC' },
    laboratoire: { type: String, required: true },
    grade: { type: String, enum: ['Professeur', 'Maître de conférences', 'Doctorant'] },
    domaines_recherche: [String],
    langues: [String],
    date_recrutement: Date,
    actif: { type: Boolean, default: true },
    role: { type: String, enum: ['chercheur', 'admin'], default: 'chercheur' },
    password: { type: String, required: true },
    photo: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

// Index
chercheurSchema.index({ laboratoire: 1 });
chercheurSchema.index({ domaines_recherche: 1 });

module.exports = mongoose.model('Chercheur', chercheurSchema);