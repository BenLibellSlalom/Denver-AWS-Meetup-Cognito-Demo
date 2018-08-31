module.exports = function () {
  const fs = require('fs');

  // functions to serve out HTML pages for the site
	this.login = function (req, res){
    const fileName = require.resolve('../content/index.html');
    const content = fs.readFileSync(fileName, 'utf8');
    res.send(content);
  };
  this.register = function (req, res){
    const fileName = require.resolve('../content/register.html');
    const content = fs.readFileSync(fileName, 'utf8');
    res.send(content);
  };
  this.confirm = function (req, res){
    const fileName = require.resolve('../content/confirm.html');
    const content = fs.readFileSync(fileName, 'utf8');
    res.send(content);
  }
  this.postLogin = function (req, res){
    const fileName = require.resolve('../content/postLogin.html');
    const content = fs.readFileSync(fileName, 'utf8');
    res.send(content);
  }
};