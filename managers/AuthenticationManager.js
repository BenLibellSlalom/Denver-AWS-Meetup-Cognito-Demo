const AWSCognito = require('amazon-cognito-identity-js');
const axios = require('axios');
const JsonTokenLib = require('jsonwebtoken');
const JsonKeyLib = require('jwk-to-pem');
const CognitoResponseManager = require('./CognitoResponseManager');
const { isNullOrUndefined } = require('../util/UtilityFunctions');

module.exports = function () {
  /**
   * Signs a user into cognito through the AWS Cognito Id Library
   * @param {string} username User name of end user
   * @param {string} password Password of end user
   * @param {CognitoUser} cognitoUser AWS-Cognito Object representing the user
   */
  this.signInUser = async function(username, password, cognitoUser) {
    
    // Object provided to a CognitoUser object attempt to log in with 
    const authenticationDetails = new AWSCognito.AuthenticationDetails({
      Username: username,
      Password: password
    });
    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve, reject) => {

      // Promise wrapped call to cognito to attempt a login
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

  /**
   * Signs a user out of cognito through the AWS Cognito Id Library
   * @param {CognitoUser} cognitoUser AWS-Cognito Object representing the user
   */
  this.signOutUser = async function(cognitoUser) {
    const cognitoResponseManager = new CognitoResponseManager();
    return new Promise((resolve) => {

      // Promise wrapped call to cognito to attempt a logout on this user
      cognitoUser.globalSignOut({
        onSuccess: (message) => { resolve(cognitoResponseManager.cognitoSignOut(message)); },
        onFailure: (error) => {
          resolve(cognitoResponseManager.cognitoError(error));
        }
      });
    });
  }

  /**
   * Registers a user into the provided cognito user pool
   * @param {string} username User name of end user
   * @param {string} password Password of end user
   * @param {string} userId User Id of End User - meant to represent something like a 
   *                        DB Id to tie to downstream user records
   * @param {CognitoUserPool} userPool AWS-Cognito Object representing the user pool to register too
   */
  this.registerUser = async function(
    username, password, userId, userPool) {
    const attributeList = [];

    // Custom and Standard attributes that must be set when creating a user in this pool
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

    // Promise wrapped call to cognito to register this user
    return new Promise((resolve) => {
      userPool.signUp(
        username, password, attributeList,
        null, (error, userData) => {
          resolve(cognitoResponseManager.cognitoRegistrationHandler(error, userData));
        });
    });
  }

  /**
   * Completes the cognito registration process by confirming the user's email
   * @param {CognitoUser} user Cognito user object to verify against
   * @param {string} verificationCode Code issued by cognito to verify user account
   */
  this.confirmUser = async function(user, verificationCode) {
    const cognitoResponseManager = new CognitoResponseManager();

    // Promise wrapped call to cognito to register this user
    return new Promise((resolve) => {
      user.confirmRegistration(verificationCode, false, (error, message) => {
        resolve(cognitoResponseManager.cognitoConfirmationHandler(error, message));
      });
    });
  }

  /**
   * Checks the claims and signature of a JWT to let a user into the site
   * @param {string} token the JWT the user is trying to authorize with
   * @param {string} tokenType the type of cognito JWT the token claims to be
   */
  this.checkToken = async function(token, tokenType) {
    // make sure this matches the region your userpool is in
    const cognitoUrl = 'https://cognito-idp.us-west-2.amazonaws.com';
    if (token === undefined || tokenType === undefined || cognitoUrl === undefined) {
      return false;
    }

    const userPool = new AWSCognito.CognitoUserPool({
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.USER_POOL_CLIENT
    });

    // issuer url of the origin cognito user-pool
    const iss = cognitoUrl + '/' + userPool.getUserPoolId();
    const decodedAuthToken = JsonTokenLib.decode(token, { complete: true });

    if (isNullOrUndefined(decodedAuthToken) || isNullOrUndefined(decodedAuthToken.header)
      || isNullOrUndefined(decodedAuthToken.payload)) {
      return false;
    }

    // check the token claims first
    const validAuthClaims = this.checkTokenClaims(decodedAuthToken, tokenType, iss);
    if (!validAuthClaims) {
      return false;
    }

    // get the Public Key PEMs from cognito to check the signature
    const jwkUrl = iss + '/.well-known/jwks.json';
    const jwks = await axios.get(jwkUrl).then((jwkResponse) => { return jwkResponse.data; });
    const pems = this.mapJWKsToPems(jwks);
    const authKid = decodedAuthToken.header.kid;

    // verify the token signature
    return this.verifyTokenSignature(token, pems, authKid, iss);
  }

  /**
   * Check that the claims inside the token match up with what cognito issues
   * @param {object} decodedToken token to verify claims from
   * @param {string} tokenType the type of cognito JWT the token claims to be
   * @param {string} iss issuer url of the origin cognito user-pool
   */
  this.checkTokenClaims = function(decodedToken, tokenType, iss) {

    if (decodedToken.payload.iss !== iss) {
      return false;
    }

    if (decodedToken.payload.token_use !== tokenType) {
      return false;
    }

    // check that the expiration timestamp is in the future
    const timeStamp = Math.round((new Date().getTime()) / 1000);
    const tokenExpiration = decodedToken.payload.exp;

    return (tokenExpiration >= timeStamp);
  }
  
  /**
   * Checks that the token's signature is valid, indicating that it hasn't been altered
   * @param {string} token the JWT the user is trying to authorize with
   * @param {*} pems list of pem files issued by cognito
   * @param {*} kid the index of the pem file used to verify
   * @param {*} iss issuer url for the cognito user-pool
   */
  this.verifyTokenSignature = function(token, pems, kid, iss) {
    const pem = pems[kid];
    if (pem === undefined) {
      return false;
    }

    // call to verify token signature
    const verifiedToken = JsonTokenLib.verify(token, pem, { iss });
    if (verifiedToken instanceof Error) {
      return false;
    }

    return true;
  }

  /**
   * Maps JWK json given out by cognito into PEM format
   * @param {*} input jwk json
   */
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
