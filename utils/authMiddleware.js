/**
 * Middleware to check if the user is authenticated
 * Redirects to login page if user is not logged in
 */
export function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    // User is logged in, proceed to next middleware
    next();
  } else {
    // User is not logged in, redirect to login page
    res.redirect('/auth/login');
  }
}

/**
 * Optional: Admin check middleware
 * Can be used to protect admin routes
 */
export function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    // User is an admin, proceed to next middleware
    next();
  } else {
    // User is not an admin, redirect to unauthorized page
    res.status(403).render('error', {
      message: 'Unauthorized: Admin access required',
      error: { status: 403 }
    });
  }
}
