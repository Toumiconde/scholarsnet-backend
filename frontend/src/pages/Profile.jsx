import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Award, BookOpen, Briefcase, Mail, MapPin, Building, Edit3, Share2, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

export default function Profile() {
  const { uid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

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
            projets: [{ nom: 'AfriNLP', statut: 'en_cours' }],
            statsEvolution: [
              { annee: 2020, count: 2 },
              { annee: 2021, count: 5 },
              { annee: 2022, count: 4 },
              { annee: 2023, count: 8 }
            ]
          }
        }));
        setData(res.data);
        setFormData(res.data.chercheur);
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

  const { chercheur, hIndex, publications, projets, statsEvolution } = data;

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
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Award size={16} /> {chercheur.grade}
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{chercheur.prenom} <span className="text-gradient">{chercheur.nom}</span></h1>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors"
              >
                <Edit3 size={16} /> Modifier
              </button>
            </div>
            
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
              <Activity className="text-primary" /> Évolution (Publications)
            </h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsEvolution || []}>
                  <XAxis dataKey="annee" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Share2 className="text-purple-500" /> Collaborateurs (Top 5)
            </h2>
            <div className="space-y-3">
              {/* This normally comes from Pipeline 1 in the backend, simulated here for UI completeness */}
              {['Diallo F.', 'Camara A.', 'Bah A.', 'Sow M.', 'Sylla O.'].map((nom, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-border">
                  <span className="font-medium text-white flex items-center gap-2"><User size={14} className="text-muted"/> {nom}</span>
                  <span className="text-xs text-muted font-medium bg-white/5 px-2 py-1 rounded-md">{10 - i} pubs</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6">
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

      {/* Modal Edition Profil */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-panel w-full max-w-lg p-6 bg-surface border border-border rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Modifier le Profil</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Prénom</label>
                  <input type="text" value={formData.prenom || ''} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Nom</label>
                  <input type="text" value={formData.nom || ''} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Grade</label>
                <select value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="Professeur">Professeur</option>
                  <option value="Maître de conférences">Maître de conférences</option>
                  <option value="Doctorant">Doctorant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Laboratoire</label>
                <input type="text" value={formData.laboratoire || ''} onChange={e => setFormData({...formData, laboratoire: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Domaines (séparés par des virgules)</label>
                <input type="text" value={formData.domaines_recherche?.join(', ') || ''} onChange={e => setFormData({...formData, domaines_recherche: e.target.value.split(',').map(s=>s.trim())})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors">Annuler</button>
              <button 
                onClick={() => {
                  // In a real app, you would do: await api.put(`/chercheurs/${uid}`, formData);
                  setData({ ...data, chercheur: formData });
                  setIsEditing(false);
                }} 
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
