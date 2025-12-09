// Import necessary functions from Firebase SDK and dotenv
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, GeoPoint } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('Starting database seeding script...');

// Use the same Firebase configuration from your .env file
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// --- DATA TO SEED ---

// 1. Admin User (using the UID you provided)
const adminUID = 'm9HBHtihdfP6c5AL5Tgbuu0tDTh1';
const adminData = {
  email: 'nestor.huang@gmail.com',
  role: 'superadmin',
  createdAt: new Date(),
};

// 2. Tags
const tagsData = {
  'vegan': { name: '全素/蔬食' },
  'eco-friendly-utensils': { name: '環保餐具' },
  'second-hand': { name: '二手/古著' },
  'local-farmer': { name: '在地小農' },
  'package-free': { name: '無包裝商店' },
};

// 3. Sample Locations
const locationsData = [
  {
    name: '寬心園精緻蔬食',
    address: '高雄市苓雅區中山二路463號',
    description: '提供創意精緻的蔬食料理，環境優雅，適合聚餐。',
    position: new GeoPoint(22.6194, 120.3002),
    photoURL: 'https://i.imgur.com/O6b8o6j.jpeg', // Placeholder image
    tags: ['vegan', 'eco-friendly-utensils'],
    status: 'approved',
  },
  {
    name: '地球公民會館',
    address: '高雄市左營區博愛二路198號9樓',
    description: '推動環境議題的非營利組織，常舉辦講座與活動。',
    position: new GeoPoint(22.6633, 120.3019),
    photoURL: 'https://i.imgur.com/sL2aE3A.jpeg', // Placeholder image
    tags: ['local-farmer'],
    status: 'approved',
  },
];

// --- SCRIPT EXECUTION ---

async function seedDatabase() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Create a batch to perform all writes at once
    const batch = writeBatch(db);

    // Add admin user
    console.log(`Setting up admin user: ${adminData.email}`);
    const adminRef = doc(db, 'admins', adminUID);
    batch.set(adminRef, adminData);

    // Add tags
    console.log('Adding tags...');
    for (const [id, data] of Object.entries(tagsData)) {
      const tagRef = doc(db, 'tags', id);
      batch.set(tagRef, data);
    }

    // Add locations
    console.log('Adding sample locations...');
    for (const location of locationsData) {
      const locationRef = doc(collection(db, 'locations')); // Auto-generate ID
      batch.set(locationRef, location);
    }

    // Commit the batch
    console.log('Committing all changes to the database...');
    await batch.commit();

    console.log('\n✅ Database seeding successful!');
    console.log('All collections (admins, tags, locations) and sample data have been created.');
    console.log('You now have admin privileges.');
    
  } catch (error) {
    console.error('\n❌ Error during database seeding:');
    console.error(error);
    console.log('\nPlease check your Firebase project settings in the .env file and Firestore rules.');
  }
  // Node.js process needs to be explicitly terminated
  process.exit(0);
}

seedDatabase();

