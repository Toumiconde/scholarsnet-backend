const SiteConfig = require('../models/SiteConfig');

// GET — Récupérer la config (public, tout le monde peut lire)
exports.getConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT — Mettre à jour la config (admin only)
exports.updateConfig = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST — Upload du logo (admin only)
exports.uploadLogo = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }
    
    const logoUrl = `/uploads/${req.file.filename}`;
    let config = await SiteConfig.findOne();
    if (!config) config = new SiteConfig();
    
    // Déterminer si c'est un logo ou favicon
    const field = req.body.type === 'favicon' ? 'faviconUrl' : 'logoUrl';
    config[field] = logoUrl;
    await config.save();
    
    res.json({ url: logoUrl, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
