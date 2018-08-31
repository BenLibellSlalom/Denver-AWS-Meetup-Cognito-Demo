module.exports = function () {
  const AWSCognito = require('amazon-cognito-identity-js');
  const JsonTokenLib = require('jsonwebtoken');

  const AuthManager = require('../managers/AuthenticationManager');
  const { isNullOrWhiteSpace } = require('../util/UtilityFunctions');

  /**
   * call to log a user in
   * @param {*} req request object containing headers and post data
   * @param {*} res response object that will have data sent through it
   */
	this.login = function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    // user pool enviroment variables
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT;
    if (isNullOrWhiteSpace(username) || isNullOrWhiteSpace(password)) {
      res.status(400).send({ name: 'BadInput', message: 'Username or Password wasn\'t sent', statusCode: 400 });
      return;
    }
    if (isNullOrWhiteSpace(userPoolId) || isNullOrWhiteSpace(clientId)) {
      res.status(400).send({ name: 'BadInput', message: 'Cognito Variables not set', statusCode: 400 });
      return;
    }

    // User pool object
    const userPool = new AWSCognito.CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId
    });

    // cognito user object
    const cognitoUser = new AWSCognito.CognitoUser({
      Username: username,
      Pool: userPool
    })

    // call to manager class to sign in
    const authManager = new AuthManager();
    const authResponse = authManager.signInUser(username, password, cognitoUser);
    
    return authResponse.then((result) => {
      res.send(result);
    }).catch((error) => {
      res.status(error.statusCode).send(error);
    })
  };

  /**
   * call to register a new user to our userpool
   * @param {*} req request object containing headers and post data
   * @param {*} res response object that will have data sent through it
   */
  this.register = function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const userId = req.body.userId;

    // user pool enviroment variables
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT;
    if (isNullOrWhiteSpace(username) || isNullOrWhiteSpace(password) || isNullOrWhiteSpace(userId)) {
      res.status(400).send({ name: 'MisingInput', message: 'Username or Password wasn\'t sent', statusCode: 400 });
      return;
    }
    if (isNullOrWhiteSpace(userPoolId) || isNullOrWhiteSpace(clientId)) {
      res.status(400).send({ name: 'MisingInput', message: 'Cognito Variables not set', statusCode: 400 });
      return;
    }

    // User pool object
    const userPool = new AWSCognito.CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId
    });

    // call to manager class to register
    const authManager = new AuthManager();
    const authResponse = authManager.registerUser(username, password, userId, userPool);

    return authResponse.then((result) => {
      if (result.statusCode !== undefined && result.statusCode !== 200) {
        res.status(result.statusCode).send(result);
      } else {
        res.send(result);
      }
    }).catch((error) => {
      res.status(error.statusCode).send(error);
    });
  }
  
  /**
   * call to confirm a user account in our userpool
   * @param {*} req request object containing headers and post data
   * @param {*} res response object that will have data sent through it
   */
  this.confirm = function (req, res) {
    const email = req.body.username;
    const verificationCode = req.body.verificationCode;

    // user pool enviroment variables
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT;
    if (isNullOrWhiteSpace(email) || isNullOrWhiteSpace(verificationCode)) {
      res.status(400).send({ name: 'MisingInput', message: 'The username or verification code entered was undefined', statusCode: 400 });
      return;
    }
    if (isNullOrWhiteSpace(userPoolId) || isNullOrWhiteSpace(clientId)) {
      res.status(400).send({ name: 'MisingInput', message: 'Cognito Variables not set', statusCode: 400 });
      return;
    }

    // User pool object
    const userPool = new AWSCognito.CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId
    });

    // cognito user object
    const cognitoUser = new AWSCognito.CognitoUser({
      Username: email,
      Pool: userPool
    });

    // call to manager class to register
    const authManager = new AuthManager();
    const confirmResponse = authManager.confirmUser(cognitoUser, verificationCode);

    return confirmResponse.then((result) => {
      if (result.statusCode !== undefined && result.statusCode !== 200) {
        console.log(result);
        res.status(result.statusCode).send(result);
      } else {
        console.log('Success: ' + result);
        res.send({ message: result });
      }
    }).catch((error) => {
      consle.log('shouldn\'t get here');
      res.status(error.statusCode).send(error);
    });
  }

  /**
   * call to register a new user to our userpool
   * @param {*} req request object containing headers and post data
   * @param {*} res response object that will have data sent through it
   */
  this.validate = async function (req, res) {
    // headers containing JWTs to validate
    const authToken = req.headers['auth-token'];
    const idToken = req.headers['identity-token'];
    if (isNullOrWhiteSpace(authToken) || isNullOrWhiteSpace(idToken)) {
      res.status(400).send({ name: 'MisingInput', message: 'Required headers are missing', statusCode: 400 });
      return;
    }

    // user pool enviroment variables
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT;
    if (isNullOrWhiteSpace(userPoolId) || isNullOrWhiteSpace(clientId)) {
      res.status(400).send({ name: 'MisingInput', message: 'Cognito Variables not set', statusCode: 400 });
      return;
    }
    const authManager = new AuthManager();
    try {
      // calls to manager to check both the Id and Access tokens
      const accessResult = await authManager.checkToken(authToken, 'access');
      const identityResult = await authManager.checkToken(idToken, 'id');

      if (accessResult && identityResult) {
        const result = JsonTokenLib.decode(idToken);
        res.send({ 
          message: 'SUCCESS',
          userInfo: result
        });
        return;
      } else {
        res.status(401).send({ name: 'Unauthorized', message: 'Token was not Valid Access Denied', statusCode: 401 });
        return;
      }
    } catch (error) {
      res.status(error.statusCode).send(error);
      return;
    } 
  }
};