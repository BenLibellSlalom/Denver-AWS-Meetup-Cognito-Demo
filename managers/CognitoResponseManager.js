module.exports = function() {
  this.cognitoSignInSuccess = function(session) {
    return {
      accessToken: session.getAccessToken().getJwtToken(),
      identityToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
    };
  }

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

  this.cognitoConfirmationHandler = function(error, message) {
    return (error !== null) ?
           { name: error.name, message: error.message, statusCode: error.statusCode } :
           message;
  }

  this.cognitoSignOut = function(message) {
    return message;
  }
  
  this.cognitoError = function(error) {
    return { name: error.name, message: error.message, statusCode: error.statusCode };
  }
}
