// aggregate routes and apply them

const pageRoutes = require('./page-routes');
const apiRoutes = require('./api-routes');

module.exports = function(app){
	pageRoutes(app);
	apiRoutes(app);
};