import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Award, BookOpen, Briefcase, Mail, MapPin, Building, Activity } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const { uid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/chercheurs/${uid}`).catch(() => ({
          data: {
            chercheur: { nom: 'Condé', prenom: 'Mamadou Alpha', grade: 'Professeur', laboratoire: 'LARI', universite: 'UGANC', email: 'm.conde@uganc.edu', domaines_recherche: ['IA', 'NLP', 'Big Data'] },
            hIndex: 12,
            publications: [
              { pid: 'PUB001', titre: "Détection d'entités nommées en langues africaines avec BERT", annee: 2023, type: 'article', citations: new Array(15) },
              { pid: 'PUB002', titre: "Modèles de langage pour l'Afrique de l'Ouest", annee: 2022, type: 'inproceedings', citations: new Array(10) }
            ],
            projets: [{ nom: 'AfriNLP', statut: 'en_cours' }]
          }
        }));
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  if (loading) return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span></div>;
  if (!data) return <div className="text-center py-20">Profil introuvable</div>;

  const { chercheur, hIndex, publications, projets } = data;

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary p-1 shrink-0 shadow-2xl">
            <div className="w-full h-full rounded-2xl bg-surface flex items-center justify-center">
              <User size={64} className="text-white/50" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              <Award size={16} /> {chercheur.grade}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{chercheur.prenom} <span className="text-gradient">{chercheur.nom}</span></h1>
            
            <div className="flex flex-wrap gap-4 text-muted mt-4">
              <span className="flex items-center gap-2"><Building size={18}/> {chercheur.laboratoire} - {chercheur.universite}</span>
              <span className="flex items-center gap-2"><Mail size={18}/> {chercheur.email}</span>
            </div>

            <div className="flex gap-2 mt-6">
              {chercheur.domaines_recherche?.map(dom => (
                <span key={dom} className="px-3 py-1 bg-surface border border-border rounded-lg text-sm text-white">
                  {dom}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
            <div className="bg-surface/50 border border-border rounded-2xl p-4 text-center min-w-[120px]">
              <div className="text-3xl font-black text-primary mb-1">{hIndex}</div>
              <div className="text-xs text-muted font-medium uppercase tracking-wider">H-Index</div>
            </div>
            <div className="bg-surface/50 border border-border rounded-2xl p-4 text-center min-w-[120px]">
              <div className="text-3xl font-black text-secondary mb-1">{publications?.length || 0}</div>
              <div className="text-xs text-muted font-medium uppercase tracking-wider">Publications</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="text-primary" /> Dernières Publications
            </h2>
            <div className="space-y-4">
              {publications?.slice(0, 5).map(pub => (
                <div key={pub.pid} className="p-4 rounded-xl bg-surface/50 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-muted uppercase">{pub.type}</span>
                    <span className="text-sm font-medium text-primary">{pub.annee}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{pub.titre}</h3>
                  <p className="text-sm text-muted">Citations: <span className="text-white font-medium">{pub.citations?.length || 0}</span></p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Briefcase className="text-secondary" /> Projets Actifs
            </h2>
            <div className="space-y-3">
              {projets?.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface/50 border border-border">
                  <h4 className="font-semibold text-white">{p.nom}</h4>
                  <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">{p.statut}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
