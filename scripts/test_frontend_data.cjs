/**
 * 測試前端資料載入邏輯
 * 模擬 LocationDetailSheet 和 LocationDetailPage 如何處理資料
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function testFrontendData() {
  console.log('=== 測試前端資料載入邏輯 ===\n');

  try {
    const locationId = 'Pu8lq0QjTBW9w4TUjRuU';

    // 1. 模擬前端載入地點資料
    console.log('📍 步驟 1: 載入地點資料...\n');
    const locationDoc = await db.collection('locations').doc(locationId).get();
    const location = { id: locationDoc.id, ...locationDoc.data() };

    console.log(`地點名稱: ${location.name}`);
    console.log(`總登錄次數 (checkInStats.totalCheckIns): ${location.checkInStats?.totalCheckIns || 0}`);
    console.log(`唯一登錄者 (checkInStats.uniqueSubmitters): ${location.checkInStats?.uniqueSubmitters || 0}`);

    // 2. 模擬 useCheckIns hook 載入 check_ins
    console.log('\n📝 步驟 2: 載入 check_ins subcollection...\n');

    // 先載入所有 check_ins，然後在記憶體中過濾和排序
    const checkInsSnapshot = await db.collection('locations')
      .doc(locationId)
      .collection('check_ins')
      .get();

    const checkIns = checkInsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(doc => doc.status === 'approved')
      .sort((a, b) => {
        const aTime = a.submittedAt?.seconds || 0;
        const bTime = b.submittedAt?.seconds || 0;
        return bTime - aTime; // 降序
      });

    console.log(`載入的 check_ins 數量: ${checkIns.length}`);
    checkIns.forEach((checkIn, index) => {
      console.log(`  ${index + 1}. ID: ${checkIn.id}, 提交者: ${checkIn.submitterInfo?.displayName}`);
    });

    // 3. 模擬 LocationDetailSheet 的整合邏輯
    console.log('\n🎯 步驟 3: LocationDetailSheet 整合邏輯...\n');

    const allCheckIns = [
      // 首次登錄
      {
        id: 'first',
        isFirst: true,
        photoURLs: location.firstCheckIn?.photoURLs || location.photoURLs || (location.photoURL ? [location.photoURL] : []),
        description: location.firstCheckIn?.description || location.description || '',
        submitterInfo: location.firstCheckIn?.submitterInfo || location.submitterInfo,
        submittedAt: location.firstCheckIn?.submittedAt || location.submittedAt,
      },
      // 其他登錄記錄
      ...checkIns.map(checkIn => ({
        id: checkIn.id,
        isFirst: false,
        photoURLs: checkIn.photoURLs || [],
        description: checkIn.description || '',
        submitterInfo: checkIn.submitterInfo,
        submittedAt: checkIn.submittedAt,
      }))
    ];

    console.log(`整合後的登錄記錄數量 (allCheckIns): ${allCheckIns.length}`);
    console.log('\n詳細內容:');
    allCheckIns.forEach((checkIn, index) => {
      console.log(`\n═══ 登錄 ${index + 1} (${checkIn.isFirst ? '首次登錄' : '其他登錄'}) ═══`);
      console.log(`ID: ${checkIn.id}`);
      console.log(`提交者: ${checkIn.submitterInfo?.displayName || '未知'}`);
      console.log(`描述: ${checkIn.description?.substring(0, 50) || '無'}${checkIn.description?.length > 50 ? '...' : ''}`);
      console.log(`照片數量: ${checkIn.photoURLs?.length || 0}`);
      console.log(`提交時間: ${checkIn.submittedAt ? new Date(checkIn.submittedAt.toDate()).toLocaleString('zh-TW') : '無'}`);
    });

    // 4. 檢查 LocationDetailPage 顯示邏輯
    console.log('\n\n📄 步驟 4: LocationDetailPage 顯示邏輯...\n');

    const firstCheckIn = location.firstCheckIn || {};
    const stats = location.checkInStats || { totalCheckIns: 1, uniqueSubmitters: 1 };

    console.log('首次登錄區塊:');
    console.log(`  提交者: ${firstCheckIn.submitterInfo?.displayName || '匿名使用者'}`);
    console.log(`  照片數量: ${firstCheckIn.photoURLs?.length || 0}`);
    console.log(`  描述: ${firstCheckIn.description || '無'}`);

    console.log('\n其他登錄記錄區塊:');
    if (checkIns.length > 0) {
      console.log(`  顯示標題: "其他登錄記錄 (${checkIns.length})"`);
      checkIns.forEach((checkIn, index) => {
        console.log(`\n  登錄 ${index + 1}:`);
        console.log(`    提交者: ${checkIn.submitterInfo?.displayName || '匿名使用者'}`);
        console.log(`    照片數量: ${checkIn.photoURLs?.length || 0}`);
        console.log(`    描述: ${checkIn.description || '無'}`);
      });
    } else {
      console.log('  ⚠️ 沒有其他登錄記錄（會顯示 "目前沒有其他登錄記錄"）');
    }

    // 5. 總結
    console.log('\n\n=== 總結 ===');
    console.log(`✅ 地點統計顯示: ${stats.totalCheckIns} 次登錄`);
    console.log(`✅ LocationDetailSheet 可切換顯示: ${allCheckIns.length} 筆登錄`);
    console.log(`✅ LocationDetailPage 顯示: 1 筆首次登錄 + ${checkIns.length} 筆其他登錄`);

    if (allCheckIns.length === stats.totalCheckIns) {
      console.log('\n✅ 資料完整！前端應該可以正確顯示所有登錄記錄');
    } else {
      console.log(`\n⚠️ 警告: allCheckIns (${allCheckIns.length}) 與 totalCheckIns (${stats.totalCheckIns}) 不一致`);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

testFrontendData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
