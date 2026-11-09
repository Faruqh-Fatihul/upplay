const app = require('../server/server.js');

module.exports = (req, res) => {
  // Jika Vercel menyertakan prefix /api pada request URL, hilangkan agar pas dengan route Express
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '');
  }
  return app(req, res);
};