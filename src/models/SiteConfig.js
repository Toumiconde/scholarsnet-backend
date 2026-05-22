const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  // Identité du site
  siteName: { type: String, default: 'ScholarsNet' },
  siteSlogan: { type: String, default: 'Réseau Social Académique' },
  siteDescription: { type: String, default: 'Plateforme de valorisation de la production scientifique' },
  
  // Logo (chemin du fichier uploadé)
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
  
  // Institution
  institutionName: { type: String, default: 'Université Gamal Abdel Nasser de Conakry' },
  institutionAbbrev: { type: String, default: 'UGANC' },
  institutionWebsite: { type: String, default: '' },
  
  // Contact
  contactEmail: { type: String, default: 'contact@scholarsnet.edu' },
  contactPhone: { type: String, default: '' },
  contactAddress: { type: String, default: 'Conakry, Guinée' },
  
  // Réseaux sociaux
  socialFacebook: { type: String, default: '' },
  socialTwitter: { type: String, default: '' },
  socialLinkedin: { type: String, default: '' },
  
  // Apparence
  primaryColor: { type: String, default: '#3b82f6' },
  secondaryColor: { type: String, default: '#8b5cf6' },
  
  // Fonctionnalités
  enableRegistration: { type: Boolean, default: true },
  enableComments: { type: Boolean, default: true },
  enableReactions: { type: Boolean, default: true },
  enableNotifications: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Le site est en maintenance. Veuillez réessayer plus tard.' },
  
  // Footer
  footerText: { type: String, default: '© 2026 ScholarsNet - Tous droits réservés' },
  
}, { timestamps: true });

// On n'aura toujours qu'un seul document de config
module.exports = mongoose.model('SiteConfig', siteConfigSchema);
