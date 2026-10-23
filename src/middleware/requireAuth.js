function requireAuth(requiredRole) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
      if (!req.path.startsWith('/api/') && req.accepts('html')) {
        const returnTo = encodeURIComponent(req.originalUrl || req.path);
        return res.redirect(`/login?next=${returnTo}`);
      }
      return res.status(401).json({ error: 'Please sign in to continue.' });
    }

    if (requiredRole && user.role !== requiredRole) {
      if (req.accepts('html')) {
        const returnTo = encodeURIComponent(req.originalUrl || req.path);
        return res.redirect(`/login?switch=1&next=${returnTo}`);
      }
      return res.status(403).json({ error: 'You do not have access to this area.' });
    }

    req.user = user;
    next();
  };
}

module.exports = requireAuth;
