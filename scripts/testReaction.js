const baseUrl = 'http://localhost:3000/api';

async function test() {
  try {
    // 1. Trouver une publication existante
    console.log('Recherche d\'une publication...');
    const searchRes = await fetch(`${baseUrl}/publications`);
    const searchData = await searchRes.json();
    if (!searchData.publications || searchData.publications.length === 0) {
      console.log('Aucune publication trouvée.');
      return;
    }
    const pub = searchData.publications[0];
    const pid = pub.pid;
    console.log(`Publication trouvée: ${pid} - "${pub.titre}"`);
    console.log('Réactions actuelles:', pub.reactions);

    // 2. Envoyer une réaction
    console.log('\nEnvoi d\'une réaction "coeur"...');
    const reactRes = await fetch(`${baseUrl}/publications/${pid}/reactions/coeur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previousType: null })
    });
    console.log('Statut HTTP de la réaction:', reactRes.status);
    const reactData = await reactRes.json();
    console.log('Réponse de la réaction:', reactData);
  } catch (err) {
    console.error('Erreur:', err);
  }
}

test();
