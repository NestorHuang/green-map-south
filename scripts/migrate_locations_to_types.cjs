/**
 * Migrate Existing Locations to Type System Script
 *
 * This script assigns a default type to all existing locations and 
 * pending_locations that do not have a `typeId` yet.
 *
 * It is idempotent, meaning it can be run multiple times without
 * affecting already migrated documents.
 *
 * Usage:
 *   node scripts/migrate_locations_to_types.cjs
 */

const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DEFAULT_TYPE_ID = 'uncategorized';
const DEFAULT_TYPE_DATA = {
    name: '一般地點',
    description: '遷移過程中自動分類的舊有地點。',
    icon: 'pin',
    iconEmoji: '📍',
    color: '#9E9E9E',
    order: 999,
    isActive: true,
    fieldSchema: [],
    commonFields: {
        name: true,
        address: true,
        description: true,
        photos: true,
        tags: true
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system-migration',
    updatedBy: 'system-migration'
};

const BATCH_SIZE = 200; // Firestore batch limit is 500

async function migrateCollection(collectionName) {
    console.log(`\n🔎 Starting migration for "${collectionName}" collection...`);

    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.where('typeId', '==', null).get();

    if (snapshot.empty) {
        console.log(`✅ No documents to migrate in "${collectionName}".`);
        return 0;
    }

    console.log(`Found ${snapshot.size} documents to migrate in "${collectionName}".`);
    
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        batch.update(doc.ref, {
            typeId: DEFAULT_TYPE_ID,
            dynamicFields: {}
        });
        count++;
        batchCount++;
        
        if (batchCount === BATCH_SIZE) {
            console.log(`  - Committing batch of ${batchCount} updates...`);
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        console.log(`  - Committing final batch of ${batchCount} updates...`);
        await batch.commit();
    }

    console.log(`✅ Successfully migrated ${count} documents in "${collectionName}".`);
    return count;
}


async function runMigration() {
    console.log('🚀 Starting data migration for Dynamic Type System.');

    try {
        // 1. Create the default type if it doesn't exist
        console.log(`Ensuring default type "${DEFAULT_TYPE_ID}" exists...`);
        const typeRef = db.collection('location_types').doc(DEFAULT_TYPE_ID);
        await typeRef.set(DEFAULT_TYPE_DATA, { merge: true });
        console.log('✅ Default type is in place.');

        // 2. Migrate collections
        const locationsMigrated = await migrateCollection('locations');
        const pendingMigrated = await migrateCollection('pending_locations');
        
        console.log('\n🏁 Migration summary:');
        console.log(`  - Migrated ${locationsMigrated} documents in 