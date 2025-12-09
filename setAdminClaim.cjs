/**
 * This script sets a custom claim on a Firebase user account to make them an admin.
 * It requires the Firebase Admin SDK and a service account key file.
 *
 * How to use:
 * 1. Make sure you have 'serviceAccountKey.json' in the root of your project.
 * 2. Run 'npm install firebase-admin'.
 * 3. Run 'node setAdminClaim.js'.
 */

const admin = require('firebase-admin');

// This is the UID of the user you want to make an admin.
const uid = 'm9HBHtihdfP6c5AL5Tgbuu0tDTh1';

try {
  // Initialize the Admin SDK
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log(`Attempting to set custom claim { admin: true } for user: ${uid}`);

  // Set the custom claim
  admin.auth().setCustomUserClaims(uid, { admin: true })
    .then(() => {
      console.log('✅ Successfully set admin claim.');
      console.log('Please log out and log back in to the web application for the changes to take effect.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error setting custom claims:', error);
      process.exit(1);
    });

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('❌ Error: serviceAccountKey.json not found.');
    console.error("Please make sure you have downloaded the service account key and saved it as 'serviceAccountKey.json' in the project root.");
  } else {
    console.error('An unexpected error occurred:', error);
  }
  process.exit(1);
}
