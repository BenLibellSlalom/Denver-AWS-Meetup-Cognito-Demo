//Utility functions to reduce code re-write

exports.isNullOrWhiteSpace = object => (object === undefined || object === null || typeof object !== 'string' || object.trim() === '');
exports.isNullOrUndefined = object => (object === undefined || object === null);