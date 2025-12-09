/**
 * Add Admin Script
 *
 * This script adds a new admin to the system.
 *
 * Usage:
 *   node add_admin.cjs <email> [role]
 *
 * Arguments:
 *   email - The email address of the user to make an admin
 *   role  - Optional. Either 'admin' or 'superAdmin' (default: 'admin')
 *
 * Example:
 *   node add_admin.cjs user@example.com
 *   node add_admin.cjs user@example.com superAdmin
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Error: Please provide an email address');
    console.log('\nUsage: node add_admin.cjs <email> [role]');
    console.log('\nExamples:');
    console.log('  node add_admin.cjs user@example.com');
    console.log('  node add_admin.cjs user@example.com admin');
    console.log('  node add_admin.cjs user@example.com superAdmin');
    process.exit(1);
  }

  const email = args[0];
  const role = args[1] || 'admin';

  if (role !== 'admin' && role !== 'superAdmin') {
    console.error('❌ Error: Role must be either "admin" or "superAdmin"');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking up user with email: ${email}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`✅ Found user: ${userRecord.displayName || email}`);
    console.log(`   UID: ${uid}`);
    console.log(`📝 Adding as ${role}...`);

    // Check if already an admin
    const adminDoc = await db.collection('admins').doc(uid).get();

    if (adminDoc.exists) {
      const currentData = adminDoc.data();
      console.log(`⚠️  User is already an admin with role: ${currentData.role}`);

      if (currentData.role === role) {
        console.log('✅ No changes needed.');
        process.exit(0);
      }

      console.log(`🔄 Updating role from ${currentData.role} to ${role}...`);
    }

    // Add/update the admin document
    await db.collection('admins').doc(uid).set({
      email: email,
      role: role,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    console.log(`✅ Successfully added/updated ${email} as ${role}!`);
    console.log('⏳ Waiting for Cloud Function to sync custom claims...');

    // Wait for Cloud Function
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify custom claim
    const updatedUserRecord = await admin.auth().getUser(uid);

    if (updatedUserRecord.customClaims?.role === role) {
      console.log(`✅ Custom claim verified!`);
    } else {
      console.log(`⚠️  Custom claim: ${JSON.stringify(updatedUserRecord.customClaims)}`);
      console.log('   The syncAdminStatus Cloud Function should set it automatically.');
    }

    console.log('\n📌 Important: The user must log out and log back in for changes to take effect!');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ ERROR: User with email ${email} not found.`);
      console.error('   Please make sure this user has logged in to the system at least once.');
    } else {
      console.error(`❌ ERROR:`, error.message);
      console.error(error);
    }
    process.exit(1);
  }

  process.exit(0);
}

addAdmin();
