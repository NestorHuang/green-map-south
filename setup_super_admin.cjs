/**
 * Setup Super Admin Script
 *
 * This script sets up the initial super admin account for the Green Map South project.
 *
 * Usage:
 *   node setup_super_admin.js
 *
 * Prerequisites:
 *   1. The user must have logged in to the system at least once with their Google account
 *   2. Firebase service account key must be available
 *
 * What this script does:
 *   1. Connects to Firebase using Admin SDK
 *   2. Looks up the user by email (nestor@systemlead.com)
 *   3. Creates/updates a document in the 'admins' collection with role 'superAdmin'
 *   4. The Cloud Function 'syncAdminStatus' will automatically set the custom claim
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Note: Make sure your service account key is in the correct location
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SUPER_ADMIN_EMAIL = 'nestor@systemlead.com';

async function setupSuperAdmin() {
  try {
    console.log(`🔍 Looking up user with email: ${SUPER_ADMIN_EMAIL}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(SUPER_ADMIN_EMAIL);
    const uid = userRecord.uid;

    console.log(`✅ Found user with UID: ${uid}`);
    console.log(`📝 Creating super admin document in Firestore...`);

    // Create or update the admin document in Firestore
    await db.collection('admins').doc(uid).set({
      email: SUPER_ADMIN_EMAIL,
      role: 'superAdmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Super admin document created successfully!`);
    console.log(`⏳ Waiting for Cloud Function to sync custom claims...`);

    // Wait a bit for the Cloud Function to trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify the custom claim was set
    const updatedUserRecord = await admin.auth().getUser(uid);
    console.log(`📋 Custom claims:`, updatedUserRecord.customClaims);

    if (updatedUserRecord.customClaims?.role === 'superAdmin') {
      console.log(`✅ SUCCESS! ${SUPER_ADMIN_EMAIL} is now a super admin!`);
      console.log(`\n📌 Next steps:`);
      console.log(`   1. The user should log out and log back in to get the new permissions`);
      console.log(`   2. Navigate to /admin/manage-admins to manage other admins`);
    } else {
      console.log(`⚠️  Custom claim not yet set. This may take a moment.`);
      console.log(`   Please check the Firebase Console > Functions logs for the syncAdminStatus function.`);
    }

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ ERROR: User with email ${SUPER_ADMIN_EMAIL} not found.`);
      console.error(`   Please make sure this user has logged in to the system at least once.`);
    } else {
      console.error(`❌ ERROR:`, error.message);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Run the setup
setupSuperAdmin();
