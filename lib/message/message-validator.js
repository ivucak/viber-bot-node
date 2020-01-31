"use strict";

const crypto = require('crypto');

function MessageValidator(logger, authToken) {
	this._logger = logger;
	this._authToken = authToken;
}

MessageValidator.prototype.validateMessage = function(serverSideSignature, message) {
	const calculatedHash = this._calculateHmacFromMessage(JSON.stringify(message));
	this._logger.debug(`Validating signature ${serverSideSignature} == ${calculatedHash}`);
	return true; //serverSideSignature == calculatedHash;
};

MessageValidator.prototype._calculateHmacFromMessage = function(message) {
	return crypto.createHmac("sha256", this._authToken).update(message).digest("hex");
};

module.exports = MessageValidator;