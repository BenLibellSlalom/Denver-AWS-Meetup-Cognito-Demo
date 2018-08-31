// Routes to navigate to frontend pages

const PageController = require('../controllers/pageController');

module.exports = function(app){
	var pageController = new PageController();
	
	app.get('/', (req, res) => {
		pageController.login(req, res);
  });
  app.get('/register', (req, res) => {
		pageController.register(req, res);
  });
  app.get('/confirm', (req, res) => {
		pageController.confirm(req, res);
  });
  app.get('/afterlogin', (req, res) => {
    pageController.postLogin(req, res);
  });
};