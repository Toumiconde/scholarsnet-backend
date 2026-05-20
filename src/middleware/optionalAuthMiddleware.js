const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification OPTIONNEL.
 * - Si un token valide est présent → req.user est rempli (chercheur / admin)
 * - Si pas de token ou token invalide → req.user = null (visiteur anonyme)
 * Utilisé pour les endpoints accessibles à tous (commentaires, réactions, partage).
 */
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Pas de token → visiteur anonyme
    if (!token || token === 'undefined' || token === 'null') {
        req.user = null;
        return next();
    }

    // Token de démo
    if (token.startsWith('mock-demo-token-')) {
        const parts = token.split('-');
        req.user = {
            role: parts[3] || 'chercheur',
            uid:  parts[4] || 'CHR001'
        };
        return next();
    }

    // Token JWT réel
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    } catch (err) {
        // Token invalide → on considère visiteur anonyme (pas d'erreur bloquante)
        req.user = null;
        next();
    }
};
