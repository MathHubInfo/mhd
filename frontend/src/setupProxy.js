const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy(['/api', '/admin'], { target: 'http://localhost:8000/' }));
};