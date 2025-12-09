/**
 * Verify Super Admin Setup
 *
 * This script checks the current status of the super admin account
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SUPER_ADMIN_UID = 'nNKhqEn2EuYmAseyRSvcuyFgICk1';

async function verifySuperAdmin() {
  try {
    console.log('🔍 Checking super admin setup...\n');

    // 1. Check Firestore document
    console.log('1️⃣ Checking Firestore document:');
    const adminDoc = await db.collection('admins').doc(SUPER_ADMIN_UID).get();

    if (!adminDoc.exists) {
      console.log('❌ Admin document does not exist in Firestore!');
      process.exit(1);
    }

    const adminData = adminDoc.data();
    console.log('   ✅ Document exists');
    console.log('   📋 Data:', JSON.stringify(adminData, null, 2));
    console.log('');

    // 2. Check Custom Claims
    console.log('2️⃣ Checking Custom Claims:');
    const userRecord = await admin.auth().getUser(SUPER_ADMIN_UID);
    console.log('   Email:', userRecord.email);
    console.log('   Display Name:', userRecord.displayName);
    console.log('   Custom Claims:', JSON.stringify(userRecord.customClaims, null, 2));
    console.log('');

    // 3. Verify if role is correct
    const hasCorrectRole = userRecord.customClaims?.role === 'superAdmin';

    if (hasCorrectRole) {
      console.log('✅ SUCCESS! Super admin is correctly configured!');
      console.log('   Role: superAdmin');
    } else {
      console.log('⚠️  Custom claim needs to be updated');
      console.log(`   Current: ${JSON.stringify(userRecord.customClaims)}`);
      console.log('   Expected: { role: "superAdmin" }');
      console.log('');
      console.log('🔧 Manually setting custom claim...');

      // Manually set the custom claim
      await admin.auth().setCustomUserClaims(SUPER_ADMIN_UID, { role: 'superAdmin' });
      console.log('✅ Custom claim updated!');

      // Verify again
      const updatedUserRecord = await admin.auth().getUser(SUPER_ADMIN_UID);
      console.log('   New Custom Claims:', JSON.stringify(updatedUserRecord.customClaims, null, 2));
    }

    console.log('');
    console.log('📌 Important:');
    console.log('   The user must log out and log back in for changes to take effect!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

verifySuperAdmin();
