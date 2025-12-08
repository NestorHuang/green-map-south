/**
 * 合併重複地點腳本
 * 將相同名稱和地址的地點合併成一個地點 + 多個 check_ins
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function mergeDuplicateLocations(locationIds) {
  try {
    console.log(`準備合併 ${locationIds.length} 個重複地點...`);

    // 1. 載入所有地點資料
    const locations = [];
    for (const id of locationIds) {
      const doc = await db.collection('locations').doc(id).get();
      if (doc.exists) {
        locations.push({ id: doc.id, ...doc.data() });
      }
    }

    if (locations.length < 2) {
      console.log('沒有足夠的地點需要合併');
      return;
    }

    console.log(`找到 ${locations.length} 個地點：`);
    locations.forEach((loc, index) => {
      console.log(`  [${index + 1}] ${loc.name} (${loc.id})`);
    });

    // 2. 選擇主要地點（選第一個，或選擇最早創建的）
    const primaryLocation = locations.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    })[0];

    console.log(`\n主要地點: ${primaryLocation.id}`);

    // 3. 將主要地點的資料遷移到 firstCheckIn
    const firstCheckIn = {
      description: primaryLocation.description || '',
      photoURLs: primaryLocation.photoURLs || [],
      photoURL: primaryLocation.photoURL || '',
      tags: primaryLocation.tags || [],
      dynamicFields: primaryLocation.dynamicFields || {},
      submitterInfo: primaryLocation.submitterInfo || {},
      submittedAt: primaryLocation.submittedAt || primaryLocation.createdAt || Timestamp.now()
    };

    // 4. 更新主要地點
    await db.collection('locations').doc(primaryLocation.id).update({
      firstCheckIn,
      checkInStats: {
        totalCheckIns: locations.length,
        uniqueSubmitters: new Set(locations.map(l => l.submitterInfo?.uid).filter(Boolean)).size,
        lastCheckInAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });

    console.log(`✓ 主要地點已更新 firstCheckIn`);

    // 5. 將其他地點轉為 check_ins
    for (let i = 1; i < locations.length; i++) {
      const location = locations[i];

      const checkIn = {
        description: location.description || '',
        photoURLs: location.photoURLs || [],
        photoURL: location.photoURL || '',
        tags: location.tags || [],
        dynamicFields: location.dynamicFields || {},
        submitterInfo: location.submitterInfo || {},
        status: 'approved',
        submittedAt: location.submittedAt || location.createdAt || Timestamp.now(),
        approvedAt: location.approvedAt || Timestamp.now(),
        approvedBy: 'system_merge',
        locked: false
      };

      // 建立 check_in
      const checkInRef = db.collection('locations').doc(primaryLocation.id).collection('check_ins').doc();
      await checkInRef.set(checkIn);

      console.log(`✓ 地點 ${location.id} 已轉為登錄記錄 ${checkInRef.id}`);

      // 刪除原地點
      await db.collection('locations').doc(location.id).delete();
      console.log(`✓ 已刪除重複地點 ${location.id}`);
    }

    console.log(`\n✅ 合併完成！`);
    console.log(`   主要地點: ${primaryLocation.id}`);
    console.log(`   總登錄次數: ${locations.length}`);

  } catch (error) {
    console.error('合併失敗:', error);
  }
}

async function findAndMergeDuplicates() {
  try {
    const snapshot = await db.collection('locations').where('status', '==', 'approved').get();

    const locationsByKey = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const key = data.name + '|||' + data.address;

      if (!locationsByKey[key]) {
        locationsByKey[key] = [];
      }

      locationsByKey[key].push(doc.id);
    });

    console.log('=== 開始自動合併重複地點 ===\n');
    let mergedCount = 0;

    for (const key in locationsByKey) {
      const ids = locationsByKey[key];
      if (ids.length > 1) {
        const parts = key.split('|||');
        const name = parts[0];
        console.log(`\n發現重複: ${name}`);
        console.log(`共 ${ids.length} 筆，開始合併...\n`);

        await mergeDuplicateLocations(ids);
        mergedCount++;
      }
    }

    if (mergedCount === 0) {
      console.log('沒有發現需要合併的重複地點');
    } else {
      console.log(`\n✅ 總共合併了 ${mergedCount} 組重複地點`);
    }

  } catch (error) {
    console.error('錯誤:', error);
  } finally {
    process.exit(0);
  }
}

// 執行
findAndMergeDuplicates();
