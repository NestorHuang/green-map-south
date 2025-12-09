/**
 * 檢查第二個中都地點的完整資料
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkSecondZhongdu() {
  console.log('=== 檢查第二個中都地點 ===\n');

  try {
    const locationDoc = await db.collection('locations')
      .doc('d4aROj8TPIyYIEDKW3OT')
      .get();

    if (!locationDoc.exists) {
      console.log('地點不存在');
      return;
    }

    const data = locationDoc.data();
    console.log('地點資料:\n');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n\n--- 分析 ---');
    console.log(`是否有 position 欄位: ${data.position ? 'Yes' : 'No'}`);
    console.log(`是否有 location 欄位: ${data.location ? 'Yes' : 'No'}`);

    if (data.restoredFrom) {
      console.log('\n此地點是從合併狀態還原的');
      console.log(`原始地點 ID: ${data.restoredFrom}`);

      // 檢查原始地點的座標
      const originalDoc = await db.collection('locations')
        .doc(data.restoredFrom)
        .get();

      if (originalDoc.exists) {
        const originalData = originalDoc.data();
        console.log('\n原始地點的座標資訊:');
        console.log(`position: ${JSON.stringify(originalData.position)}`);
        console.log(`location: ${JSON.stringify(originalData.location)}`);
      }
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

checkSecondZhongdu()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
