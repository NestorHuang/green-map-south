/**
 * 搜尋包含「中都」的地點
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function searchZhongdu() {
  console.log('=== 搜尋包含「中都」的地點 ===\n');

  try {
    // 搜尋 locations 集合
    console.log('📍 搜尋 locations 集合...\n');
    const locationsSnapshot = await db.collection('locations').get();

    let foundInLocations = false;
    locationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.includes('中都')) {
        foundInLocations = true;
        console.log(`找到: ${data.name}`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  狀態: ${data.status}`);
        console.log(`  地址: ${data.address || '無'}`);
        console.log(`  總登錄: ${data.checkInStats?.totalCheckIns || 0}`);
        console.log('');
      }
    });

    if (!foundInLocations) {
      console.log('❌ locations 中找不到包含「中都」的地點\n');
    }

    // 搜尋 pending_locations 集合
    console.log('⏳ 搜尋 pending_locations 集合...\n');
    const pendingSnapshot = await db.collection('pending_locations').get();

    let foundInPending = false;
    pendingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.includes('中都')) {
        foundInPending = true;
        console.log(`找到: ${data.name}`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  狀態: ${data.status}`);
        console.log(`  地址: ${data.address || '無'}`);
        console.log('');
      }
    });

    if (!foundInPending) {
      console.log('❌ pending_locations 中找不到包含「中都」的地點\n');
    }

    // 列出所有已核准的地點（前20個）
    console.log('📋 列出前 20 個已核准的地點:\n');
    const approvedSnapshot = await db.collection('locations')
      .where('status', '==', 'approved')
      .limit(20)
      .get();

    approvedSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.name} (ID: ${doc.id})`);
      console.log(`   地址: ${data.address || '無'}`);
      console.log(`   登錄次數: ${data.checkInStats?.totalCheckIns || 0}`);
      console.log('');
    });

    console.log('✅ 搜尋完成');

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

searchZhongdu()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
