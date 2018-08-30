const AWSCognito = require('amazon-cognito-identity-js');
const axios = require('axios');
const JsonTokenLib = require('jsonwebtoken');
const JsonKeyLib = require('jwk-to-pem');
const CognitoResponseManager = require('./CognitoResponseManager');
const { isNullOrUndefined } = require('../util/UtilityFunctions');

module.exports = function () {
  this.signInUser = async function(username, password, cognitoUser) {
    console.log(this);
    const authenticationDetails = new AWSCognito.AuthenticationDetails({
      Username: username,
      Password: password
    });
    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => { resolve(cognitoResponseManager.cognitoSignInSuccess(session)); },
        onFailure: (error) => {
          reject(cognitoResponseManager.cognitoError(error));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          const errorMessage = 'Password change is required but not supported.';
          reject({ name: 'PasswordChangeRequired', message: errorMessage, statusCode: 400 });
        }
      });
    });
  };

  this.signOutUser = async function(cognitoUser) {
    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve) => {
      cognitoUser.globalSignOut({
        onSuccess: (message) => { resolve(cognitoResponseManager.cognitoSignOut(message)); },
        onFailure: (error) => {
          resolve(cognitoResponseManager.cognitoError(error));
        }
      });
    });
  }

  this.registerUser = async function(
    username, password, userId, userPool) {
    const attributeList = [];
    const attributeEmail = new AWSCognito.CognitoUserAttribute({
      Name: 'email',
      Value: username
    });
    const attributeEid = new AWSCognito.CognitoUserAttribute({
      Name: 'custom:userId',
      Value: userId
    });
    attributeList.push(attributeEid);
    attributeList.push(attributeEmail);

    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve) => {
      userPool.signUp(
        username, password, attributeList,
        null, (error, userData) => {
          resolve(cognitoResponseManager.cognitoRegistrationHandler(error, userData));
        });
    });
  }

  this.confirmUser = async function(user, verificationCode) {
    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve) => {
      user.confirmRegistration(verificationCode, false, (error, message) => {
        resolve(cognitoResponseManager.cognitoConfirmationHandler(error, message));
      });
    });
  }

  this.checkToken = async function(token, tokenType) {
    const cognitoUrl = 'https://cognito-idp.us-east-2.amazonaws.com';
    if (token === undefined || tokenType === undefined || cognitoUrl === undefined) {
      return false;
    }

    const userPool = new AWSCognito.CognitoUserPool({
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.USER_POOL_CLIENT
    });

    const iss = cognitoUrl + '/' + userPool.getUserPoolId();
    const decodedAuthToken = JsonTokenLib.decode(token, { complete: true });

    if (isNullOrUndefined(decodedAuthToken) || isNullOrUndefined(decodedAuthToken.header)
      || isNullOrUndefined(decodedAuthToken.payload)) {
      return false;
    }

    const validAuthClaims = this.checkTokenClaims(decodedAuthToken, tokenType, iss);
    if (!validAuthClaims) {
      return false;
    }

    const jwkUrl = iss + '/.well-known/jwks.json';
    const jwks = await axios.get(jwkUrl).then((jwkResponse) => { return jwkResponse.data; });
    const pems = this.mapJWKsToPems(jwks);
    const authKid = decodedAuthToken.header.kid;

    return this.verifyTokenSignature(token, pems, authKid, iss);
  }

  this.checkTokenClaims = function(decodedToken, tokenType, iss) {

    if (decodedToken.payload.iss !== iss) {
      return false;
    }

    if (decodedToken.payload.token_use !== tokenType) {
      return false;
    }

    const timeStamp = Math.round((new Date().getTime()) / 1000);
    const tokenExpiration = decodedToken.payload.exp;

    return (tokenExpiration >= timeStamp);
  }
  
  this.verifyTokenSignature = function(token, pems, kid, iss) {
    const pem = pems[kid];
    if (pem === undefined) {
      return false;
    }

    const verifiedToken = JsonTokenLib.verify(token, pem, { iss });
    if (verifiedToken instanceof Error) {
      return false;
    }

    return true;
  }

  this.mapJWKsToPems = function(input) {
    const pems = {};
    const keys = input['keys'];
    for (const key in keys) {
      // Convert each key to PEM
      const keyId = keys[key].kid;
      const modulus = keys[key].n;
      const exponent = keys[key].e;
      const keyType = keys[key].kty;
      const jwk = { kty: keyType, n: modulus, e: exponent };
      const pem = JsonKeyLib(jwk);
      pems[keyId] = pem;
    }
    return pems;
  }
}
