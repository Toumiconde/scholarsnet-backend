const mongoose = require('mongoose');
const Chercheur = require('./src/models/Chercheur');
const Publication = require('./src/models/Publication');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholarsnet');
        console.log("Connected to DB.");

        const researchers = await Chercheur.find({});
        console.log("Total researchers:", researchers.length);
        if (researchers.length > 0) {
            console.log("Sample lab:", researchers[0].laboratoire);
            const labCounts = await Chercheur.aggregate([{ $group: { _id: "$laboratoire", count: { $sum: 1 } } }]);
            console.log("Lab counts:", labCounts);
        }

        const pubs = await Publication.find({});
        console.log("Total publications:", pubs.length);
        if (pubs.length > 0) {
            const pubStatuses = await Publication.aggregate([{ $group: { _id: "$statut", count: { $sum: 1 } } }]);
            console.log("Pub statuses:", pubStatuses);
            console.log("Sample pub auteurs:", JSON.stringify(pubs[0].auteurs));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
