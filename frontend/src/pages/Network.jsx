import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { Network as NetworkIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Network() {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [publicationsList, setPublicationsList] = useState([]);
  const [searchParams] = useSearchParams();
  const pid = searchParams.get('pid');
  const { user } = useAuth();

  useEffect(() => {
    // Responsive canvas
    const handleResize = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setWindowSize({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const fetchNetwork = async () => {
      try {
        setLoading(true);
        let nodes = [];
        let links = [];

        if (pid) {
          // Afficher uniquement les co-auteurs de cette publication spécifique
          const { data } = await api.get(`/publications/${pid}`);
          const auteurs = data.auteurs || [];

          // Fonction pour attribuer une couleur selon le domaine d'expertise
          const getDomainColor = (domaines) => {
            if (!domaines || domaines.length === 0) return '#ec4899'; // Défaut (Rose)
            const d = domaines[0].toLowerCase();
            if (d.includes('ia') || d.includes('intelligence')) return '#8b5cf6'; // Violet (IA)
            if (d.includes('data') || d.includes('donnée')) return '#10b981'; // Vert (Data)
            if (d.includes('réseau') || d.includes('securite') || d.includes('cyber')) return '#f59e0b'; // Orange (Réseaux)
            if (d.includes('web') || d.includes('logiciel')) return '#06b6d4'; // Cyan (Dev)
            return '#ec4899'; // Rose pour les autres
          };

          auteurs.forEach((auteur, index) => {
             const uid = auteur.uid || `Visiteur_${index}`;
             
             // Est-ce le chercheur connecté ? (Pour rajouter le tag "Moi")
             const isMe = user && (uid === user.uid);
             
             // LE PRINCIPAL EST TOUJOURS LE 1ER AUTEUR (Celui qui a initié l'idée et invité les autres)
             const isPrincipal = (index === 0);
             
             const nodeColor = isPrincipal ? '#3b82f6' : getDomainColor(auteur.domaines_recherche);
             const nodeSize = isPrincipal ? 28 : 18;

             // Déterminer le libellé court du domaine
             let domainLabel = '';
             if (auteur.domaines_recherche && auteur.domaines_recherche.length > 0) {
                 const d = auteur.domaines_recherche[0].toLowerCase();
                 if (d.includes('ia') || d.includes('intelligence')) domainLabel = 'IA';
                 else if (d.includes('data') || d.includes('donnée')) domainLabel = 'Data';
                 else if (d.includes('réseau') || d.includes('securite') || d.includes('cyber')) domainLabel = 'Cyber';
                 else if (d.includes('web') || d.includes('logiciel')) domainLabel = 'Web';
                 else domainLabel = auteur.domaines_recherche[0].substring(0, 6);
             }

             nodes.push({ 
                 id: uid, 
                 name: isMe ? `${auteur.nom} (Moi)` : auteur.nom, 
                 val: nodeSize, 
                 color: nodeColor,
                 isPrincipal: isPrincipal,
                 domain: domainLabel
             });
          });

          // Création des liens : Toujours centrer sur le 1er auteur (L'initiateur)
          const principalNode = nodes.find(n => n.isPrincipal) || nodes[0];
          
          if (principalNode) {
            nodes.forEach((n, i) => {
               if (n.id !== principalNode.id) {
                  links.push({ source: principalNode.id, target: n.id, value: 6 });
               }
               for (let j = 0; j < i; j++) {
                  if (nodes[j].id !== principalNode.id && n.id !== principalNode.id) {
                     links.push({ source: nodes[j].id, target: n.id, value: 2 });
                  }
               }
            });
          }
        } else if (user && user.role === 'admin') {
           // Graphe global de TOUS les chercheurs pour l'ADMIN (Vue Macroscopique)
           const { data } = await api.get('/publications');
           const pubs = data.publications || [];
           
           const nodeMap = new Map();
           const linkMap = new Map();
           
           const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];
           
           pubs.forEach(pub => {
              if (!pub.auteurs) return;
              
              // Ajouter les nœuds (chercheurs)
              pub.auteurs.forEach(a => {
                 if (!a.uid) return;
                 if (!nodeMap.has(a.uid)) {
                    // Couleur consistante basée sur l'UID
                    const colorIndex = a.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                    nodeMap.set(a.uid, {
                       id: a.uid,
                       name: a.nom,
                       val: 12, // Taille de base
                       color: colors[colorIndex],
                       isPrincipal: false,
                       pubsCount: 1
                    });
                 } else {
                    const n = nodeMap.get(a.uid);
                    n.pubsCount += 1;
                    n.val = Math.min(35, 12 + (n.pubsCount * 1.5)); // La taille augmente avec le nb de publications (max 35)
                 }
              });
              
              // Créer les liens (collaborations)
              if (pub.auteurs.length > 1) {
                  for (let i = 0; i < pub.auteurs.length; i++) {
                     for (let j = i + 1; j < pub.auteurs.length; j++) {
                        const id1 = pub.auteurs[i].uid;
                        const id2 = pub.auteurs[j].uid;
                        if (!id1 || !id2 || id1 === id2) continue;
                        
                        const linkId = [id1, id2].sort().join('-');
                        if (!linkMap.has(linkId)) {
                           linkMap.set(linkId, { source: id1, target: id2, value: 2 });
                        } else {
                           linkMap.get(linkId).value += 1; // Le lien s'épaissit si multiples collaborations
                        }
                     }
                  }
              }
           });
           
           nodes = Array.from(nodeMap.values());
           links = Array.from(linkMap.values());

        } else if (user) {
          // Graphe global du réseau (spécifique au chercheur connecté)
          const uidToFetch = user.uid;
          const userName = `${user.prenom ? user.prenom[0] + '. ' : ''}${user.nom} (Moi)`;

          const { data } = await api.get(`/stats/coauteurs/${uidToFetch}`).catch(() => ({
            data: [] // Sécurité si aucune donnée n'est renvoyée
          }));

          nodes.push({ id: uidToFetch, name: userName, val: 28, color: '#3b82f6', isPrincipal: true });

          if (data && data.length > 0) {
            data.forEach(co => {
              nodes.push({ id: co._id, name: co.nom, val: Math.min(22, co.nb * 3 + 12), color: '#8b5cf6' });
              links.push({ source: uidToFetch, target: co._id, value: co.nb });
            });
          }
        }

        setGraphData({ nodes, links });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
    return () => window.removeEventListener('resize', handleResize);
  }, [pid]);

  // Appliquer les forces d'espacement une fois que le graphe est chargé
  useEffect(() => {
    if (fgRef.current && !loading) {
      // Augmenter la répulsion pour éloigner les nœuds les uns des autres
      fgRef.current.d3Force('charge').strength(-500);
      // Définir une distance minimale pour les liens
      fgRef.current.d3Force('link').distance(120);
    }
  }, [graphData, loading]);

  // Charger la liste des publications du chercheur (ou toutes pour l'admin)
  useEffect(() => {
    if (user) {
      const fetchPubs = async () => {
        try {
          const url = user.role === 'admin' ? '/publications' : `/publications?uid=${user.uid}`;
          const { data } = await api.get(url);
          
          let pubs = data.publications || [];
          
          // FILTRE DE SÉCURITÉ FORCÉ CÔTÉ FRONTEND 
          // (Au cas où le backend n'a pas encore été redémarré avec la nouvelle logique)
          if (user.role === 'chercheur') {
            pubs = pubs.filter(pub => pub.auteurs && pub.auteurs.some(a => a.uid === user.uid));
          }
          
          setPublicationsList(pubs);
        } catch (err) {
          console.error(err);
        }
      };
      fetchPubs();
    }
  }, [user]);

  const navigate = useNavigate();
  const handleZoomIn = useCallback(() => { fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400); }, []);
  const handleZoomOut = useCallback(() => { fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400); }, []);
  const handleFit = useCallback(() => { fgRef.current?.zoomToFit(400); }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {pid ? 'Réseau de la recherche' : (user?.role === 'admin' ? 'Cartographie Globale du Laboratoire' : 'Réseau de Co-auteurs')}
        </h1>
        <p className="text-muted">
          {pid ? 'Visualisation des interactions entre les auteurs de cette publication spécifique.' : (user?.role === 'admin' ? 'Vue macroscopique complète de toutes les collaborations interdisciplinaires enregistrées sur la plateforme.' : 'Graphe d\'interactions scientifiques généré via vos collaborations globales.')}
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-panel relative overflow-hidden flex flex-col ${user ? 'w-2/3' : 'w-full'}`}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-surface/80 backdrop-blur-md p-2 rounded-xl border border-border">
                <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ZoomIn size={20}/></button>
                <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ZoomOut size={20}/></button>
                <button onClick={handleFit} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><Maximize size={20}/></button>
              </div>
              
              <div id="graph-container" className="w-full flex-1">
                {windowSize.width > 0 && (
                  <ForceGraph2D
                    ref={fgRef}
                    width={windowSize.width}
                    height={windowSize.height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeColor="color"
                    nodeRelSize={6}
                    linkColor={() => '#334155'}
                    linkWidth={link => link.value}
                    d3VelocityDecay={0.3}
                    backgroundColor="rgba(0,0,0,0)"
                    onNodeClick={node => {
                      fgRef.current.centerAt(node.x, node.y, 1000);
                      fgRef.current.zoom(2, 2000);
                      setTimeout(() => navigate(`/profile/${node.id}`), 500);
                    }}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      // Dessiner le cercle
                      ctx.fillStyle = node.color;
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                      ctx.fill();
                      
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      
                      // Texte DANS le cercle (Principal ou Domaine)
                      const insideFontSize = node.isPrincipal ? node.val * 0.35 : node.val * 0.5;
                      ctx.font = `bold ${insideFontSize}px Sans-Serif`;
                      ctx.fillStyle = '#ffffff';
                      
                      if (node.isPrincipal) {
                          ctx.fillText("Principal", node.x, node.y);
                      } else if (node.domain) {
                          ctx.fillText(node.domain, node.x, node.y);
                      }
                      
                      // Nom de l'auteur EN DESSOUS du cercle pour TOUT LE MONDE
                      const fontSize = 12 / globalScale;
                      ctx.font = `${fontSize}px Sans-Serif`;
                      ctx.fillStyle = '#f8fafc';
                      ctx.fillText(node.name, node.x, node.y + node.val + fontSize);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Panneau latéral des publications (Uniquement pour Chercheur ou Admin) */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/3 glass-panel p-5 flex flex-col overflow-hidden"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
              <span>{user.role === 'admin' ? 'Toutes les Publications' : 'Mes Publications'}</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{publicationsList.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {publicationsList.length === 0 ? (
                 <p className="text-sm text-muted">Aucune publication trouvée.</p>
              ) : (
                publicationsList.map(pub => (
                  <div 
                    key={pub.pid} 
                    onClick={() => navigate(`/network?pid=${pub.pid}`)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                      pid === pub.pid ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-surface border-border hover:bg-white/5'
                    }`}
                  >
                    <h4 className="text-sm font-bold text-gray-200 line-clamp-2">{pub.titre}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-muted uppercase tracking-wider">{pub.type}</span>
                      <span className="text-xs text-primary font-mono">{pub.annee}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
