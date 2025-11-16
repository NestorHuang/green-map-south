/**
 * Check User Claims
 *
 * This script checks a user's custom claims
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserClaims() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Error: Please provide an email address');
    console.log('\nUsage: node check_user_claims.cjs <email>');
    process.exit(1);
  }

  const email = args[0];

  try {
    console.log(`🔍 Checking user: ${email}\n`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    console.log('📋 User Information:');
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName}`);
    console.log(`   UID: ${uid}`);
    console.log('');

    // Check Firestore document
    console.log('📄 Firestore Document:');
    const adminDoc = await db.collection('admins').doc(uid).get();

    if (adminDoc.exists) {
      const data = adminDoc.data();
      console.log(`   ✅ Document exists`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Email: ${data.email}`);
      console.log('');
    } else {
      console.log(`   ❌ No admin document found`);
      console.log('');
    }

    // Check Custom Claims
    console.log('🔐 Custom Claims:');
    const claims = userRecord.customClaims || {};
    console.log(`   ${JSON.stringify(claims, null, 2)}`);
    console.log('');

    // Analysis
    console.log('📊 Analysis:');
    if (adminDoc.exists && adminDoc.data().role) {
      const expectedRole = adminDoc.data().role;
      const actualRole = claims.role;

      if (actualRole === expectedRole) {
        console.log(`   ✅ Custom claim matches Firestore (${actualRole})`);
      } else {
        console.log(`   ⚠️  Mismatch detected!`);
        console.log(`      Firestore says: ${expectedRole}`);
        console.log(`      Custom claim says: ${actualRole || 'not set'}`);
        console.log('');
        console.log('🔧 Fixing...');

        // Manually set the custom claim
        await admin.auth().setCustomUserClaims(uid, { role: expectedRole });
        console.log(`   ✅ Custom claim updated to: ${expectedRole}`);
        console.log('');
        console.log('⚠️  User must log out and log back in!');
      }
    } else {
      console.log(`   ⚠️  User is not an admin`);
    }

  } catch (error) {
    console.error(`❌ ERROR:`, error.message);
    process.exit(1);
  }

  process.exit(0);
}

checkUserClaims();
