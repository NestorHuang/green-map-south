const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Firestore trigger to synchronize a user's role with their custom claims (v2 syntax).
 */
exports.syncAdminStatus = onDocumentWritten("admins/{userId}", async (event) => {
  const userId = event.params.userId;
  const afterData = event.data?.after?.data();
  const userRole = afterData?.role;

  if (!userRole) {
    console.log(`Admin document for ${userId} deleted or role is missing. Removing custom claims.`);
    try {
      await admin.auth().setCustomUserClaims(userId, null);
      return {message: `Custom claims removed for user ${userId}.`};
    } catch (error) {
      console.error(`Error removing custom claims for ${userId}:`, error);
      return {error: "Failed to remove custom claims."};
    }
  }

  console.log(`Admin document for ${userId} written. Setting role claim to '${userRole}'.`);
  try {
    await admin.auth().setCustomUserClaims(userId, {role: userRole});
    return {message: `Role claim '${userRole}' set for user ${userId}.`};
  } catch (error) {
    console.error(`Error setting role claim for ${userId}:`, error);
    return {error: "Failed to set role claim."};
  }
});

/**
 * Get detailed admin status including Custom Claims
 */
exports.getAdminStatus = onCall(
    {cors: true},
    async (request) => {
      const {data, auth} = request;

      // Check if the caller is an admin
      const userRole = auth?.token?.role;
      if (userRole !== "admin" && userRole !== "superAdmin") {
        throw new HttpsError("permission-denied", "Admin access required.");
      }

      const {uid} = data;
      if (!uid) {
        throw new HttpsError("invalid-argument", "UID is required.");
      }

      try {
        // Get user from Auth
        const userRecord = await admin.auth().getUser(uid);

        // Get admin doc from Firestore
        const db = admin.firestore();
        const adminDoc = await db.collection("admins").doc(uid).get();

        return {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          customClaims: userRecord.customClaims || {},
          firestoreData: adminDoc.exists ? adminDoc.data() : null,
          isSynced: adminDoc.exists &&
            userRecord.customClaims?.role === adminDoc.data().role,
        };
      } catch (error) {
        console.error(`Error getting admin status for ${uid}:`, error);
        throw new HttpsError("internal", error.message);
      }
    },
);

/**
 * Manually sync a single admin's Custom Claims
 */
exports.syncAdminClaim = onCall(
    {cors: true},
    async (request) => {
      const {data, auth} = request;

      // Check if the caller is a super admin
      if (auth?.token?.role !== "superAdmin") {
        throw new HttpsError("permission-denied", "Super admin access required.");
      }

      const {uid} = data;
      if (!uid) {
        throw new HttpsError("invalid-argument", "UID is required.");
      }

      try {
        const db = admin.firestore();
        const adminDoc = await db.collection("admins").doc(uid).get();

        if (!adminDoc.exists) {
          throw new HttpsError("not-found", "Admin document not found.");
        }

        const role = adminDoc.data().role;
        await admin.auth().setCustomUserClaims(uid, {role});

        console.log(`Manually synced custom claim for ${uid} to role: ${role}`);

        return {
          success: true,
          message: `Custom claim synced to role: ${role}`,
        };
      } catch (error) {
        console.error(`Error syncing admin claim for ${uid}:`, error);
        throw new HttpsError("internal", error.message);
      }
    },
);

/**
 * Add admin by email (super admin only)
 */
exports.addAdminByEmail = onCall(
    {cors: true},
    async (request) => {
      const {data, auth} = request;

      // Check if the caller is a super admin
      if (auth?.token?.role !== "superAdmin") {
        throw new HttpsError("permission-denied", "Super admin access required.");
      }

      const {email, role} = data;
      if (!email) {
        throw new HttpsError("invalid-argument", "Email is required.");
      }

      const targetRole = role || "admin";
      if (targetRole !== "admin" && targetRole !== "superAdmin") {
        throw new HttpsError("invalid-argument", "Role must be admin or superAdmin.");
      }

      try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // Check if already an admin
        const db = admin.firestore();
        const adminDoc = await db.collection("admins").doc(uid).get();

        if (adminDoc.exists) {
          throw new HttpsError("already-exists", "User is already an admin.");
        }

        // Add to admins collection
        await db.collection("admins").doc(uid).set({
          email: email,
          role: targetRole,
          addedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Added ${email} as ${targetRole} via Cloud Function`);

        return {
          success: true,
          uid: uid,
          message: `Successfully added ${email} as ${targetRole}`,
        };
      } catch (error) {
        console.error(`Error adding admin ${email}:`, error);

        if (error.code === "auth/user-not-found") {
          throw new HttpsError("not-found", "User not found. Please ensure they have logged in at least once.");
        }

        throw new HttpsError("internal", error.message);
      }
    },
);