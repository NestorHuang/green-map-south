/**
 * Setup Nestor as Super Admin
 *
 * This script directly sets nestor@systemlead.com (UID: nNKhqEn2EuYmAseyRSvcuyFgICk1)
 * as the super admin by creating a document in Firestore.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SUPER_ADMIN_UID = 'nNKhqEn2EuYmAseyRSvcuyFgICk1';
const SUPER_ADMIN_EMAIL = 'nestor@systemlead.com';

async function setupNestorAsSuperAdmin() {
  try {
    console.log(`📝 Setting up super admin...`);
    console.log(`   UID: ${SUPER_ADMIN_UID}`);
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log('');

    // Create the super admin document in Firestore
    await db.collection('admins').doc(SUPER_ADMIN_UID).set({
      email: SUPER_ADMIN_EMAIL,
      role: 'superAdmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Super admin document created in Firestore!`);
    console.log(`⏳ Waiting for Cloud Function to sync custom claims...`);
    console.log('');

    // Wait for the Cloud Function to trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify the custom claim was set
    try {
      const userRecord = await admin.auth().getUser(SUPER_ADMIN_UID);
      console.log(`📋 User info:`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Display Name: ${userRecord.displayName}`);
      console.log(`   Custom Claims:`, userRecord.customClaims);
      console.log('');

      if (userRecord.customClaims?.role === 'superAdmin') {
        console.log(`✅ SUCCESS! ${SUPER_ADMIN_EMAIL} is now a super admin!`);
      } else {
        console.log(`⚠️  Custom claim not yet set. This may take a moment.`);
        console.log(`   The Cloud Function 'syncAdminStatus' should trigger automatically.`);
      }
    } catch (error) {
      console.log(`⚠️  Could not verify user: ${error.message}`);
    }

    console.log('');
    console.log(`📌 Next steps:`);
    console.log(`   1. User must log out and log back in to get the new permissions`);
    console.log(`   2. Navigate to /admin/manage-admins to manage other admins`);

  } catch (error) {
    console.error(`❌ ERROR:`, error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the setup
setupNestorAsSuperAdmin();
