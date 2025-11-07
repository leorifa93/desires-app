const functions = require('firebase-functions');

// Import the phone verification functions
const { sendVerificationCode } = require('./src/api/sendVerificationCode');
const { approveCode } = require('./src/api/approveCode');

// Import Agora token generation
const { generateAgoraToken } = require('./src/api/generateAgoraToken');

// Export the functions
exports.sendVerificationCode = sendVerificationCode;
exports.approveCode = approveCode;
exports.generateAgoraToken = generateAgoraToken;

