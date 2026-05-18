require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;

  // Index publications
  await db.collection('publications').createIndex({ 'auteurs.uid': 1 });
  await db.collection('publications').createIndex({ 'auteurs.nom': 1 });
  await db.collection('publications').createIndex({ annee: 1 });
  await db.collection('publications').createIndex({ type: 1 });
  await db.collection('publications').createIndex({ annee: -1, type: 1 });
  await db.collection('publications').createIndex({ titre: 'text', mots_cles: 'text' });

  // Index chercheurs
  await db.collection('chercheurs').createIndex({ uid: 1 }, { unique: true });
  await db.collection('chercheurs').createIndex({ laboratoire: 1 });

  console.log('Tous les index créés !');
  process.exit(0);
}).catch(err => {
  console.error('Erreur lors de la création des index:', err);
  process.exit(1);
});
