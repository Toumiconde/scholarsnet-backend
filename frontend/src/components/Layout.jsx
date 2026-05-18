import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, User, Share2, BarChart2, Database, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/search', label: 'Recherche', icon: Search },
    { path: '/network', label: 'Réseau', icon: Share2 },
    { path: '/stats/LARI', label: 'Statistiques Labo', icon: BarChart2 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Database });
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
