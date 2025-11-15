const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Firestore trigger to synchronize a user's admin status with their custom claims.
 * This uses the v2 API for Cloud Functions.
 */
exports.syncAdminStatus = onDocumentWritten("admins/{userId}", async (event) => {
  const userId = event.params.userId;
  const afterData = event.data?.after.data();

  // If the document is deleted (after is undefined), remove the admin claim.
  if (!afterData) {
    console.log(`Admin document for ${userId} deleted. Removing admin claim.`);
    try {
      await admin.auth().setCustomUserClaims(userId, null);
      return {
        message: `Admin claim removed for user ${userId}.`,
      };
    } catch (error) {
      console.error(`Error removing admin claim for ${userId}:`, error);
      return {error: "Failed to remove admin claim."};
    }
  }

  // If the document is created or updated, set the admin claim.
  console.log(`Admin document for ${userId} written. Setting admin claim.`);
  try {
    await admin.auth().setCustomUserClaims(userId, {admin: true});
    return {
      message: `Admin claim set for user ${userId}.`,
    };
  } catch (error) {
    console.error(`Error setting admin claim for ${userId}:`, error);
    return {error: "Failed to set admin claim."};
  }
});