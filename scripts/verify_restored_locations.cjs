/**
 * 驗證還原後的地點是否正確存在
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function verifyRestoredLocations() {
  console.log('=== 驗證還原後的地點 ===\n');

  try {
    // 檢查兩個已知的地點 ID
    const locationIds = [
      'Pu8lq0QjTBW9w4TUjRuU',  // 獅子兔的提交
      'd4aROj8TPIyYIEDKW3OT'   // 黃42巷的提交（已還原）
    ];

    for (const locationId of locationIds) {
      console.log(`\n--- 檢查地點: ${locationId} ---`);

      const locationDoc = await db.collection('locations').doc(locationId).get();

      if (!locationDoc.exists) {
        console.log('❌ 地點不存在');
        continue;
      }

      const data = locationDoc.data();
      console.log(`✓ 地點名稱: ${data.name}`);
      console.log(`✓ 地址: ${data.address}`);
      console.log(`✓ 狀態: ${data.status}`);
      console.log(`✓ 提交者: ${data.submitterInfo?.displayName || '未知'}`);
      console.log(`✓ 照片數量: ${data.photoURLs?.length || 0}`);
      console.log(`✓ 描述: ${data.description?.substring(0, 50) || '無'}`);

      if (data.restoredFrom) {
        console.log(`✓ 還原自: ${data.restoredFrom}`);
        console.log(`✓ 還原時間: ${data.restoredAt?.toDate()}`);
      }

      // 檢查是否還有 check_ins 子集合
      const checkInsSnapshot = await db.collection('locations')
        .doc(locationId)
        .collection('check_ins')
        .get();

      console.log(`✓ check_ins 子集合數量: ${checkInsSnapshot.size}`);

      if (checkInsSnapshot.size > 0) {
        console.log('\n  check_ins 內容:');
        checkInsSnapshot.forEach(doc => {
          const checkIn = doc.data();
          console.log(`    - ${doc.id}: ${checkIn.submitterInfo?.displayName || '未知'}`);
        });
      }
    }

    // 搜尋所有包含「中都」的地點
    console.log('\n\n=== 搜尋所有包含「中都」的地點 ===\n');
    const allLocationsSnapshot = await db.collection('locations')
      .where('status', '==', 'approved')
      .get();

    const zhongduLocations = allLocationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.name?.includes('中都');
    });

    console.log(`找到 ${zhongduLocations.length} 個包含「中都」的地點:\n`);
    zhongduLocations.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}`);
      console.log(`  名稱: ${data.name}`);
      console.log(`  提交者: ${data.submitterInfo?.displayName || '未知'}`);
      console.log(`  照片數: ${data.photoURLs?.length || 0}`);
      console.log(`  描述: ${data.description?.substring(0, 30) || '無'}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

verifyRestoredLocations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
