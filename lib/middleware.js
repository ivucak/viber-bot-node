"use strict";
const bodyParser = require('body-parser');
const stream = require('stream');

function Middleware(logger, messageValidatorService, app, path) {
	this._logger = logger;
	this._stream = this._createStream();
	this._buffer = null;
	this._path = path;

	this._app = app;
	this._app.use(bodyParser.text({ type: "*/*" }));

	this._validateMessageSignature(messageValidatorService);
	this._configureEndpoints();
}

Middleware.prototype.getIncoming = function() {
	return this._app;
};

Middleware.prototype.getStream = function() {
	return this._stream;
};

Middleware.prototype._configureEndpoints = function() {
	const self = this;

	this._app.get(this._path + "/ping", (request, response) => {
		console.log(JSON.stringify(request))
		response.send("pong");
		response.end();
	});

	this._app.post(this._path, (request, response) => {
		self._logger.debug("Request data:", request.body);
		self._stream.push(JSON.stringify(request.body));

		if (self._buffer) {
			response.send(self._buffer);
		}
		response.end();
	});
};

Middleware.prototype._createStream = function() {
	const self = this;
	const duplexStream = new stream.Duplex();

	duplexStream._read = function noop() {};
	duplexStream._write = (chunk, encoding, done) => {
		self._buffer = chunk.toString();
		done();
	};
	return duplexStream;
};

Middleware.prototype._validateMessageSignature = function(messageValidatorService) {
	const self = this;
	this._app.use((request, response, next) => {
		const serverSideSignature = request.headers.X_Viber_Content_Signature || request.query.sig;
		console.log(JSON.stringify(request.body));
		if (!messageValidatorService.validateMessage(serverSideSignature, request.body)) {
			self._logger.warn("Could not validate message signature", serverSideSignature);
			return;
		}
		next();
	});
};

module.exports = Middleware;