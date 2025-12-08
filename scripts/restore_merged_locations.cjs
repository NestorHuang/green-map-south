/**
 * 還原合併的地點
 * 將 check_ins 轉回獨立的 locations
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function restoreMergedLocation(locationId) {
  console.log(`\n=== 還原地點: ${locationId} ===\n`);

  try {
    // 1. 獲取主要地點資料
    const locationDoc = await db.collection('locations').doc(locationId).get();

    if (!locationDoc.exists) {
      console.log('❌ 地點不存在');
      return;
    }

    const locationData = locationDoc.data();
    console.log(`地點名稱: ${locationData.name}`);
    console.log(`總登錄次數: ${locationData.checkInStats?.totalCheckIns || 0}`);

    // 2. 獲取所有 check_ins
    const checkInsSnapshot = await db.collection('locations')
      .doc(locationId)
      .collection('check_ins')
      .get();

    if (checkInsSnapshot.empty) {
      console.log('✅ 沒有需要還原的 check_ins');
      return;
    }

    console.log(`\n找到 ${checkInsSnapshot.size} 個 check_ins 需要還原\n`);

    // 3. 將每個 check_in 轉回獨立的 location
    let restoredCount = 0;
    for (const checkInDoc of checkInsSnapshot.docs) {
      const checkInData = checkInDoc.data();

      // 檢查是否是 system_merge 合併的
      if (checkInData.approvedBy !== 'system_merge') {
        console.log(`⚠️  跳過 ${checkInDoc.id}: 不是由 system_merge 創建的`);
        continue;
      }

      console.log(`\n還原 check_in: ${checkInDoc.id}`);
      console.log(`  提交者: ${checkInData.submitterInfo?.displayName || '未知'}`);

      // 創建新的獨立 location
      const newLocation = {
        name: locationData.name,
        address: locationData.address || '',
        typeId: locationData.typeId,
        description: checkInData.description || '',
        photoURL: checkInData.photoURL || '',
        photoURLs: checkInData.photoURLs || [],
        tags: checkInData.tags || [],
        dynamicFields: checkInData.dynamicFields || {},
        submitterInfo: checkInData.submitterInfo || {},
        status: 'approved',
        submittedAt: checkInData.submittedAt || Timestamp.now(),
        approvedAt: checkInData.approvedAt || Timestamp.now(),
        approvedBy: 'system_restore',
        locked: false,
        createdAt: checkInData.submittedAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
        // 標記為還原的
        restoredFrom: locationId,
        restoredAt: Timestamp.now()
      };

      // 只在 location 有值時才添加
      if (locationData.location) {
        newLocation.location = locationData.location;
      }

      // 複製座標資訊
      if (locationData.position) {
        newLocation.position = locationData.position;
      }

      // 新增到 locations 集合
      const newLocationRef = await db.collection('locations').add(newLocation);
      console.log(`  ✓ 已創建新地點: ${newLocationRef.id}`);

      // 刪除 check_in
      await checkInDoc.ref.delete();
      console.log(`  ✓ 已刪除 check_in: ${checkInDoc.id}`);

      restoredCount++;
    }

    // 4. 更新原地點的統計
    const remainingCheckIns = await db.collection('locations')
      .doc(locationId)
      .collection('check_ins')
      .get();

    await db.collection('locations').doc(locationId).update({
      'checkInStats.totalCheckIns': 1 + remainingCheckIns.size,
      'checkInStats.uniqueSubmitters': 1 + remainingCheckIns.size, // 簡化計算
      updatedAt: Timestamp.now()
    });

    console.log(`\n✅ 還原完成！`);
    console.log(`   還原了 ${restoredCount} 個地點`);

  } catch (error) {
    console.error('❌ 還原失敗:', error);
  }
}

async function restoreAllMergedLocations() {
  console.log('=== 開始還原所有合併的地點 ===\n');

  try {
    // 查找所有有 check_ins 的地點
    const locationsSnapshot = await db.collection('locations')
      .where('checkInStats.totalCheckIns', '>', 1)
      .get();

    if (locationsSnapshot.empty) {
      console.log('沒有找到需要還原的地點');
      return;
    }

    console.log(`找到 ${locationsSnapshot.size} 個可能需要還原的地點\n`);

    for (const locationDoc of locationsSnapshot.docs) {
      await restoreMergedLocation(locationDoc.id);
    }

    console.log('\n✅ 所有地點還原完成！');

  } catch (error) {
    console.error('錯誤:', error);
  }
}

// 使用方式
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === '--location-id') {
  // 還原特定地點
  const locationId = args[1];
  if (!locationId) {
    console.error('請提供地點 ID');
    console.error('使用方式: node restore_merged_locations.cjs --location-id <LOCATION_ID>');
    process.exit(1);
  }
  restoreMergedLocation(locationId)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else {
  // 還原所有地點
  restoreAllMergedLocations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
