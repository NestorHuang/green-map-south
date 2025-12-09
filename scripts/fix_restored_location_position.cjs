/**
 * 修正已還原地點的座標
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixRestoredLocationPosition() {
  console.log('=== 修正已還原地點的座標 ===\n');

  try {
    // 獲取已還原的地點
    const restoredLocationId = 'd4aROj8TPIyYIEDKW3OT';
    const restoredDoc = await db.collection('locations').doc(restoredLocationId).get();

    if (!restoredDoc.exists) {
      console.log('❌ 地點不存在');
      return;
    }

    const restoredData = restoredDoc.data();
    console.log(`地點名稱: ${restoredData.name}`);
    console.log(`提交者: ${restoredData.submitterInfo?.displayName || '未知'}`);

    // 檢查是否已有座標
    if (restoredData.position) {
      console.log('✅ 此地點已有座標，無需修正');
      console.log(`   座標: (${restoredData.position._latitude}, ${restoredData.position._longitude})`);
      return;
    }

    // 從原始地點獲取座標
    const originalLocationId = restoredData.restoredFrom;
    if (!originalLocationId) {
      console.log('❌ 找不到原始地點 ID');
      return;
    }

    console.log(`\n從原始地點獲取座標: ${originalLocationId}`);

    const originalDoc = await db.collection('locations').doc(originalLocationId).get();
    if (!originalDoc.exists) {
      console.log('❌ 原始地點不存在');
      return;
    }

    const originalData = originalDoc.data();
    if (!originalData.position) {
      console.log('❌ 原始地點也沒有座標');
      return;
    }

    console.log(`原始地點座標: (${originalData.position._latitude}, ${originalData.position._longitude})`);

    // 更新還原地點的座標
    await db.collection('locations').doc(restoredLocationId).update({
      position: originalData.position,
      updatedAt: Timestamp.now()
    });

    console.log('\n✅ 座標已成功添加到還原的地點！');

    // 驗證更新
    const updatedDoc = await db.collection('locations').doc(restoredLocationId).get();
    const updatedData = updatedDoc.data();
    console.log(`\n驗證更新後的座標: (${updatedData.position._latitude}, ${updatedData.position._longitude})`);

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

fixRestoredLocationPosition()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
