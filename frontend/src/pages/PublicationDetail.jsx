import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Tag, Globe, FileText, GraduationCap, Mic, Book, ClipboardList, Link2, ExternalLink, User, Edit3, Trash2, Download, MessageSquare, Lock, Heart, ThumbsUp, Flame, Zap, Award, Share2, Copy, ChevronDown, ChevronUp, CornerDownRight, Mail } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

// Tokens de commentaires stockés dans sessionStorage
const TOKENS_KEY = 'comment_tokens';
const getStoredTokens = () => JSON.parse(sessionStorage.getItem(TOKENS_KEY) || '{}');
const storeToken = (commentId, token) => {
  const tokens = getStoredTokens();
  tokens[commentId] = token;
  sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
};

const REACTIONS = [
  { key: 'coeur',   emoji: '❤️', label: 'J\'aime' },
  { key: 'pouce',   emoji: '👍', label: 'Intéressant' },
  { key: 'feu',     emoji: '🔥', label: 'Impressionnant' },
  { key: 'surpris', emoji: '😮', label: 'Surprenant' },
  { key: 'bravo',   emoji: '👏', label: 'Bravo' },
];

export default function PublicationDetail() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [chercheurs, setChercheurs] = useState([]);
  const [tempAuthors, setTempAuthors] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Commentaires
  const [commentText, setCommentText] = useState('');
  const [commentNom, setCommentNom] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyText, setReplyText] = useState('');
  const [replyNom, setReplyNom] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Reaction active locale pour cette publication
  const [activeReaction, setActiveReaction] = useState(() => {
    const saved = localStorage.getItem('scholarsnet_reactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[pid] || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // ── Réactions ──────────────────────────────────────────────────────────
  const handleReaction = async (type) => {
    // 1. Récupération synchrone de la réaction précédente depuis localStorage pour éviter le délai asynchrone de React
    const saved = localStorage.getItem('scholarsnet_reactions');
    let reactionsMap = {};
    if (saved) {
      try { reactionsMap = JSON.parse(saved); } catch (e) {}
    }
    const previous = reactionsMap[pid] || null;

    let next = type;
    if (previous === type) {
      next = null;
    }

    // 2. Mise à jour synchrone de l'état React et de localStorage
    setActiveReaction(next);
    if (next) {
      reactionsMap[pid] = next;
    } else {
      delete reactionsMap[pid];
    }
    localStorage.setItem('scholarsnet_reactions', JSON.stringify(reactionsMap));

    // 3. Mise à jour instantanée optimiste des compteurs dans l'UI
    setPub(prev => {
      if (!prev) return prev;
      const updatedReactions = { ...(prev.reactions || {}) };
      
      // Décrémenter l'ancienne
      if (previous) {
        updatedReactions[previous] = Math.max(0, (updatedReactions[previous] || 0) - 1);
      }
      // Incrémenter la nouvelle
      if (next) {
        updatedReactions[next] = (updatedReactions[next] || 0) + 1;
      }
      
      return { ...prev, reactions: updatedReactions };
    });

    try {
      // 4. Envoi de la requête en arrière-plan avec la valeur previous synchrone
      const { data } = await api.post(`/publications/${pid}/reactions/${type}`, {
        previousType: previous
      });
      
      // 5. Synchronisation finale avec l'état réel du serveur
      setPub(prev => prev ? { ...prev, reactions: data.reactions } : prev);
    } catch (err) {
      console.error(err);
      // En cas d'erreur, restauration synchrone
      setActiveReaction(previous);
      if (previous) {
        reactionsMap[pid] = previous;
      } else {
        delete reactionsMap[pid];
      }
      localStorage.setItem('scholarsnet_reactions', JSON.stringify(reactionsMap));

      setPub(prev => {
        if (!prev) return prev;
        const restoredReactions = { ...(prev.reactions || {}) };
        if (next) {
          restoredReactions[next] = Math.max(0, (restoredReactions[next] || 0) - 1);
        }
        if (previous) {
          restoredReactions[previous] = (restoredReactions[previous] || 0) + 1;
        }
        return { ...prev, reactions: restoredReactions };
      });
    }
  };

  // ── Partage ────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      // Incrémenter le compteur côté serveur
      await api.post(`/publications/${pid}/partager`);
      
      const link = window.location.href;
      let copied = false;

      // Essayer l'API de presse-papier moderne
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(link);
          copied = true;
        } catch (clipErr) {
          console.warn("navigator.clipboard failed, using fallback", clipErr);
        }
      }

      // Fallback résilient avec un textarea temporaire
      if (!copied) {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed"; // évite le scroll indésirable
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          copied = true;
        } catch (copyErr) {
          console.error("execCommand fallback failed", copyErr);
        }
        document.body.removeChild(textArea);
      }

      // Mise à jour de l'UI
      setPub(prev => ({ ...prev, partages: (prev.partages || 0) + 1 }));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error(err);
      // Fallback ultime : alerte utilisateur pour qu'il puisse copier manuellement
      alert("Lien de la publication : " + window.location.href);
    }
  };

  // ── Commentaires ───────────────────────────────────────────────────────
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await api.post(`/publications/${pid}/commentaires`, {
        texte: commentText,
        auteur_nom: user ? undefined : (commentNom || 'Visiteur anonyme')
      });
      if (data.token) storeToken(data.commentId, data.token);
      setPub(prev => ({ ...prev, commentaires: data.commentaires }));
      setCommentText('');
      setCommentNom('');
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    } finally { setCommentLoading(false); }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/publications/${pid}/commentaires/${commentId}/replies`, {
        texte: replyText,
        auteur_nom: user ? undefined : (replyNom || 'Visiteur anonyme')
      });
      if (data.token) storeToken(data.replyId, data.token);
      setPub(prev => ({ ...prev, commentaires: data.commentaires }));
      setReplyText('');
      setReplyNom('');
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    const token = getStoredTokens()[commentId];
    try {
      const { data } = await api.delete(`/publications/${pid}/commentaires/${commentId}`, {
        headers: token ? { 'X-Comment-Token': token } : {}
      });
      setPub(prev => ({ ...prev, commentaires: data.commentaires }));
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    }
  };

  const canDeleteComment = (comment) => {
    if (user?.role === 'admin') return true;
    if (user && comment.auteur_uid === user.uid) return true;
    const tokens = getStoredTokens();
    return !!tokens[comment._id];
  };

  useEffect(() => {
    const fetchChercheurs = async () => {
      try {
        const { data } = await api.get('/chercheurs');
        setChercheurs(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (isEditing) {
      fetchChercheurs();
    }
  }, [isEditing]);

  useEffect(() => {
    if (pub && isEditing) {
      setTempAuthors(pub.auteurs || []);
    }
  }, [isEditing, pub]);

  const canEdit = user && (
    user.role === 'admin' || 
    pub?.auteurs?.some(a => 
      a.uid === user.uid || 
      (user.nom && a.nom && a.nom.toLowerCase().includes(user.nom.toLowerCase()))
    )
  );

  useEffect(() => {
    const fetchPub = async () => {
      try {
        setError(null);
        const { data } = await api.get(`/publications/${pid}`);
        setPub(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Erreur de chargement de la publication.");
      } finally {
        setLoading(false);
      }
    };
    fetchPub();
  }, [pid]);

  useEffect(() => {
    if (pub) {
      setFormData({
        titre: pub.titre || '',
        annee: pub.annee || '',
        journal: pub.journal || '',
        volume: pub.volume || '',
        pages: pub.pages || '',
        doi: pub.doi || '',
        booktitle: pub.booktitle || '',
        ville: pub.ville || '',
        taux_acceptation: pub.taux_acceptation || '',
        directeur: pub.directeur?.nom || pub.directeur || '',
        institution: pub.institution || '',
        mention: pub.mention || '',
        editeur: pub.editeur || pub.publisher || '',
        isbn: pub.isbn || '',
        institution_auteur: pub.institution_auteur || '',
        langue: pub.langue || '',
        statut: pub.statut || 'brouillon',
        lien_externe: pub.lien_externe || '',
      });
    }
  }, [pub]);

  const handlePublishDirectly = async () => {
    if (window.confirm("Voulez-vous publier cette recherche pour la rendre visible par tout le monde ?")) {
      try {
        await api.patch(`/publications/${pid}/publier`);
        setPub(prev => ({ ...prev, statut: 'publie' }));
        alert("Félicitations ! Votre publication est désormais PUBLIÉE et visible par tout le monde.");
      } catch (err) {
        alert("Erreur lors de la publication : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
      try {
        await api.delete(`/publications/${pid}`);
        navigate('/dashboard');
      } catch (err) {
        alert("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, auteurs: tempAuthors };
      
      // Nettoyage et casting des champs numériques pour éviter les CastError de Mongoose
      if (payload.annee) payload.annee = Number(payload.annee);
      
      if (payload.volume === '') {
        delete payload.volume;
      } else if (payload.volume !== undefined && payload.volume !== null) {
        payload.volume = Number(payload.volume);
      }

      if (payload.taux_acceptation === '') {
        delete payload.taux_acceptation;
      } else if (payload.taux_acceptation !== undefined && payload.taux_acceptation !== null) {
        payload.taux_acceptation = Number(payload.taux_acceptation);
      }
      
      // Adapter le directeur de thèse sous forme d'objet { uid, nom } attendu par Mongoose
      if (pub.type?.toLowerCase() === 'thesis' || pub.type?.toLowerCase() === 'phdthesis' || pub.type?.toLowerCase() === 'mastersthesis') {
        payload.directeur = { nom: formData.directeur };
      }

      // 1. Sauvegarder d'abord la publication
      const { data } = await api.put(`/publications/${pid}`, payload);

      // 2. Si un fichier PDF a été sélectionné, le téléverser!
      let updatedPdfPath = pub.pdf_path;
      if (pdfFile) {
        setUploadingPdf(true);
        const pdfData = new FormData();
        pdfData.append('file', pdfFile);
        const uploadRes = await api.post(`/publications/${pid}/pdf`, pdfData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedPdfPath = uploadRes.data.pdf_path;
      }

      setPub({ ...pub, ...payload, pdf_path: updatedPdfPath });
      setIsEditing(false);
      setPdfFile(null);
    } catch (err) {
      alert("Erreur lors de la modification : " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPdf(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Chargement de la publication...</div>;
  if (error) return (
    <div className="max-w-2xl mx-auto my-12 p-8 glass-panel text-center space-y-4 animate-in fade-in">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-white">Accès restreint</h2>
      <p className="text-muted leading-relaxed">{error}</p>
      <Link to="/" className="inline-block px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors">
        Retour à l'accueil
      </Link>
    </div>
  );
  if (!pub) return <div className="p-8 text-center text-red-400">Publication introuvable.</div>;

  const getIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'article': return <FileText className="text-blue-400" size={24} />;
      case 'thesis': 
      case 'phdthesis':
      case 'mastersthesis': return <GraduationCap className="text-purple-400" size={24} />;
      case 'inproceedings': 
      case 'conference': return <Mic className="text-emerald-400" size={24} />;
      case 'book': 
      case 'incollection': return <Book className="text-orange-400" size={24} />;
      case 'report': 
      case 'techreport': return <ClipboardList className="text-gray-400" size={24} />;
      default: return <BookOpen className="text-primary" size={24} />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toLowerCase()) {
      case 'article': return 'Article';
      case 'thesis': 
      case 'phdthesis': return 'Thèse';
      case 'mastersthesis': return 'Mémoire';
      case 'inproceedings': 
      case 'conference': return 'Conférence';
      case 'book': return 'Livre';
      case 'incollection': return 'Chapitre de livre';
      case 'report': 
      case 'techreport': return 'Rapport technique';
      default: return type || 'Publication';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* En-tête principal */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-surface border border-border rounded-xl">
              {getIcon(pub.type)}
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold uppercase tracking-wider">
              {getTypeLabel(pub.type)}
            </span>
            <span className="flex items-center gap-2 text-muted bg-surface px-3 py-1 rounded-full text-sm border border-border">
              <Calendar size={14} /> {pub.annee}
            </span>
            {pub.langue && (
              <span className="flex items-center gap-2 text-muted bg-surface px-3 py-1 rounded-full text-sm border border-border">
                <Globe size={14} /> {pub.langue.toUpperCase()}
              </span>
            )}
            {pub.statut === 'brouillon' && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase tracking-wider">📝 Brouillon</span>}
            {pub.statut === 'en_cours' && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">⚙️ En cours</span>}
            {pub.statut === 'soumis' && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">📤 Soumis</span>}
            {pub.statut === 'revision' && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">🔄 Révision</span>}
            {(pub.statut === 'publie' || !pub.statut) && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">✅ Publié</span>}
          </div>

          {canEdit && (
            <div className="flex gap-2 items-center flex-wrap">
              {pub.statut !== 'publie' && (
                <button 
                  onClick={handlePublishDirectly} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>✅</span> Publier la publication
                </button>
              )}
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors text-sm"
              >
                <Edit3 size={16} /> Modifier
              </button>
              <button 
                onClick={handleDelete} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
              >
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
          {pub.titre}
        </h1>

        {pub.statut === 'en_cours' && (
          <p className="text-sm text-blue-400/80 italic mb-6 flex items-center gap-1.5 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 w-fit">
            <span>⚙️</span> "Cette recherche est en cours de rédaction"
          </p>
        )}
        {pub.statut === 'revision' && (
          <p className="text-sm text-orange-400/80 italic mb-6 flex items-center gap-1.5 bg-orange-500/5 px-4 py-2 rounded-xl border border-orange-500/10 w-fit">
            <span>🔄</span> "Cette publication est en cours de révision"
          </p>
        )}

        <div className="flex flex-wrap gap-4 items-center">
          <div className="text-muted flex items-center gap-2">
            <User size={18} className="text-secondary" /> <strong>Auteurs :</strong>
          </div>
          {pub.auteurs?.map((auteur, idx) => (
            <React.Fragment key={idx}>
              <Link 
                to={`/profile/${auteur.uid}`} 
                className="text-white hover:text-primary transition-colors font-medium hover:underline"
              >
                {auteur.nom}
              </Link>
              {idx < pub.auteurs.length - 1 && <span className="text-border">•</span>}
            </React.Fragment>
          ))}
        </div>

        {pub.mots_cles && pub.mots_cles.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 items-center">
            <Tag size={16} className="text-muted mr-2" />
            {pub.mots_cles.map((kw, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-muted">
                {kw}
              </span>
            ))}
          </div>
        )}

        {(pub.pdf_path || pub.lien_externe) && (
          <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4">
            {pub.pdf_path && (
              <a 
                href={`http://localhost:3000${pub.pdf_path}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
              >
                <Download size={18} /> Télécharger PDF
              </a>
            )}
            {pub.lien_externe && (
              <a 
                href={pub.lien_externe} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors font-medium"
              >
                <ExternalLink size={18} /> Voir en ligne
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne gauche : Détails spécifiques (Polymorphisme) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-border pb-4">
              <BookOpen className="text-primary" /> Informations Spécifiques
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pub.type?.toLowerCase() === 'article' && (
                <>
                  <div><p className="text-sm text-muted mb-1">Journal</p><p className="text-white font-medium">{pub.journal || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">Volume</p><p className="text-white font-medium">{pub.volume || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">Pages</p><p className="text-white font-medium">{pub.pages || '-'}</p></div>
                  {pub.doi && <div><p className="text-sm text-muted mb-1">DOI</p><a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">{pub.doi} <ExternalLink size={14}/></a></div>}
                </>
              )}

              {(pub.type?.toLowerCase() === 'thesis' || pub.type?.toLowerCase() === 'phdthesis' || pub.type?.toLowerCase() === 'mastersthesis') && (
                <>
                  <div><p className="text-sm text-muted mb-1">Directeur de thèse</p><p className="text-white font-medium">{pub.directeur?.nom || pub.directeur || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">Institution</p><p className="text-white font-medium">{pub.institution || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">Mention</p><p className="text-white font-medium">{pub.mention || '-'}</p></div>
                </>
              )}

              {(pub.type?.toLowerCase() === 'inproceedings' || pub.type?.toLowerCase() === 'conference') && (
                <>
                  <div className="sm:col-span-2"><p className="text-sm text-muted mb-1">Nom de la conférence (Booktitle)</p><p className="text-white font-medium">{pub.booktitle || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">Ville</p><p className="text-white font-medium">{pub.ville || '-'}</p></div>
                  {pub.taux_acceptation && <div><p className="text-sm text-muted mb-1">Taux d'acceptation</p><p className="text-white font-medium">{pub.taux_acceptation}%</p></div>}
                </>
              )}

              {(pub.type?.toLowerCase() === 'book' || pub.type?.toLowerCase() === 'incollection') && (
                <>
                  <div><p className="text-sm text-muted mb-1">Éditeur (Publisher)</p><p className="text-white font-medium">{pub.editeur || pub.publisher || '-'}</p></div>
                  <div><p className="text-sm text-muted mb-1">ISBN</p><p className="text-white font-medium">{pub.isbn || '-'}</p></div>
                </>
              )}

              {(pub.type?.toLowerCase() === 'report' || pub.type?.toLowerCase() === 'techreport') && (
                <>
                  <div className="sm:col-span-2"><p className="text-sm text-muted mb-1">Institution auteur</p><p className="text-white font-medium">{pub.institution_auteur || pub.institution || '-'}</p></div>
                </>
              )}
            </div>

            {/* Email de l'auteur affiché en bas de la section Informations Spécifiques */}
            {pub.auteurs?.some(a => a.email) && (
              <div className="mt-6 pt-4 border-t border-border/40">
                <p className="text-sm text-muted mb-2 font-medium">✉️ Contact des Auteurs :</p>
                <div className="flex flex-wrap gap-4">
                  {pub.auteurs.map((a, i) => a.email && (
                    <a
                      key={i}
                      href={`mailto:${a.email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline bg-surface/50 border border-border px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <Mail size={14}/> <span className="font-medium">{a.nom} :</span> {a.email}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Réactions & Partage ────────────────────────────────────── */}
          <div className="glass-panel p-6">
            {/* Barre de réactions */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {REACTIONS.map(r => {
                const isActive = activeReaction === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => handleReaction(r.key)}
                    title={r.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-medium group ${
                      isActive 
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-surface border-border hover:border-primary/50 hover:bg-white/5 text-muted hover:text-white'
                    }`}
                  >
                    <span className={`text-base group-hover:scale-125 transition-transform ${isActive ? 'scale-110' : ''}`}>{r.emoji}</span>
                    <span className={`${isActive ? 'text-primary font-extrabold' : 'text-white font-bold'}`}>{pub.reactions?.[r.key] || 0}</span>
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${copySuccess ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-surface border-border text-muted hover:text-white hover:border-primary/50'}`}
                >
                  <Copy size={14} />
                  {copySuccess ? 'Lien copié !' : `Partager (${pub.partages || 0})`}
                </button>
              </div>
            </div>

            {/* Résumé / Abstract */}
            {pub.resume && (
              <div className="mb-4 p-4 rounded-xl bg-surface/40 border border-border/60">
                <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Résumé</p>
                <p className={`text-sm text-muted leading-relaxed ${!resumeExpanded ? 'line-clamp-3' : ''}`}>
                  {pub.resume}
                </p>
                {pub.resume.length > 200 && (
                  <button onClick={() => setResumeExpanded(v => !v)} className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                    {resumeExpanded ? <><ChevronUp size={12}/> Réduire</> : <><ChevronDown size={12}/> Lire la suite</>}
                  </button>
                )}
              </div>
            )}

          </div>

          {/* ── Commentaires imbriqués ─────────────────────────────────── */}
          <div className="glass-panel p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-border pb-4">
              <MessageSquare className="text-secondary" /> Discussions &amp; Commentaires
              <span className="ml-2 text-sm font-normal text-muted">({pub.commentaires?.length || 0})</span>
            </h2>

            <div className="space-y-4 mb-6">
              {pub.commentaires && pub.commentaires.length > 0 ? pub.commentaires.map(comment => (
                <div key={comment._id} className="p-4 rounded-xl bg-surface/40 border border-border">
                  {/* En-tête commentaire */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs border border-secondary/10">
                        {(comment.auteur_nom || comment.chercheur_nom || 'V').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">{comment.auteur_nom || comment.chercheur_nom || 'Visiteur anonyme'}</span>
                        <span className="text-xs text-muted ml-2">{new Date(comment.date).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)} className="text-xs text-muted hover:text-primary px-2 py-1 rounded flex items-center gap-1">
                        <CornerDownRight size={12}/> Répondre
                      </button>
                      {canDeleteComment(comment) && (
                        <button onClick={() => handleDeleteComment(comment._id)} className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1 rounded">
                          <Trash2 size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed ml-10">{comment.texte}</p>

                  {/* Formulaire reply */}
                  {replyingTo === comment._id && (
                    <div className="mt-3 ml-10 space-y-2">
                      {!user && (
                        <input type="text" placeholder="Votre nom (optionnel)" value={replyNom} onChange={e => setReplyNom(e.target.value)}
                          className="w-full bg-surface/50 border border-border rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary"/>
                      )}
                      <div className="flex gap-2">
                        <textarea 
                          id={`reply-textarea-${comment._id}`}
                          placeholder="Votre réponse..." 
                          value={replyText} 
                          onChange={e => setReplyText(e.target.value)}
                          className="flex-1 bg-surface/50 border border-border rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-secondary h-16 resize-none"
                        />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleReplySubmit(comment._id)} className="px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-medium hover:bg-emerald-600 transition-colors">Envoyer</button>
                          <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 rounded-lg bg-surface border border-border text-muted text-xs hover:text-white">Annuler</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies imbriquées */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-3 ml-10 space-y-3">
                      {/* Bouton Voir plus - Affiché uniquement quand les réponses sont masquées */}
                      {!expandedReplies[comment._id] && (
                        <button 
                          onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: true }))}
                          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-all hover:bg-primary/10"
                        >
                          <ChevronDown size={14}/> Cliquer ici pour voir plus de commentaires ({comment.replies.length})
                        </button>
                      )}

                      {/* Liste des réponses - Affichée uniquement quand les réponses sont développées */}
                      {expandedReplies[comment._id] && (
                        <div className="space-y-3 border-l-2 border-border/40 pl-3 animate-in slide-in-from-left duration-300">
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="p-3 rounded-lg bg-surface/30 border border-border/50">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold text-white">{reply.auteur_nom || 'Visiteur anonyme'}</span>
                                <span className="text-xs text-muted">{new Date(reply.date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</span>
                              </div>
                              <p className="text-xs text-muted leading-relaxed">{reply.texte}</p>
                              
                              <div className="flex gap-4 mt-2 pt-1.5 border-t border-border/10">
                                <button 
                                  onClick={() => {
                                    setReplyingTo(comment._id);
                                    setReplyNom('');
                                    setReplyText(`@${reply.auteur_nom || 'Visiteur anonyme'} `);
                                    setTimeout(() => {
                                      const el = document.getElementById(`reply-textarea-${comment._id}`);
                                      if (el) el.focus();
                                    }, 100);
                                  }}
                                  className="text-[10px] text-muted hover:text-white flex items-center gap-1 transition-colors"
                                >
                                  <MessageSquare size={10} /> Répondre
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Bouton Réduire - Affiché tout en bas de la liste développée */}
                          <button 
                            onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: false }))}
                            className="text-xs text-secondary font-semibold flex items-center gap-1 hover:underline bg-secondary/5 px-3 py-1.5 rounded-lg border border-secondary/10 transition-all hover:bg-secondary/10 mt-2"
                          >
                            <ChevronUp size={14}/> Cliquer ici pour réduire les commentaires
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted italic text-center py-4">Aucun commentaire pour le moment. Soyez le premier !</p>
              )}
            </div>

            {/* Formulaire ajout commentaire */}
            <form onSubmit={handleCommentSubmit} className="border-t border-border pt-4 space-y-2">
              {!user && (
                <input type="text" placeholder="Votre nom (optionnel — vous pouvez rester anonyme)" value={commentNom} onChange={e => setCommentNom(e.target.value)}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted/50"/>
              )}
              <div className="flex gap-3">
                <textarea placeholder={user ? "Votre commentaire ou question scientifique..." : "Votre commentaire (accessible à tous)..."}
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  className="flex-1 bg-surface/50 border border-border rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary h-20 resize-none" required/>
                <button type="submit" disabled={commentLoading}
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-secondary/25 flex flex-col items-center gap-1 text-xs disabled:opacity-50 self-end">
                  <MessageSquare size={16}/>
                  {commentLoading ? '...' : 'Envoyer'}
                </button>
              </div>
              {!user && <p className="text-xs text-muted/60">ℹ️ Vous pouvez supprimer votre commentaire depuis ce navigateur.</p>}
            </form>
          </div>
        </div>

        {/* Colonne droite : Citations */}
        <div className="space-y-8">
          
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Link2 className="text-emerald-400" /> Cité par ({pub.citedBy?.length || 0})
            </h3>
            {user ? (
              pub.citedBy && pub.citedBy.length > 0 ? (
                <ul className="space-y-3">
                  {pub.citedBy.map((cite, idx) => (
                    <li key={cite.pid || idx} className="text-sm bg-surface p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                      <Link to={`/publication/${cite.pid}`} className="text-white hover:text-primary transition-colors line-clamp-2">
                        {cite.titre}
                      </Link>
                      <div className="text-muted mt-1 text-xs">{cite.annee} • {cite.type}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted italic">Aucune publication ne cite ce document pour le moment.</p>
              )
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-muted">Pour voir le détail des publications citantes, veuillez vous connecter.</p>
                <Link to="/login" className="inline-block text-xs font-semibold text-primary hover:underline">Se connecter →</Link>
              </div>
            )}
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-secondary" /> Références ({pub.referencesDocs?.length || 0})
            </h3>
            {user ? (
              pub.referencesDocs && pub.referencesDocs.length > 0 ? (
                <ul className="space-y-3">
                  {pub.referencesDocs.map((ref, idx) => (
                    <li key={ref.pid || idx} className="text-sm bg-surface p-3 rounded-lg border border-border/50 hover:border-secondary/50 transition-colors">
                      <Link to={`/publication/${ref.pid}`} className="text-white hover:text-secondary transition-colors line-clamp-2">
                        {ref.titre}
                      </Link>
                      <div className="text-muted mt-1 text-xs">{ref.annee} • {ref.type}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted italic">Ce document ne liste aucune référence interne.</p>
              )
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-muted">Pour voir le détail des références de ce document, veuillez vous connecter.</p>
                <Link to="/login" className="inline-block text-xs font-semibold text-secondary hover:underline">Se connecter →</Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Edition Publication */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-panel w-full max-w-lg p-6 bg-surface border border-border rounded-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Modifier la Publication</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Titre complet</label>
                <textarea 
                  value={formData.titre} 
                  onChange={e => setFormData({...formData, titre: e.target.value})} 
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Année</label>
                  <input type="number" value={formData.annee} onChange={e => setFormData({...formData, annee: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Langue</label>
                  <input type="text" value={formData.langue} onChange={e => setFormData({...formData, langue: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ex: FR, EN" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Statut de la Publication</label>
                <select
                  value={formData.statut}
                  onChange={e => setFormData({...formData, statut: e.target.value})}
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
                      {formData.statut === 'revision' && (
                        <option value="revision" className="bg-surface text-white" disabled>🔄 Révision (Correction requise)</option>
                      )}
                      {formData.statut === 'publie' && (
                        <option value="publie" className="bg-surface text-white">✅ Publié (Public)</option>
                      )}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Lien Externe (optionnel)</label>
                <input
                  type="text"
                  value={formData.lien_externe || ''}
                  onChange={e => setFormData({...formData, lien_externe: e.target.value})}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="https://doi.org/... ou autre"
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Fichier PDF (optionnel)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setPdfFile(e.target.files[0])}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  {pub.pdf_path && (
                    <span className="text-xs text-emerald-400 font-medium whitespace-nowrap bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">✓ PDF présent</span>
                  )}
                </div>
                {pdfFile && (
                  <p className="text-xs text-primary mt-1">Fichier sélectionné : {pdfFile.name}</p>
                )}
              </div>

              {/* Champs spécifiques */}
              {pub.type?.toLowerCase() === 'article' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Journal</label>
                    <input type="text" value={formData.journal} onChange={e => setFormData({...formData, journal: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-muted mb-1">DOI</label>
                      <input type="text" value={formData.doi} onChange={e => setFormData({...formData, doi: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Pages</label>
                      <input type="text" value={formData.pages} onChange={e => setFormData({...formData, pages: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              )}

              {(pub.type?.toLowerCase() === 'thesis' || pub.type?.toLowerCase() === 'phdthesis' || pub.type?.toLowerCase() === 'mastersthesis') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Directeur de thèse</label>
                    <input type="text" value={formData.directeur} onChange={e => setFormData({...formData, directeur: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">Institution</label>
                      <input type="text" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Mention</label>
                      <input type="text" value={formData.mention} onChange={e => setFormData({...formData, mention: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              )}

              {(pub.type?.toLowerCase() === 'inproceedings' || pub.type?.toLowerCase() === 'conference') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Conférence (Booktitle)</label>
                    <input type="text" value={formData.booktitle} onChange={e => setFormData({...formData, booktitle: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">Ville</label>
                      <input type="text" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Taux d'acceptation (%)</label>
                      <input type="number" value={formData.taux_acceptation} onChange={e => setFormData({...formData, taux_acceptation: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              )}

              {(pub.type?.toLowerCase() === 'book' || pub.type?.toLowerCase() === 'incollection') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Éditeur</label>
                    <input type="text" value={formData.editeur} onChange={e => setFormData({...formData, editeur: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">ISBN</label>
                    <input type="text" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}

              {/* Gestion des co-auteurs */}
              <div className="border-t border-border/40 pt-4 space-y-3">
                <label className="block text-sm font-semibold text-white">Co-auteurs de la publication</label>
                <div className="flex flex-wrap gap-2">
                  {tempAuthors.map((a, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-lg text-xs text-white">
                      <span>{a.nom}</span>
                      {tempAuthors.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setTempAuthors(tempAuthors.filter(author => author.uid !== a.uid))}
                          className="text-red-400 hover:text-red-300 font-bold ml-1 focus:outline-none"
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
                    const c = chercheurs.find(x => x.uid === e.target.value);
                    if (c) {
                      setTempAuthors([...tempAuthors, { uid: c.uid, nom: c.nom, ordre: tempAuthors.length + 1 }]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-surface/50 border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="" className="bg-surface text-muted">-- Ajouter un co-auteur --</option>
                  {chercheurs
                    .filter(c => !tempAuthors.some(ta => ta.uid === c.uid))
                    .map(c => (
                      <option key={c.uid} value={c.uid} className="bg-surface text-white">
                        {c.prenom} {c.nom} ({c.laboratoire})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-colors">Annuler</button>
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
    </div>
  );
}
