/**
 * 檢查地點資料結構
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkLocationStructure() {
  console.log('=== 檢查地點資料結構 ===\n');

  try {
    // 取得第一個中都愛河濕地公園
    const locationDoc = await db.collection('locations')
      .doc('Pu8lq0QjTBW9w4TUjRuU')
      .get();

    if (!locationDoc.exists) {
      console.log('地點不存在');
      return;
    }

    const data = locationDoc.data();
    console.log('地點資料結構:\n');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

checkLocationStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
