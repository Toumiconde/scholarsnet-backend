require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Chercheur = require('../src/models/Chercheur');

async function getAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarsnet');
  
  const admins = await Chercheur.find({ role: 'admin' });
  if (admins.length > 0) {
    console.log("Admins trouvés:", admins.map(a => ({ email: a.email, uid: a.uid })));
    
    // On va forcer le mot de passe de l'un d'eux à "admin123" pour le donner au USER
    const admin = admins[0];
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash('admin123', salt);
    // Fix grade just in case
    if (!['Professeur', 'Maître de conférences', 'Doctorant'].includes(admin.grade)) {
       admin.grade = 'Professeur';
    }
    await admin.save();
    console.log(`Mot de passe de ${admin.email} mis à jour : admin123`);
  } else {
    console.log("Aucun admin trouvé, création d'un admin par défaut...");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await Chercheur.create({
      uid: 'ADMIN01',
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@scholarsnet.edu',
      laboratoire: 'SYSTEM',
      grade: 'Professeur',
      role: 'admin',
      password: hash
    });
    console.log("Admin créé : admin@scholarsnet.edu / admin123");
  }
  
  mongoose.disconnect();
}

getAdmin();
