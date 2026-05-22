const mongoose = require('mongoose');
const Publication = require('../src/models/Publication');
const Chercheur = require('../src/models/Chercheur');
require('dotenv').config({ path: '../.env' }); // Adjust depending on where script is run

// Liste de mots pour générer des titres réalistes
const motsSujets = ['Analysis', 'Optimization', 'Neural Networks', 'Machine Learning', 'Deep Learning', 'Quantum Computing', 'Data Mining', 'Blockchain', 'Cybersecurity', 'Cloud Computing', 'IoT', 'Artificial Intelligence', 'Natural Language Processing', 'Computer Vision', 'Robotics', 'Software Engineering', 'Big Data', 'Cryptography', 'Bioinformatics', 'Distributed Systems'];
const motsContexts = ['for', 'in', 'applied to', 'towards', 'with', 'using', 'based on', 'via'];
const motsDomaines = ['Healthcare', 'Finance', 'Smart Cities', 'Autonomous Vehicles', 'Renewable Energy', 'Social Networks', 'E-commerce', 'Education', 'Supply Chain', 'Telecommunications'];

const generateTitle = () => {
    const sujet = motsSujets[Math.floor(Math.random() * motsSujets.length)];
    const ctx = motsContexts[Math.floor(Math.random() * motsContexts.length)];
    const domaine = motsDomaines[Math.floor(Math.random() * motsDomaines.length)];
    return `${sujet} ${ctx} ${domaine}: A Comprehensive Study`;
};

const publicationTypes = ['article', 'book', 'inproceedings', 'conference', 'thesis'];
const statuts = ['publie', 'soumis', 'revision'];

const seedPublications = async () => {
    try {
        console.log("Connexion à MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scholarsnet');
        console.log("Connecté !");

        // Get some authors to associate
        const chercheurs = await Chercheur.find().limit(10);
        let validAuthors = chercheurs.map(c => ({ uid: c.uid, nom: `${c.prenom} ${c.nom}` }));
        if (validAuthors.length === 0) {
            validAuthors = [{ uid: 'CHR_FAKE', nom: 'Jane Doe' }];
        }

        console.log("Génération de 1050 publications...");
        const publications = [];

        for (let i = 0; i < 1050; i++) {
            // Randomly select 1 to 3 authors
            const numAuteurs = Math.floor(Math.random() * 3) + 1;
            const shuffledAuthors = validAuthors.sort(() => 0.5 - Math.random());
            const selectedAuthors = shuffledAuthors.slice(0, numAuteurs).map((a, idx) => ({
                uid: a.uid,
                nom: a.nom,
                ordre: idx + 1
            }));

            const pubType = publicationTypes[Math.floor(Math.random() * publicationTypes.length)];
            const annee = Math.floor(Math.random() * (2026 - 2000 + 1)) + 2000;
            const citationsCount = Math.floor(Math.random() * 50);
            const citations = Array.from({ length: citationsCount }).map((_, i) => `PUB_${Math.floor(Math.random() * 10000)}`);

            publications.push({
                pid: `PUB_SEED_${Date.now()}_${i}`,
                titre: generateTitle(),
                resume: "This is an automatically generated abstract for testing purposes. It contains placeholders and represents a comprehensive overview of the related work, methodology, and experimental results obtained during the research phase.",
                annee: annee,
                type: pubType,
                auteurs: selectedAuthors,
                mots_cles: [motsSujets[Math.floor(Math.random() * motsSujets.length)]],
                langue: 'en',
                statut: statuts[Math.floor(Math.random() * statuts.length)],
                citations: citations,
                journal: pubType === 'article' ? 'Journal of Computer Science' : undefined,
                booktitle: pubType === 'inproceedings' ? 'Proceedings of the IEEE Conference' : undefined,
                reactions: {
                    coeur: Math.floor(Math.random() * 20),
                    pouce: Math.floor(Math.random() * 30),
                    feu: Math.floor(Math.random() * 10),
                    surpris: Math.floor(Math.random() * 5),
                    bravo: Math.floor(Math.random() * 25)
                },
                partages: Math.floor(Math.random() * 15),
                archive: Math.random() > 0.95 // 5% chance of being archived
            });
        }

        console.log("Insertion en masse dans la base de données...");
        const CHUNK_SIZE = 250;
        for (let i = 0; i < publications.length; i += CHUNK_SIZE) {
            const chunk = publications.slice(i, i + CHUNK_SIZE);
            await Publication.insertMany(chunk);
            console.log(`Inséré ${Math.min(i + CHUNK_SIZE, publications.length)} / ${publications.length}...`);
        }

        console.log("✅ 1050 publications insérées avec succès !");
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur :", err);
        process.exit(1);
    }
};

seedPublications();
