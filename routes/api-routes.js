// test_post.js

const CognitoController = require('../controllers/cognitoController');

module.exports = function(app){
  const cognitoController = new CognitoController();
	app.post('/login', (req, res) => {
		cognitoController.login(req, res);
  });
  app.post('/register', (req, res) => {
    cognitoController.register(req, res);
  });
  app.post('/confirm', (req, res) => {
    cognitoController.confirm(req, res);
  });
  app.post('/validate', (req, res) => {
    cognitoController.validate(req, res);
  });
};