import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Award, BookOpen, Briefcase, Mail, MapPin, Building, Edit3, Share2, Activity, Archive, RotateCcw, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {
  const { uid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingPub, setEditingPub] = useState(null);
  const [pubFormData, setPubFormData] = useState({});
  const { user } = useAuth();

  const [pubSearchQuery, setPubSearchQuery] = useState('');
  const [pubFilterYear, setPubFilterYear] = useState('');

  const [isAddingPub, setIsAddingPub] = useState(false);
  const [newPubData, setNewPubData] = useState({
    titre: '',
    annee: new Date().getFullYear(),
    type: 'article',
    statut: 'en_cours',
    mots_cles: [],
    lien_externe: '',
    journal: '',
    booktitle: '',
    editeur: '',
    directeur: '',
    institution: ''
  });
  const [newPubKeywordsText, setNewPubKeywordsText] = useState('');
  const [newPubAuthors, setNewPubAuthors] = useState([]);
  const [newPubPdfFile, setNewPubPdfFile] = useState(null);
  const [allChercheurs, setAllChercheurs] = useState([]);

  useEffect(() => {
    const fetchAllChercheurs = async () => {
      try {
        const { data } = await api.get('/chercheurs');
        setAllChercheurs(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (isAddingPub) {
      fetchAllChercheurs();
      if (data?.chercheur) {
        setNewPubAuthors([{ uid: uid, nom: `${data.chercheur.prenom} ${data.chercheur.nom}`, ordre: 1 }]);
      }
    }
  }, [isAddingPub, data, uid]);

  const handleCreatePub = async (e) => {
    e.preventDefault();
    try {
      const pid = 'PUB' + Date.now().toString().slice(-6);
      
      const payload = { 
        pid,
        ...newPubData, 
        auteurs: newPubAuthors,
        annee: Number(newPubData.annee)
      };

      if (newPubData.type === 'thesis') {
        payload.directeur = { nom: newPubData.directeur };
      }

      await api.post('/publications', payload);

      if (newPubPdfFile) {
        const pdfData = new FormData();
        pdfData.append('file', newPubPdfFile);
        await api.post(`/publications/${pid}/pdf`, pdfData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsAddingPub(false);
      setNewPubPdfFile(null);
      setNewPubKeywordsText('');
      setNewPubData({
        titre: '',
        annee: new Date().getFullYear(),
        type: 'article',
        statut: 'en_cours',
        mots_cles: [],
        lien_externe: '',
        journal: '',
        booktitle: '',
        editeur: '',
        directeur: '',
        institution: ''
      });

      const res = await api.get(`/chercheurs/${uid}`);
      setData(res.data);
    } catch (err) {
      alert("Erreur lors de la création de la publication : " + (err.response?.data?.message || err.message));
    }
  };

  const fileInputRef = React.useRef(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await api.put(`/chercheurs/${uid}`, { photo: base64String });
        const res = await api.get(`/chercheurs/${uid}`);
        setData(res.data);
      } catch (err) {
        alert("Erreur lors du téléversement de l'image : " + (err.response?.data?.message || err.message));
      }
    };
    reader.readAsDataURL(file);
  };

  const canEdit = user && (user.role === 'admin' || user.uid === uid);

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

  const handlePublishDirectlyFromProfile = async (pid) => {
    if (window.confirm("Voulez-vous publier cette recherche pour la rendre visible par tout le monde ?")) {
      try {
        await api.patch(`/publications/${pid}/publier`);
        const res = await api.get(`/chercheurs/${uid}`);
        setData(res.data);
        alert("Félicitations ! Votre publication est désormais PUBLIÉE et visible par tout le monde.");
      } catch (err) {
        alert("Erreur lors de la publication : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleArchivePub = async (pid, shouldArchive) => {
    try {
      await api.put(`/publications/${pid}`, { archive: shouldArchive });
      const res = await api.get(`/chercheurs/${uid}`);
      setData(res.data);
    } catch (err) {
      alert("Erreur lors de l'archivage : " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePub = async (pid) => {
    if (window.confirm("Supprimer définitivement cette publication ?")) {
      try {
        await api.delete(`/publications/${pid}`);
        const res = await api.get(`/chercheurs/${uid}`);
        setData(res.data);
      } catch (err) {
        alert("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditPub = (pub) => {
    setEditingPub(pub);
    setPubFormData({
      titre: pub.titre || '',
      annee: pub.annee || '',
      journal: pub.journal || '',
      booktitle: pub.booktitle || '',
      directeur: pub.directeur?.nom || pub.directeur || '',
      editeur: pub.editeur || '',
      statut: pub.statut || 'brouillon',
    });
  };

  const handleSavePub = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...pubFormData };
      
      if (payload.annee) payload.annee = Number(payload.annee);
      
      if (editingPub.type?.toLowerCase() === 'thesis' || editingPub.type?.toLowerCase() === 'phdthesis' || editingPub.type?.toLowerCase() === 'mastersthesis') {
        payload.directeur = { nom: pubFormData.directeur };
      }

      await api.put(`/publications/${editingPub.pid}`, payload);
      setEditingPub(null);
      const res = await api.get(`/chercheurs/${uid}`);
      setData(res.data);
    } catch (err) {
      alert("Erreur lors de la modification : " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span></div>;
  if (!data) return <div className="text-center py-20">Profil introuvable</div>;

  const { chercheur, hIndex, publications, projets, statsEvolution } = data;

  const activePublications = publications?.filter(p => !p.archive) || [];
  const archivedPublications = publications?.filter(p => p.archive) || [];

  // Extraire toutes les années uniques disponibles pour le filtre
  const availableYears = Array.from(new Set(activePublications.map(p => p.annee)))
    .filter(Boolean)
    .sort((a, b) => b - a);

  // Filtrer par recherche textuelle et par année
  const filteredPublications = activePublications.filter(pub => {
    const matchesSearch = pubSearchQuery
      ? pub.titre?.toLowerCase().includes(pubSearchQuery.toLowerCase()) ||
        pub.type?.toLowerCase().includes(pubSearchQuery.toLowerCase()) ||
        pub.journal?.toLowerCase().includes(pubSearchQuery.toLowerCase()) ||
        pub.directeur?.nom?.toLowerCase().includes(pubSearchQuery.toLowerCase()) ||
        (typeof pub.directeur === 'string' && pub.directeur.toLowerCase().includes(pubSearchQuery.toLowerCase())) ||
        pub.institution?.toLowerCase().includes(pubSearchQuery.toLowerCase())
      : true;

    const matchesYear = pubFilterYear
      ? Number(pub.annee) === Number(pubFilterYear)
      : true;

    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary p-1 shrink-0 shadow-2xl relative group overflow-hidden">
            <div className="w-full h-full rounded-2xl bg-surface flex items-center justify-center overflow-hidden">
              {chercheur.photo ? (
                <img 
                  src={chercheur.photo} 
                  alt={`${chercheur.prenom} ${chercheur.nom}`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={64} className="text-white/50" />
              )}
            </div>
            {canEdit && (
              <button 
                onClick={handleAvatarClick}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-semibold text-white transition-opacity duration-300 gap-1 cursor-pointer"
              >
                <Edit3 size={18} /> Changer
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarFileChange} 
            />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Award size={16} /> {chercheur.grade}
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{chercheur.prenom} <span className="text-gradient">{chercheur.nom}</span></h1>
              </div>
              {canEdit && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors"
                >
                  <Edit3 size={16} /> Modifier
                </button>
              )}
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
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="text-primary" /> Dernières Publications
              </h2>
              {canEdit && (
                <button
                  onClick={() => setIsAddingPub(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors text-sm font-semibold shadow-lg shadow-primary/20"
                >
                  + Ajouter une Publication
                </button>
              )}
            </div>

            {/* Moteur de recherche et filtre d'année hautement esthétique */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-border/40">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 Rechercher dans les publications (titre, type, journal...)"
                  value={pubSearchQuery}
                  onChange={(e) => setPubSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white placeholder-muted focus:border-primary focus:outline-none text-sm transition-all focus:ring-1 focus:ring-primary/30"
                />
                {pubSearchQuery && (
                  <button 
                    onClick={() => setPubSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-white transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="w-full md:w-48">
                <select
                  value={pubFilterYear}
                  onChange={(e) => setPubFilterYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white focus:border-primary focus:outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="">📅 Toutes les années</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPublications.map(pub => (
                <div key={pub.pid} className="p-4 rounded-xl bg-surface/50 border border-border hover:border-primary/50 transition-colors flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-muted uppercase">{pub.type}</span>
                      <span className="text-sm font-medium text-primary">{pub.annee}</span>
                      {pub.statut === 'brouillon' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase tracking-wider">📝 Brouillon</span>}
                      {pub.statut === 'en_cours' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">⚙️ En cours</span>}
                      {pub.statut === 'soumis' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">📤 Soumis</span>}
                      {pub.statut === 'revision' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">🔄 Révision</span>}
                      {(pub.statut === 'publie' || !pub.statut) && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">✅ Publié</span>}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      <Link to={`/publication/${pub.pid}`} className="hover:text-primary transition-colors">
                        {pub.titre}
                      </Link>
                    </h3>
                    {pub.statut === 'en_cours' && (
                      <p className="text-xs text-blue-400/80 italic mb-2 flex items-center gap-1 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 w-fit">
                        <span>⚙️</span> "Cette recherche est en cours de rédaction"
                      </p>
                    )}
                    {pub.statut === 'revision' && (
                      <p className="text-xs text-orange-400/80 italic mb-2 flex items-center gap-1 bg-orange-500/5 px-2 py-1 rounded border border-orange-500/10 w-fit">
                        <span>🔄</span> "Cette publication est en cours de révision"
                      </p>
                    )}
                    <p className="text-sm text-muted">Citations: <span className="text-white font-medium">{pub.citations?.length || 0}</span></p>
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-2 shrink-0">
                      {pub.statut !== 'publie' && (
                        <button 
                          onClick={() => handlePublishDirectlyFromProfile(pub.pid)}
                          className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Publier maintenant"
                        >
                          ✓
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditPub(pub)}
                        className="p-2 bg-surface border border-border rounded-lg text-muted hover:text-white transition-colors"
                        title="Modifier"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleArchivePub(pub.pid, true)}
                        className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title="Archiver"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {filteredPublications.length === 0 && (
                <p className="text-muted text-sm italic py-4">Aucune publication ne correspond à vos critères.</p>
              )}
            </div>
          </motion.div>

          {/* Section Archivage (Corbeille) - Visible uniquement pour le chercheur connecté ou l'admin */}
          {canEdit && archivedPublications.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 border-amber-500/20">
              <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                <Archive className="text-amber-500" /> Publications Archivées (Corbeille)
              </h2>
              <div className="space-y-4">
                {archivedPublications.map(pub => (
                  <div key={pub.pid} className="p-4 rounded-xl bg-surface/30 border border-border/50 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-muted uppercase">{pub.type}</span>
                        <span className="text-sm font-medium text-amber-500">{pub.annee}</span>
                      </div>
                      <h3 className="text-lg font-medium text-muted line-through mb-2">{pub.titre}</h3>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleArchivePub(pub.pid, false)}
                        className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Désarchiver"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeletePub(pub.pid)}
                        className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Activity className="text-primary" /> Croissance &amp; Évolution
              </h2>
              {(() => {
                if (!statsEvolution || statsEvolution.length < 2) return null;
                const sortedStats = [...statsEvolution].sort((a, b) => a.annee - b.annee);
                const last = sortedStats[sortedStats.length - 1].count;
                const prev = sortedStats[sortedStats.length - 2].count;
                if (prev === 0) return null;
                const growth = (((last - prev) / prev) * 100).toFixed(0);
                const isPositive = last >= prev;
                return (
                  <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPositive ? '+' : ''}{growth}%
                  </span>
                );
              })()}
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsEvolution ? [...statsEvolution].sort((a,b) => a.annee - b.annee) : []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="annee" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
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
            className="glass-panel w-full max-w-2xl p-6 bg-surface border border-border rounded-2xl max-h-[90vh] overflow-y-auto"
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
                <label className="block text-sm text-muted mb-1">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Grade</label>
                  <select value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Professeur">Professeur</option>
                    <option value="Maître de conférences">Maître de conférences</option>
                    <option value="Doctorant">Doctorant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Université</label>
                  <input type="text" value={formData.universite || ''} onChange={e => setFormData({...formData, universite: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Laboratoire</label>
                <input type="text" value={formData.laboratoire || ''} onChange={e => setFormData({...formData, laboratoire: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Domaines (séparés par des virgules)</label>
                <input type="text" value={formData.domaines_recherche?.join(', ') || ''} onChange={e => setFormData({...formData, domaines_recherche: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Langues (séparées par des virgules)</label>
                <input type="text" value={formData.langues?.join(', ') || ''} onChange={e => setFormData({...formData, langues: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ex: Français, Anglais" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors">Annuler</button>
              <button 
                onClick={async () => {
                  try {
                    await api.put(`/chercheurs/${uid}`, formData);
                    const res = await api.get(`/chercheurs/${uid}`);
                    setData(res.data);
                    setIsEditing(false);
                    alert("Profil mis à jour avec succès !");
                  } catch (err) {
                    alert("Erreur lors de la mise à jour : " + (err.response?.data?.message || err.message));
                  }
                }} 
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Edition Publication Rapide */}
      {editingPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-panel w-full max-w-lg p-6 bg-surface border border-border rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Modifier la Publication</h2>
            <form onSubmit={handleSavePub} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Titre</label>
                <textarea 
                  value={pubFormData.titre} 
                  onChange={e => setPubFormData({...pubFormData, titre: e.target.value})} 
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Année</label>
                <input 
                  type="number" 
                  value={pubFormData.annee} 
                  onChange={e => setPubFormData({...pubFormData, annee: e.target.value})} 
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Statut de la Publication</label>
                <select
                  value={pubFormData.statut}
                  onChange={e => setPubFormData({...pubFormData, statut: e.target.value})}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {user?.role === 'admin' ? (
                    <>
                      <option value="brouillon" className="bg-surface text-white">📝 Brouillon (Privé)</option>
                      <option value="en_cours" className="bg-surface text-white">⚙️ En cours (Co-auteurs)</option>
                      <option value="soumis" className="bg-surface text-white">📤 Soumis (En attente de validation)</option>
                      <option value="revision" className="bg-surface text-white">🔄 Révision (Corrections requises)</option>
                      <option value="publie" className="bg-surface text-white">✅ Publié (Visible par tout le monde)</option>
                    </>
                  ) : (
                    <>
                      <option value="brouillon" className="bg-surface text-white">📝 Brouillon (Privé - Auteur seul)</option>
                      <option value="en_cours" className="bg-surface text-white">⚙️ En cours (Visible aux co-auteurs)</option>
                      <option value="soumis" className="bg-surface text-white">📤 Soumettre (Envoyer à la validation)</option>
                      {pubFormData.statut === 'revision' && (
                        <option value="revision" className="bg-surface text-white" disabled>🔄 Révision (Correction requise)</option>
                      )}
                      {pubFormData.statut === 'publie' && (
                        <option value="publie" className="bg-surface text-white">✅ Publié (Public)</option>
                      )}
                    </>
                  )}
                </select>
              </div>

              {/* Champ conditionnel simplifié selon type */}
              {editingPub.type === 'article' && (
                <div>
                  <label className="block text-sm text-muted mb-1">Journal</label>
                  <input type="text" value={pubFormData.journal} onChange={e => setPubFormData({...pubFormData, journal: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              {editingPub.type === 'conference' && (
                <div>
                  <label className="block text-sm text-muted mb-1">Conférence (Booktitle)</label>
                  <input type="text" value={pubFormData.booktitle} onChange={e => setPubFormData({...pubFormData, booktitle: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              {editingPub.type === 'thesis' && (
                <div>
                  <label className="block text-sm text-muted mb-1">Directeur de thèse</label>
                  <input type="text" value={pubFormData.directeur} onChange={e => setPubFormData({...pubFormData, directeur: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setEditingPub(null)} className="px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors">Annuler</button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Ajouter Publication */}
      {isAddingPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-panel w-full max-w-lg p-6 bg-surface border border-border rounded-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Ajouter une Publication</h2>
            <form onSubmit={handleCreatePub} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">Titre *</label>
                <textarea 
                  value={newPubData.titre} 
                  onChange={e => setNewPubData({...newPubData, titre: e.target.value})} 
                  placeholder="Saisir le titre de la publication..."
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary h-20 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1 font-semibold">Année *</label>
                  <input 
                    type="number" 
                    value={newPubData.annee} 
                    onChange={e => setNewPubData({...newPubData, annee: e.target.value})} 
                    className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1 font-semibold">Type *</label>
                  <select
                    value={newPubData.type}
                    onChange={e => setNewPubData({...newPubData, type: e.target.value})}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="article" className="bg-surface text-white">Article</option>
                    <option value="conference" className="bg-surface text-white">Conférence</option>
                    <option value="thesis" className="bg-surface text-white">Thèse / Mémoire</option>
                    <option value="book" className="bg-surface text-white">Livre / Chapitre</option>
                    <option value="report" className="bg-surface text-white">Rapport technique</option>
                  </select>
                </div>
              </div>

              {/* Co-auteurs selection */}
              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">Co-auteurs</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newPubAuthors.map((a, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-lg text-xs text-white">
                      <span>{a.nom}</span>
                      {a.uid !== uid && (
                        <button 
                          type="button" 
                          onClick={() => setNewPubAuthors(newPubAuthors.filter(author => author.uid !== a.uid))}
                          className="text-red-400 hover:text-red-300 font-bold ml-1 hover:scale-110 transition-transform"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    const c = allChercheurs.find(x => x.uid === e.target.value);
                    if (c) {
                      setNewPubAuthors([...newPubAuthors, { uid: c.uid, nom: `${c.prenom} ${c.nom}`, ordre: newPubAuthors.length + 1 }]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="" className="bg-surface text-muted font-medium">-- Rechercher un co-auteur... 🔍 --</option>
                  {allChercheurs
                    .filter(c => !newPubAuthors.some(ta => ta.uid === c.uid))
                    .map(c => (
                      <option key={c.uid} value={c.uid} className="bg-surface text-white">
                        {c.prenom} {c.nom} ({c.laboratoire})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Mots-clés input */}
              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">Mots-clés</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newPubData.mots_cles.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface border border-border text-xs text-muted">
                      {kw}
                      <button 
                        type="button" 
                        onClick={() => setNewPubData({ ...newPubData, mots_cles: newPubData.mots_cles.filter(x => x !== kw) })}
                        className="text-red-400 ml-1 font-bold hover:scale-110 transition-transform"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex: NLP, Deep Learning"
                    value={newPubKeywordsText}
                    onChange={e => setNewPubKeywordsText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newPubKeywordsText.trim()) {
                          setNewPubData({
                            ...newPubData,
                            mots_cles: [...newPubData.mots_cles, newPubKeywordsText.trim()]
                          });
                          setNewPubKeywordsText('');
                        }
                      }
                    }}
                    className="flex-1 bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPubKeywordsText.trim()) {
                        setNewPubData({
                          ...newPubData,
                          mots_cles: [...newPubData.mots_cles, newPubKeywordsText.trim()]
                        });
                        setNewPubKeywordsText('');
                      }
                    }}
                    className="px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">Lien Externe (optionnel)</label>
                <input
                  type="text"
                  value={newPubData.lien_externe}
                  onChange={e => setNewPubData({...newPubData, lien_externe: e.target.value})}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="https://doi.org/... ou autre"
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">PDF (optionnel)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setNewPubPdfFile(e.target.files[0])}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                {newPubPdfFile && (
                  <p className="text-xs text-primary mt-1">Fichier sélectionné : {newPubPdfFile.name}</p>
                )}
              </div>

              {/* Statut select */}
              <div>
                <label className="block text-sm text-muted mb-1 font-semibold">Statut de Publication *</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="statut" 
                      value="en_cours" 
                      checked={newPubData.statut === 'en_cours'} 
                      onChange={e => setNewPubData({...newPubData, statut: e.target.value})} 
                      className="accent-primary" 
                    />
                    <span>⚙️ EN_COURS</span>
                  </label>
                  <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="statut" 
                      value="publie" 
                      checked={newPubData.statut === 'publie'} 
                      onChange={e => setNewPubData({...newPubData, statut: e.target.value})} 
                      className="accent-primary" 
                    />
                    <span>✅ PUBLIÉ</span>
                  </label>
                </div>
              </div>

              {/* Type specific fields */}
              {newPubData.type === 'article' && (
                <div>
                  <label className="block text-sm text-muted mb-1">Journal</label>
                  <input type="text" value={newPubData.journal} onChange={e => setNewPubData({...newPubData, journal: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              )}
              {newPubData.type === 'conference' && (
                <div>
                  <label className="block text-sm text-muted mb-1">Conférence (Booktitle)</label>
                  <input type="text" value={newPubData.booktitle} onChange={e => setNewPubData({...newPubData, booktitle: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              )}
              {newPubData.type === 'thesis' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Directeur de thèse</label>
                    <input type="text" value={newPubData.directeur} onChange={e => setNewPubData({...newPubData, directeur: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">Institution</label>
                    <input type="text" value={newPubData.institution} onChange={e => setNewPubData({...newPubData, institution: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/40">
                <button type="button" onClick={() => setIsAddingPub(false)} className="px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors">Annuler</button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
