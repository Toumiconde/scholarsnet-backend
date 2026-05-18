require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Publication = require('../src/models/Publication');

const loadData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté !');
    
    const dataPath = path.join(__dirname, '..', 'dataset_publications.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Pour éviter les doublons (facultatif si la base est vide)
    await Publication.deleteMany({});
    
    const result = await Publication.insertMany(data, { ordered: false });
    console.log(`${result.length} publications insérées avec succès en BDD.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err);
    process.exit(1);
  }
};

loadData();
