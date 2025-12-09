const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function verifyMerge() {
  try {
    const locationId = 'Pu8lq0QjTBW9w4TUjRuU';

    console.log('=== 驗證合併結果 ===\n');

    // 1. 檢查主要地點
    const locationDoc = await db.collection('locations').doc(locationId).get();
    if (locationDoc.exists) {
      const data = locationDoc.data();
      console.log('主要地點:', data.name);
      console.log('   ID:', locationId);
      console.log('   地址:', data.address);
      console.log('   firstCheckIn 存在:', !!data.firstCheckIn);
      console.log('   登錄統計:', data.checkInStats);
      console.log('');
    }

    // 2. 檢查 check_ins 子集合
    const checkInsSnapshot = await db.collection('locations').doc(locationId).collection('check_ins').get();
    console.log('登錄記錄數量:', checkInsSnapshot.size);
    console.log('');

    let index = 0;
    checkInsSnapshot.forEach(doc => {
      index++;
      const data = doc.data();
      console.log('  登錄', index, '- ID:', doc.id);
      console.log('       狀態:', data.status);
      console.log('       照片數:', data.photoURLs?.length || 0);
      console.log('       提交者:', data.submitterInfo?.displayName || '未知');
      console.log('');
    });

    // 3. 確認舊地點已刪除
    const oldLocationDoc = await db.collection('locations').doc('0ZZEfttH2eYc2iz7rjJf').get();
    console.log('舊地點 0ZZEfttH2eYc2iz7rjJf 已刪除:', !oldLocationDoc.exists);

  } catch (error) {
    console.error('錯誤:', error);
  } finally {
    process.exit(0);
  }
}

verifyMerge();
