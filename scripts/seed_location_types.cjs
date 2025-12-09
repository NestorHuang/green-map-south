/**
 * Seed Location Types Script
 *
 * This script creates the initial location types in Firestore.
 * It's designed to be run once during setup.
 * The script is idempotent, meaning it can be run multiple times without creating duplicate data.
 *
 * Usage:
 *   node scripts/seed_location_types.cjs
 */

const admin = require('firebase-admin');

// Note: Ensure you have a serviceAccountKey.json in the root directory.
// This file is git-ignored and contains your Firebase project's private key.
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const teamGatheringType = {
    name: '團集會場地',
    description: '荒野保護協會團集會使用的場地',
    icon: 'meeting-room',
    iconEmoji: '🏢',
    color: '#4CAF50',
    order: 1,
    isActive: true,
    commonFields: {
        name: true,
        address: true,
        description: true,
        photos: true,
        tags: true
    },
    fieldSchema: [
        {
            fieldId: 'capacity',
            label: '場地容納人數',
            type: 'number',
            required: true,
            order: 1,
            placeholder: '請輸入人數',
            helpText: '預估可容納人數',
            validation: { min: 1, max: 1000, integer: true, errorMessage: '人數必須在 1-1000 之間' },
            displayInList: true,
            displayInDetail: true,
            displayOnMap: true,
            suffix: ' 人'
        },
        {
            fieldId: 'equipment',
            label: '可用設備',
            type: 'multi-select',
            required: false,
            order: 2,
            placeholder: '請選擇設備',
            helpText: '可複選多個設備',
            options: [
                { value: 'projector', label: '投影設備', icon: '📽️' },
                { value: 'whiteboard', label: '白板', icon: '📋' },
                { value: 'tables', label: '桌椅', icon: '🪑' },
                { value: 'kitchen', label: '廚房', icon: '🍳' },
                { value: 'parking', label: '停車場', icon: '🅿️' },
                { value: 'wifi', label: '無線網路', icon: '📶' },
                { value: 'ac', label: '空調', icon: '❄️' }
            ],
            displayInList: true,
            displayInDetail: true,
            displayOnMap: false
        },
        {
            fieldId: 'fee',
            label: '使用費用',
            type: 'text',
            required: false,
            order: 3,
            placeholder: '例如：免費、500元/小時',
            helpText: '請說明收費方式',
            validation: { maxLength: 100 },
            displayInList: true,
            displayInDetail: true,
            displayOnMap: false
        },
        {
            fieldId: 'bookingMethod',
            label: '預約方式',
            type: 'textarea',
            required: false,
            order: 4,
            placeholder: '說明如何預約此場地',
            rows: 4,
            validation: { maxLength: 500 },
            displayInList: false,
            displayInDetail: true,
            displayOnMap: false
        },
        {
            fieldId: 'isAccessible',
            label: '無障礙設施',
            type: 'boolean',
            required: false,
            order: 8,
            helpText: '是否有無障礙設施',
            displayInList: true,
            displayInDetail: true,
            displayOnMap: false
        }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system-seed',
    updatedBy: 'system-seed'
};

const greenLifeType = {
    name: '綠生活店家',
    description: '提供綠色生活相關商品或服務的店家',
    icon: 'eco-store',
    iconEmoji: '🌿',
    color: '#8BC34A',
    order: 2,
    isActive: true,
    commonFields: {
        name: true,
        address: true,
        description: true,
        photos: true,
        tags: true
    },
    fieldSchema: [
        {
            fieldId: 'storeHours',
            label: '營業時間',
            type: 'text',
            required: true,
            order: 1,
            placeholder: '例如：週一至週五 10:00-20:00',
            helpText: '請註明每日的營業時間',
            displayInList: true,
            displayInDetail: true,
            displayOnMap: false,
        },
        {
            fieldId: 'services',
            label: '服務項目',
            type: 'checkbox',
            required: false,
            order: 2,
            helpText: '店家提供的服務類型',
            options: [
                { value: 'eco-friendly-products', label: '環保商品' },
                { value: 'local-produce', label: '在地農產' },
                { value: 'bulk-buy', label: '裸賣' },
                { value: 'vegetarian-food', label: '素食餐飲' },
                { value: 'second-hand', label: '二手商品' },
            ],
            displayInList: true,
            displayInDetail: true,
            displayOnMap: false,
        },
        {
            fieldId: 'website',
            label: '官方網站',
            type: 'url',
            required: false,
            order: 3,
            placeholder: 'https://example.com',
            displayInList: false,
            displayInDetail: true,
            displayOnMap: false,
        }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system-seed',
    updatedBy: 'system-seed'
};

async function seedLocationTypes() {
  console.log('🌱 Starting to seed location types...');

  try {
    const typesCollection = db.collection('location_types');

    console.log('  - Setting "團集會場地" (team-gathering)...');
    await typesCollection.doc('team-gathering').set(teamGatheringType);

    console.log('  - Setting "綠生活店家" (green-life)...');
    await typesCollection.doc('green-life').set(greenLifeType);

    console.log('\n✅ Successfully seeded location types!');
    console.log('You can now see the "location_types" collection in your Firestore database.');

  } catch (error) {
    console.error('❌ Error seeding location types:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedLocationTypes().then(() => {
  process.exit(0);
});
