module.exports = function() {
  /**
   * Call-back for successful cognito sign-in 
   * @param {*} session Cognito session object to be unpacked and send to frontend
   */
  this.cognitoSignInSuccess = function(session) {
    return {
      accessToken: session.getAccessToken().getJwtToken(),
      identityToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
    };
  }

  /**
   * Call-back for Cognito registration
   * @param {*} error Error returned on un-successful registration
   * @param {*} userData User Data returned by cognito on successful registration
   */
  this.cognitoRegistrationHandler = function(error, userData) {
    if (error !== null) {
      return {
        name: error.name, 
        message: error.message, 
        statusCode: error.statusCode
      };
    }
    return userData.user;
  }

  /**
   * Call-back for Cognito Account Confirmation
   * @param {*} error Error returned on un-successful confirmation
   * @param {*} message message returned bt cognito on successful confirmation
   */
  this.cognitoConfirmationHandler = function(error, message) {
    return (error !== null) ?
           { name: error.name, message: error.message, statusCode: error.statusCode } :
           message;
  }

  /**
   * Call-back for Cognito sign out
   * @param {*} message message returned bt cognito on successful sign out
   */
  this.cognitoSignOut = function(message) {
    return message;
  }
  
  /**
   * Callback for cognito error states
   * @param {*} error Error returned on un-successful call to cognito
   */
  this.cognitoError = function(error) {
    return { name: error.name, message: error.message, statusCode: error.statusCode };
  }
}
