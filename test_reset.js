const mongoose = require('mongoose');
const Chercheur = require('./src/models/Chercheur');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarsnet');
        console.log('Connected to DB');
        
        const email = 'm.conde@uganc.edu';
        const chercheur = await Chercheur.findOne({ email });
        if (!chercheur) {
            console.log('Chercheur not found!');
            process.exit(1);
        }
        
        console.log('Found chercheur:', chercheur.nom, chercheur.prenom, chercheur.uid);
        
        chercheur.resetPasswordToken = 'test-token-123';
        chercheur.resetPasswordExpires = Date.now() + 3600000;
        
        await chercheur.save();
        console.log('Successfully saved chercheur with reset token!');
        process.exit(0);
    } catch (err) {
        console.error('Error during diagnostic:', err);
        process.exit(1);
    }
}

run();
