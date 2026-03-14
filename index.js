const functions = require('firebase-functions');
require('dotenv').config();
const app = require('./src/server');

exports.api = functions.https.onRequest(app);
