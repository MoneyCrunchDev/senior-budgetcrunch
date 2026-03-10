export default async ({ req, res, log }) => {
    const APP_SCHEME = process.env.APP_SCHEME;
    const validSchemes = ['localhost', APP_SCHEME].filter(Boolean);
  
    if (req.method !== 'GET') {
      return res.send('Method Not Allowed', 405);
    }
  
    const path = req.path ?? '';
  
    if (path.includes('/reset-password')) {
      const { scheme, secret, userId, expire } = req.query ?? {};
  
      if (!scheme || !secret || !userId || !expire) {
        log('Missing params: ' + JSON.stringify({ scheme, secret, userId, expire }));
        return res.send('Missing Query Params', 400);
      }
  
      const decodedScheme = decodeURIComponent(scheme);
      const isValid = validSchemes.some(s => decodedScheme.includes(s));
  
      if (!isValid) {
        log('Invalid scheme: ' + decodedScheme);
        return res.send('Invalid Scheme', 400);
      }
  
      const redirectTarget =
        `${decodedScheme}reset_password?secret=${secret}&userId=${userId}&expire=${encodeURIComponent(expire)}`;
  
      log('Redirecting to: ' + redirectTarget);
      return res.redirect(redirectTarget, 301);
    }
  
    return res.send('Nothing to redirect to', 204);
  };