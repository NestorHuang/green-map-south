/**
 * 檢查中都愛河濕地公園的詳細資料
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkDetail() {
  console.log('=== 檢查中都愛河濕地公園詳細資料 ===\n');

  try {
    const locationId = 'Pu8lq0QjTBW9w4TUjRuU';

    // 1. 獲取地點資料
    const locationDoc = await db.collection('locations').doc(locationId).get();

    if (!locationDoc.exists) {
      console.log('❌ 地點不存在');
      return;
    }

    const locationData = locationDoc.data();

    console.log('📍 地點資訊:');
    console.log(`名稱: ${locationData.name}`);
    console.log(`ID: ${locationId}`);
    console.log(`狀態: ${locationData.status}`);
    console.log(`地址: ${locationData.address || '無'}`);

    // 統計資訊
    console.log('\n📊 統計資訊:');
    const stats = locationData.checkInStats || {};
    console.log(`總登錄次數: ${stats.totalCheckIns || 0}`);
    console.log(`唯一登錄者: ${stats.uniqueSubmitters || 0}`);
    console.log(`最後登錄: ${stats.lastCheckInAt ? new Date(stats.lastCheckInAt.toDate()).toLocaleString('zh-TW') : '無'}`);

    // 首次登錄資訊
    console.log('\n🎯 首次登錄 (firstCheckIn):');
    if (locationData.firstCheckIn) {
      console.log(`描述: ${locationData.firstCheckIn.description || '無'}`);
      console.log(`照片數量: ${locationData.firstCheckIn.photoURLs?.length || 0}`);
      if (locationData.firstCheckIn.photoURLs?.length > 0) {
        console.log(`照片 URL:`);
        locationData.firstCheckIn.photoURLs.forEach((url, i) => {
          console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
        });
      }
      console.log(`提交者: ${locationData.firstCheckIn.submitterInfo?.displayName || '未知'}`);
      console.log(`提交者 UID: ${locationData.firstCheckIn.submitterInfo?.uid || '無'}`);
      console.log(`提交時間: ${locationData.firstCheckIn.submittedAt ? new Date(locationData.firstCheckIn.submittedAt.toDate()).toLocaleString('zh-TW') : '無'}`);
    } else {
      console.log('無 firstCheckIn 資料');
    }

    // 2. 查詢 check_ins subcollection
    console.log('\n📝 check_ins subcollection:');
    const checkInsSnapshot = await db.collection('locations')
      .doc(locationId)
      .collection('check_ins')
      .orderBy('submittedAt', 'desc')
      .get();

    if (checkInsSnapshot.empty) {
      console.log('❌ 無 check_ins 記錄');
    } else {
      console.log(`✅ 共有 ${checkInsSnapshot.size} 筆 check_ins\n`);
      checkInsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`═══ 登錄 ${index + 1} ═══`);
        console.log(`ID: ${doc.id}`);
        console.log(`狀態: ${data.status}`);
        console.log(`描述: ${data.description || '無'}`);
        console.log(`照片數量: ${data.photoURLs?.length || 0}`);
        if (data.photoURLs?.length > 0) {
          console.log(`照片 URL:`);
          data.photoURLs.forEach((url, i) => {
            console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
          });
        }
        console.log(`提交者: ${data.submitterInfo?.displayName || '未知'}`);
        console.log(`提交者 UID: ${data.submitterInfo?.uid || '無'}`);
        console.log(`提交時間: ${data.submittedAt ? new Date(data.submittedAt.toDate()).toLocaleString('zh-TW') : '無'}`);
        console.log(`核准時間: ${data.approvedAt ? new Date(data.approvedAt.toDate()).toLocaleString('zh-TW') : '未核准'}`);
        console.log(`核准者: ${data.approvedBy || '無'}`);
        console.log(`鎖定: ${data.locked ? '是' : '否'}`);
        console.log('');
      });
    }

    // 3. 查詢待審核的登錄
    console.log('⏳ 待審核登錄 (pending_check_ins):');
    const pendingCheckInsSnapshot = await db.collection('pending_check_ins')
      .where('locationId', '==', locationId)
      .get();

    if (pendingCheckInsSnapshot.empty) {
      console.log('無待審核登錄');
    } else {
      console.log(`共有 ${pendingCheckInsSnapshot.size} 筆待審核\n`);
      pendingCheckInsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`═══ 待審核 ${index + 1} ═══`);
        console.log(`ID: ${doc.id}`);
        console.log(`狀態: ${data.status}`);
        console.log(`描述: ${data.description || '無'}`);
        console.log(`照片數量: ${data.photoURLs?.length || 0}`);
        console.log(`提交者: ${data.submitterInfo?.displayName || '未知'}`);
        console.log(`提交時間: ${data.submittedAt ? new Date(data.submittedAt.toDate()).toLocaleString('zh-TW') : '無'}`);
        console.log('');
      });
    }

    console.log('✅ 檢查完成');

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

checkDetail()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
