import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, User, Share2, BarChart2, Settings, LogIn, LogOut, Archive, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error("Erreur de chargement des notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // refresh every 20 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.lu) {
        await api.patch(`/notifications/${notif._id}/lire`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, lu: true } : n));
      }
      setShowNotifDropdown(false);
      navigate(`/publication/${notif.publicationPid}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/lire-tout');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/search', label: 'Recherche', icon: Search },
    { path: '/network', label: 'Réseau', icon: Share2 },
    { path: '/stats/LARI', label: 'Statistiques Labo', icon: BarChart2 },
  ];

  if (user) {
    navItems.push({ path: '/archive', label: 'Mes Archives', icon: Archive });
  }

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Paramètres', icon: Settings });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHiddenNavbarPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Glassmorphism Navbar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo - Always visible */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-lg leading-none tracking-tighter">S</span>
              </div>
              <Link to="/" className="text-xl font-bold text-white tracking-tight">Scholars<span className="text-primary">Net</span></Link>
            </div>

            {/* Hide Navigation and Auth Button on Login/Landing Page */}
            {!isHiddenNavbarPage && (
              <>
                <div className="hidden md:flex space-x-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'text-white' : 'text-muted hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 z-10 relative">
                          <Icon size={18} className={isActive ? 'text-primary' : ''} />
                          {item.label}
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="navbar-indicator"
                            className="absolute inset-0 bg-white/10 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </Link>
                    )
                  })}
                </div>
                
                <div className="flex items-center gap-4">
                  {user && (
                    <div className="relative" ref={notifRef}>
                      <button 
                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                        className="relative p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
                        title="Notifications"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-surface animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {showNotifDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl border border-border overflow-hidden shadow-2xl z-50 py-1"
                          >
                            <div className="px-4 py-3 border-b border-border/60 flex justify-between items-center bg-surface/50">
                              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Bell size={16} className="text-primary" /> Notifications
                              </span>
                              {unreadCount > 0 && (
                                <button 
                                  onClick={handleMarkAllAsRead}
                                  className="text-xs text-primary hover:underline font-semibold bg-transparent border-none cursor-pointer"
                                >
                                  Tout marquer comme lu
                                </button>
                              )}
                            </div>

                            <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                              {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                  <div 
                                    key={notif._id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer relative text-left ${
                                      !notif.lu ? 'bg-primary/5' : ''
                                    }`}
                                  >
                                    {!notif.lu && (
                                      <span className="absolute top-5 left-2.5 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                    <div className="pl-3.5">
                                      <p className={`text-xs leading-relaxed ${!notif.lu ? 'text-white font-medium' : 'text-muted'}`}>
                                        {notif.texte}
                                      </p>
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-primary/70 uppercase font-bold tracking-wider">
                                          {notif.type}
                                        </span>
                                        <span className="text-[10px] text-muted">
                                          {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center text-muted text-sm italic">
                                  Aucune notification pour le moment.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {user ? (
                    <>
                      <Link to={`/profile/${user.uid}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-white">{user.prenom ? `${user.prenom[0]}. ${user.nom}` : user.nom}</div>
                          <div className="text-xs text-primary capitalize">{user.role}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-primary p-[2px]">
                          <div className="w-full h-full rounded-full bg-surface flex items-center justify-center border-2 border-surface overflow-hidden">
                            <User size={20} className="text-white" />
                          </div>
                        </div>
                      </Link>
                      <button onClick={handleLogout} className="p-2 text-muted hover:text-red-400 transition-colors" title="Se déconnecter">
                        <LogOut size={20} />
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                      <LogIn size={16} /> Se connecter
                    </Link>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        {/* Background ambient glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
