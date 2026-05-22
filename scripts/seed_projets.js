const mongoose = require('mongoose');
const Projet = require('../src/models/Projet');
const Chercheur = require('../src/models/Chercheur');
const Publication = require('../src/models/Publication');
require('dotenv').config({ path: '../.env' }); // Adjust depending on where script is run

const sujetsProjets = [
    'Réseaux de Capteurs Sans Fil', 'Intelligence Artificielle en Santé', 'Systèmes Distribués Robustes', 
    'Blockchain pour la Logistique', 'Villes Intelligentes et IoT', 'Cybersécurité Avancée', 
    'Vision par Ordinateur pour la Robotique', 'Traitement Automatique des Langues Naturelles', 
    'Optimisation des Énergies Renouvelables', 'Analyse de Données Massives (Big Data)',
    'Réseaux 5G et Au-delà', 'Informatique Quantique Appliquée', 'Apprentissage Fédéré (Federated Learning)',
    'Bio-informatique et Génomique', 'Systèmes Embarqués Temps Réel', 'Protection de la Vie Privée (Privacy-Preserving)',
    'Jumeaux Numériques (Digital Twins)', 'Agriculture de Précision avec IA', 'Véhicules Autonomes et Sécurité',
    'Réalité Augmentée et Virtuelle', 'Interaction Humain-Machine', 'Systèmes de Recommandation Avancés'
];

const financeurs = ['MESRS', 'Agence Nationale de Recherche', 'Fonds Européen', 'Fondation Gates', 'Université de Conakry', 'Banque Mondiale', 'OIF', 'Industrie Privée', 'UNESCO'];
const statuts = ['planifie', 'en_cours', 'termine', 'suspendu'];

const seedProjets = async () => {
    try {
        console.log("Connexion à MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scholarsnet');
        console.log("Connecté !");

        // Get some researchers
        const chercheurs = await Chercheur.find().limit(20);
        const chercheurUids = chercheurs.map(c => c.uid);
        if (chercheurUids.length === 0) {
            chercheurUids.push('CHR_FAKE');
        }

        // Get some publications for associations
        const publications = await Publication.find().limit(100);
        const pubIds = publications.map(p => p.pid);

        console.log("Génération de 25 projets...");
        const projets = [];

        for (let i = 0; i < 25; i++) {
            const numMembres = Math.floor(Math.random() * 5) + 1;
            const shuffledUids = chercheurUids.sort(() => 0.5 - Math.random());
            const responsable = shuffledUids[0];
            const membres = shuffledUids.slice(1, numMembres + 1);

            const numPubs = Math.floor(Math.random() * 4);
            const shuffledPubs = pubIds.sort(() => 0.5 - Math.random());
            const associees = shuffledPubs.slice(0, numPubs);

            const dateDebut = new Date();
            dateDebut.setFullYear(2023 + Math.floor(Math.random() * 3));
            dateDebut.setMonth(Math.floor(Math.random() * 12));

            const dateFin = new Date(dateDebut);
            dateFin.setFullYear(dateDebut.getFullYear() + Math.floor(Math.random() * 3) + 1);

            projets.push({
                nom: `Projet de Recherche sur : ${sujetsProjets[i % sujetsProjets.length]}`,
                description: `Ce projet interdisciplinaire vise à explorer les défis fondamentaux liés à ${sujetsProjets[i % sujetsProjets.length]}. L'équipe de chercheurs impliqués utilisera des méthodes innovantes pour proposer des solutions à l'état de l'art.`,
                date_debut: dateDebut,
                date_fin: dateFin,
                statut: statuts[Math.floor(Math.random() * statuts.length)],
                responsable_uid: responsable,
                membres: membres,
                financeur: financeurs[Math.floor(Math.random() * financeurs.length)],
                budget: Math.floor(Math.random() * 90000) + 10000,
                publications_associees: associees
            });
        }

        console.log("Insertion des projets...");
        await Projet.insertMany(projets);
        console.log(`✅ ${projets.length} projets insérés avec succès !`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur :", err);
        process.exit(1);
    }
};

seedProjets();
