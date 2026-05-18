const baseUrl = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- DEBUT DES TESTS DU BACKEND ---');

  // 1. Inscription d'un chercheur (POST /api/auth/register)
  console.log('\n[Test 2] POST /api/auth/register...');
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: "CHR001",
      nom: "Condé",
      prenom: "Toumany",
      email: "toumany@example.com",
      laboratoire: "LARI",
      grade: "Doctorant",
      password: "password123"
    })
  });
  const registerData = await registerRes.json();
  console.log('Résultat Inscription:', registerData);

  // 2. Connexion (POST /api/auth/login)
  console.log('\n[Test 3] POST /api/auth/login...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "toumany@example.com",
      password: "password123"
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Résultat Connexion: Token reçu ?', !!token);

  // 3. Récupérer le chercheur et son h-index (GET /api/chercheurs/:uid)
  console.log('\n[Test 4] GET /api/chercheurs/CHR001...');
  const chercheurRes = await fetch(`${baseUrl}/chercheurs/CHR001`);
  const chercheurData = await chercheurRes.json();
  console.log('Résultat Chercheur:', chercheurData.chercheur ? `Trouvé: ${chercheurData.chercheur.nom}` : 'Non trouvé', 'h-index:', chercheurData.hIndex);

  // 4. Créer un projet puis lister les projets (GET /api/projets)
  console.log('\n[Test 5] GET /api/projets...');
  // Créons d'abord un projet pour que la liste ne soit pas vide
  await fetch(`${baseUrl}/projets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      nom: "Projet Alpha IA",
      statut: "en_cours",
      responsable_uid: "CHR001"
    })
  });
  const projetsRes = await fetch(`${baseUrl}/projets`);
  const projetsData = await projetsRes.json();
  console.log(`Résultat Projets: ${projetsData.length} projet(s) trouvé(s)`);

  // 5. Recherche de publications (GET /api/publications?q=test)
  console.log('\n[Test 6] GET /api/publications?q=IA...');
  const pubsRes = await fetch(`${baseUrl}/publications?q=IA`);
  const pubsData = await pubsRes.json();
  console.log(`Résultat Publications (Recherche 'IA'): ${pubsData.total} trouvée(s)`);

  // 6. Statistiques des co-auteurs (GET /api/stats/coauteurs/:uid)
  console.log('\n[Test 8] GET /api/stats/coauteurs/CHR002...');
  const coauteursRes = await fetch(`${baseUrl}/stats/coauteurs/CHR002`);
  const coauteursData = await coauteursRes.json();
  console.log('Résultat Co-auteurs:', coauteursData.length > 0 ? `${coauteursData.length} co-auteurs trouvés` : 'Aucun co-auteur');

  // 7. Statistiques d'un labo (GET /api/stats/labo/:nom)
  console.log('\n[Test 9] GET /api/stats/labo/LARI...');
  const laboRes = await fetch(`${baseUrl}/stats/labo/LARI`);
  const laboData = await laboRes.json();
  console.log('Résultat Stats Labo LARI:', laboData.length > 0 ? laboData.slice(0, 2) : 'Aucune stat');

  console.log('\n--- FIN DES TESTS ---');
}

runTests().catch(err => console.error('Erreur lors des tests:', err));
