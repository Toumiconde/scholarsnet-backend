require('dotenv').config();
const mongoose = require('mongoose');
const Publication = require('../src/models/Publication');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté pour la migration !');
    
    // Met à jour toutes les publications n'ayant pas le champ 'statut' à 'publie'
    const result = await Publication.updateMany(
      { statut: { $exists: false } },
      { statut: 'publie' }
    );
    
    console.log(`Migration terminée avec succès : ${result.modifiedCount} publications ont été mises à jour avec le statut 'publie'.`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la migration:', err);
    process.exit(1);
  }
};

migrate();
