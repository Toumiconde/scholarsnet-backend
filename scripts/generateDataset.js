const fs = require('fs');
const path = require('path');

const types    = ['article','inproceedings','thesis','book','report'];
const keywords = ['IA','NLP','Big Data','Machine Learning','Vision','Réseau','Sécurité'];
const labos    = ['LARI','LAIG','LABO-INFO'];
const journals = ['Revue Africaine Info','RAIRO','JMLR','IEEE Access'];
const confs    = ['AfricaNLP','CARI','AFCON','ICCV'];

const pubs = [];
for (let i = 1; i <= 1000; i++) {
  const type = types[i % types.length];
  const pub = {
    pid: `PUB${String(i).padStart(4,'0')}`,
    titre: `Publication scientifique numéro ${i} sur ${keywords[i%keywords.length]}`,
    annee: 2015 + (i % 9),
    type,
    auteurs: [{ uid: `CHR${String((i%30)+1).padStart(3,'0')}`, nom: `Auteur ${(i%30)+1}`, ordre: 1 }],
    mots_cles: [keywords[i%keywords.length], keywords[(i+1)%keywords.length]],
    langue: i % 3 === 0 ? 'en' : 'fr',
    citations: i > 5 ? [`PUB${String(i-1).padStart(4,'0')}`] : [],
  };
  // Champs spécifiques
  if (type === 'article') { pub.journal = journals[i%journals.length]; pub.volume = i%20+1; pub.pages = `${i}-${i+10}`; pub.doi = `10.1234/ref.${i}`; }
  if (type === 'inproceedings') { pub.booktitle = confs[i%confs.length]; pub.ville_conf = 'Conakry'; pub.acceptation_rate = 0.25; }
  if (type === 'thesis') { pub.directeur = { uid:'CHR001', nom:'Prof. Directeur' }; pub.institution = 'UGANC'; pub.mention = 'Honorable'; }
  pubs.push(pub);
}

const outputPath = path.join(__dirname, '..', 'dataset_publications.json');
fs.writeFileSync(outputPath, JSON.stringify(pubs, null, 2));
console.log(`${pubs.length} publications générées → dataset_publications.json`);
