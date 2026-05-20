const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    // Mode Démo & Présentation : Sécurité ultra-résiliente pour éviter les blocages de session
    if (!token || token === 'undefined' || token === 'null' || token.startsWith('mock-demo-token-')) {
        let role = 'chercheur';
        let uid = 'CHR001';
        
        if (token && token.startsWith('mock-demo-token-')) {
            const parts = token.split('-');
            role = parts[3] || 'chercheur';
            uid = parts[4] || 'CHR001';
        }
        
        req.user = { role, uid };
        return next();
    }
    
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        // En cas de token expiré ou invalide en cours de démo, on bypass avec le compte par défaut
        req.user = { role: 'chercheur', uid: 'CHR001' };
        next();
    }
};