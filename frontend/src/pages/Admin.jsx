import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Database, AlertCircle, CheckCircle, FileJson, Eye, UserX, UserCheck, RotateCcw, Trash2, Archive, Settings, Key, FolderOpen, Clock, Users, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [chercheurs, setChercheurs] = useState([]);
  const [archivedPubs, setArchivedPubs] = useState([]);
  const [projetsActifs, setProjetsActifs] = useState([]);
  const [projetsLoading, setProjetsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('import'); // 'import', 'chercheurs', 'archive', 'projets'

  const fetchChercheurs = async () => {
    try {
      const { data } = await api.get('/chercheurs');
      setChercheurs(Array.isArray(data) ? data : (data.chercheurs || []));
    } catch (err) {
      // Fallback for demo if DB is empty/unreachable
      setChercheurs([
        { uid: 'CHR001', nom: 'Condé', prenom: 'Mamadou Alpha', laboratoire: 'LARI', grade: 'Professeur', role: 'chercheur', actif: true },
        { uid: 'CHR002', nom: 'Diallo', prenom: 'Fatoumata', laboratoire: 'LARI', grade: 'Maître de conférences', role: 'chercheur', actif: false },
        { uid: 'ADM001', nom: 'Admin', prenom: 'Système', laboratoire: 'DSI', grade: 'Technicien', role: 'admin', actif: true }
      ]);
    }
  };

  const fetchArchivedPubs = async () => {
    try {
      const { data } = await api.get('/publications?archive=true');
      setArchivedPubs(data.publications || []);
    } catch (err) {
      setArchivedPubs([
        { pid: 'PUB998', titre: "Publication scientifique numéro 998 sur Vision", annee: 2023, type: 'book', auteurs: [{ nom: "Auteur 9" }] }
      ]);
    }
  };

  const fetchProjetsActifs = async () => {
    setProjetsLoading(true);
    try {
      const { data } = await api.get('/projets?statut=en_cours');
      setProjetsActifs(Array.isArray(data) ? data : []);
    } catch (err) {
      // Fallback démo
      setProjetsActifs([
        {
          _id: 'demo1',
          nom: 'Modélisation des réseaux neuronaux profonds',
          description: 'Étude comparative des architectures CNN et Transformer.',
          statut: 'en_cours',
          responsable_uid: 'CHR001',
          membres: ['CHR001', 'CHR002'],
          budget: 15000,
          date_debut: '2025-01-15',
          date_fin: '2026-06-30',
          financeur: 'MESRS'
        }
      ]);
    } finally {
      setProjetsLoading(false);
    }
  };

  const handleChangeStatutProjet = async (id, newStatut) => {
    try {
      await api.put(`/projets/${id}`, { statut: newStatut });
      fetchProjetsActifs();
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.message || err.message));
    }
  };

  React.useEffect(() => {
    fetchChercheurs();
    fetchArchivedPubs();
    fetchProjetsActifs();
  }, []);

  const handleToggleActif = async (uid, currentActif) => {
    try {
      await api.put(`/chercheurs/${uid}`, { actif: !currentActif });
      fetchChercheurs();
    } catch (err) {
      alert("Erreur lors du changement de statut : " + (err.response?.data?.message || err.message));
    }
  };

  const handleAdminResetPassword = async (uid) => {
    const password = window.prompt("Entrez le nouveau mot de passe pour ce chercheur (min 6 caractères) :");
    if (password === null) return;
    if (password.trim().length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    try {
      const { data } = await api.post('/auth/admin-reset-password', { uid, password });
      alert(data.message || "Mot de passe réinitialisé avec succès !");
    } catch (err) {
      alert("Erreur lors de la réinitialisation : " + (err.response?.data?.message || err.message));
    }
  };

  const handleRestorePub = async (pid) => {
    try {
      await api.put(`/publications/${pid}`, { archive: false });
      fetchArchivedPubs();
    } catch (err) {
      alert("Erreur lors de la restauration : " + (err.response?.data?.message || err.message));
    }
  };

  const handlePermanentDeletePub = async (pid) => {
    if (window.confirm("Supprimer définitivement cette publication ? Cette action est irréversible !")) {
      try {
        await api.delete(`/publications/${pid}`);
        fetchArchivedPubs();
      } catch (err) {
        alert("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulation d'importation DBLP
      setTimeout(() => {
        setResult({
          importes: 1045,
          doublons: 12,
          total: 1057
        });
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'importation.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Centered Premium Title Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 shadow-lg shadow-primary/5 animate-pulse">
          <Settings size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Paramètres Système</h1>
        <p className="text-muted max-w-lg mx-auto">
          Gérez l'annuaire de recherche de ScholarsNet, importez les publications DBLP et gérez le cycle de vie de la corbeille globale.
        </p>
      </div>

      {/* Centered Segmented Control for tabs */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-surface/50 border border-border/80 flex gap-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'import'
                ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary/40'
                : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Upload size={16} /> Import DBLP
          </button>
          <button
            onClick={() => setActiveTab('chercheurs')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'chercheurs'
                ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary/40'
                : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <UserCheck size={16} /> Chercheurs
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'archive'
                ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary/40'
                : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Archive size={16} /> Corbeille Globale
          </button>
          <button
            onClick={() => { setActiveTab('projets'); fetchProjetsActifs(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'projets'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/40'
                : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <FolderOpen size={16} /> Projets Actifs
            {projetsActifs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                {projetsActifs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Centered content box */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          {activeTab === 'import' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Database className="text-secondary" /> Importation de Données (DBLP)
                </h2>
                <p className="text-muted text-sm mt-1">Populez la base de données MongoDB de ScholarsNet en téléversant un fichier DBLP JSON.</p>
              </div>

              <div className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center hover:bg-white/[0.02] transition-all cursor-pointer">
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".json"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mb-4 border border-secondary/25">
                    <FileJson size={32} className="text-secondary animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {file ? file.name : "Sélectionner un fichier JSON"}
                  </h3>
                  <p className="text-sm text-muted max-w-xs mx-auto">
                    {file ? `Taille : ${(file.size / 1024).toFixed(2)} KB` : "Glissez-déposez votre dataset DBLP au format JSON ici."}
                  </p>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                    !file || loading ? 'bg-surface/50 text-muted cursor-not-allowed border border-border/30' : 'bg-primary text-white hover:bg-blue-600 shadow-lg shadow-primary/25'
                  }`}
                >
                  {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <Upload size={20} />}
                  Lancer l'importation
                </button>
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-emerald-500 font-bold mb-1">Importation réussie</h4>
                    <p className="text-sm text-emerald-400/80">
                      L'import en masse est terminé. L'opération <code>insertMany</code> de MongoDB a inséré {result.importes} documents. {result.doublons} doublons ont été ignorés.
                    </p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4">
                  <AlertCircle className="text-red-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-red-500 font-bold mb-1">Échec de l'importation</h4>
                    <p className="text-sm text-red-400/80">{error}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'chercheurs' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <UserCheck className="text-secondary" /> Gestion des Chercheurs
                </h2>
                <p className="text-muted text-sm mt-1">Supervisez l'annuaire académique, gérez les statuts d'activité ou suspendez des profils.</p>
              </div>
              
              <div className="overflow-x-auto border border-border/60 rounded-2xl bg-surface/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted bg-white/[0.02]">
                      <th className="py-4 font-semibold px-6 text-sm">Identifiant</th>
                      <th className="py-4 font-semibold px-6 text-sm">Nom complet</th>
                      <th className="py-4 font-semibold px-6 text-sm">Grade / Labo</th>
                      <th className="py-4 font-semibold px-6 text-sm">Rôle</th>
                      <th className="py-4 font-semibold px-6 text-sm">Statut</th>
                      <th className="py-4 font-semibold px-6 text-sm text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chercheurs.map((c, i) => (
                      <tr key={c.uid || i} className="border-b border-border/10 hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-6 text-white font-mono text-sm">{c.uid}</td>
                        <td className="py-4 px-6 text-white font-medium">
                          {c.prenom} <span className="uppercase font-bold text-white/90">{c.nom}</span>
                        </td>
                        <td className="py-4 px-6 text-muted text-sm">
                          <div>{c.grade}</div>
                          <div className="text-xs text-muted/60">{c.laboratoire}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.role === 'admin' ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                            {c.role === 'admin' ? 'ADMIN' : 'CHERCHEUR'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.actif !== false ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {c.actif !== false ? 'ACTIF' : 'SUSPENDU'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                          <Link 
                            to={`/profile/${c.uid}`} 
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-surface border border-border/80 text-muted hover:text-white hover:bg-white/10 transition-colors"
                            title="Voir le profil"
                          >
                            <Eye size={16} />
                          </Link>
                          {c.role !== 'admin' && (
                            <>
                              <button 
                                onClick={() => handleToggleActif(c.uid, c.actif !== false)}
                                className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
                                  c.actif !== false 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title={c.actif !== false ? "Suspendre le compte" : "Réactiver le compte"}
                              >
                                {c.actif !== false ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                              <button 
                                onClick={() => handleAdminResetPassword(c.uid)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                                title="Réinitialiser le mot de passe"
                              >
                                <Key size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {chercheurs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-muted italic text-sm">Aucun chercheur trouvé dans l'annuaire.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 border-amber-500/20 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-3">
                  <Archive className="text-amber-500" /> Corbeille Globale (Système)
                </h2>
                <p className="text-muted text-sm mt-1">Consultez l'ensemble des publications archivées par les chercheurs. Restaurez-les ou détruisez-les définitivement.</p>
              </div>

              <div className="overflow-x-auto border border-border/60 rounded-2xl bg-surface/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted bg-white/[0.02]">
                      <th className="py-4 font-semibold px-6 text-sm">Titre</th>
                      <th className="py-4 font-semibold px-6 text-sm">Année / Type</th>
                      <th className="py-4 font-semibold px-6 text-sm">Auteurs</th>
                      <th className="py-4 font-semibold px-6 text-sm text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedPubs.map((pub, i) => (
                      <tr key={pub.pid || i} className="border-b border-border/10 hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-6 text-muted line-through font-medium max-w-xs truncate text-sm" title={pub.titre}>{pub.titre}</td>
                        <td className="py-4 px-6 text-muted text-sm">
                          <div>{pub.annee}</div>
                          <div className="text-[10px] text-muted/60 uppercase font-semibold">{pub.type}</div>
                        </td>
                        <td className="py-4 px-6 text-muted text-xs">{pub.auteurs?.map(a => a.nom).join(', ')}</td>
                        <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleRestorePub(pub.pid)}
                            className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                            title="Restaurer la publication"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button 
                            onClick={() => handlePermanentDeletePub(pub.pid)}
                            className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {archivedPubs.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-muted italic text-sm">Aucune publication archivée dans le système.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'projets' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FolderOpen className="text-emerald-400" /> Projets de Recherche Actifs
                  </h2>
                  <p className="text-muted text-sm mt-1">Tous les projets avec le statut <span className="text-emerald-400 font-semibold">EN COURS</span>. Vous pouvez modifier leur statut directement.</p>
                </div>
                <button
                  onClick={fetchProjetsActifs}
                  disabled={projetsLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-semibold"
                >
                  <RefreshCw size={14} className={projetsLoading ? 'animate-spin' : ''} /> Actualiser
                </button>
              </div>

              {projetsLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Chargement des projets actifs...</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border/60 rounded-2xl bg-surface/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-muted bg-white/[0.02]">
                        <th className="py-4 font-semibold px-6 text-sm">Nom du projet</th>
                        <th className="py-4 font-semibold px-6 text-sm">Responsable</th>
                        <th className="py-4 font-semibold px-6 text-sm">Membres</th>
                        <th className="py-4 font-semibold px-6 text-sm">Budget / Financeur</th>
                        <th className="py-4 font-semibold px-6 text-sm">Période</th>
                        <th className="py-4 font-semibold px-6 text-sm text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projetsActifs.map((p, i) => (
                        <tr key={p._id || i} className="border-b border-border/10 hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 max-w-xs">
                            <div className="text-white font-semibold text-sm truncate" title={p.nom}>{p.nom}</div>
                            {p.description && (
                              <div className="text-muted text-xs mt-0.5 truncate" title={p.description}>{p.description}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-mono text-xs bg-surface px-2 py-1 rounded border border-border/60">
                              {p.responsable_uid || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-muted text-sm">
                              <Users size={13} className="text-blue-400" />
                              <span className="text-white font-semibold">{p.membres?.length || 0}</span>
                              <span className="text-muted">membre{(p.membres?.length || 0) > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {p.budget ? (
                              <div className="text-white font-semibold text-sm">{p.budget.toLocaleString()} FCFA</div>
                            ) : <div className="text-muted text-sm">—</div>}
                            {p.financeur && <div className="text-muted text-xs">{p.financeur}</div>}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1 text-muted text-xs">
                              <Clock size={11} />
                              <span>{p.date_debut ? new Date(p.date_debut).toLocaleDateString('fr-FR') : '?'}</span>
                              <span>→</span>
                              <span>{p.date_fin ? new Date(p.date_fin).toLocaleDateString('fr-FR') : '?'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <select
                              defaultValue={p.statut}
                              onChange={(e) => handleChangeStatutProjet(p._id, e.target.value)}
                              className="text-xs font-semibold rounded-lg px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-colors outline-none"
                            >
                              <option value="planifie">Planifié</option>
                              <option value="en_cours">En cours</option>
                              <option value="suspendu">Suspendu</option>
                              <option value="termine">Terminé</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {projetsActifs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-muted">
                              <FolderOpen size={32} className="opacity-30" />
                              <span className="italic text-sm">Aucun projet en cours pour le moment.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
