import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function ResearcherArchive() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [archivedPubs, setArchivedPubs] = useState([]);

  const fetchArchives = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/chercheurs/${user.uid}`);
      const allPubs = res.data.publications || [];
      // Filtrer les publications archivées
      setArchivedPubs(allPubs.filter(p => p.archive));
    } catch (err) {
      console.error("Erreur lors de la récupération des archives :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, [user]);

  const handleRestore = async (pid) => {
    try {
      await api.put(`/publications/${pid}`, { archive: false });
      fetchArchives();
    } catch (err) {
      alert("Erreur de restauration : " + (err.response?.data?.message || err.message));
    }
  };

  const handlePermanentDelete = async (pid) => {
    if (window.confirm("Supprimer définitivement cette publication ? Cette action est totalement irréversible !")) {
      try {
        await api.delete(`/publications/${pid}`);
        fetchArchives();
      } catch (err) {
        alert("Erreur de suppression définitive : " + (err.response?.data?.message || err.message));
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Connexion requise</h2>
        <p className="text-muted mb-6">Vous devez être connecté en tant que chercheur pour accéder à votre espace d'archivage.</p>
        <Link to="/login" className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 transition-all shadow-lg shadow-primary/25">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Archive className="text-amber-500" /> Mes Archives (Corbeille)
        </h1>
        <p className="text-muted">
          Espace d'archivage personnel de <span className="text-white font-medium">{user.prenom} {user.nom}</span>. Les publications ci-dessous sont invisibles du public et des statistiques.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          </div>
        ) : archivedPubs.length > 0 ? (
          <div className="space-y-4">
            {archivedPubs.map(pub => (
              <div key={pub.pid} className="p-4 rounded-xl bg-surface/30 border border-border/50 hover:bg-white/[0.02] transition-colors flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-muted uppercase">{pub.type}</span>
                    <span className="text-sm font-medium text-amber-500">{pub.annee}</span>
                  </div>
                  <h3 className="text-lg font-medium text-muted line-through mb-2 truncate" title={pub.titre}>{pub.titre}</h3>
                  {pub.journal && <p className="text-xs text-muted/60 italic">{pub.journal}</p>}
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleRestore(pub.pid)}
                    className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                    title="Restaurer la publication"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(pub.pid)}
                    className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted space-y-3">
            <BookOpen className="mx-auto text-muted/30" size={48} />
            <p className="font-medium text-lg text-white/80">Aucune publication archivée</p>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Lorsque vous archivez vos publications depuis votre profil ou la page de détail, elles apparaîtront ici pour restauration ou suppression définitive.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
