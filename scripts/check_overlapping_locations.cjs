/**
 * 檢查重疊的地點（座標相同或非常接近）
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper function to check if two coordinates are close
const areCoordinatesClose = (lat1, lng1, lat2, lng2, threshold = 0.0001) => {
  return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
};

async function checkOverlappingLocations() {
  console.log('=== 檢查重疊的地點 ===\n');

  try {
    // 獲取所有 approved 的地點
    const locationsSnapshot = await db.collection('locations')
      .where('status', '==', 'approved')
      .get();

    const locations = locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`總共 ${locations.size} 個已核准的地點\n`);

    // 找出重疊的地點
    const overlappingGroups = [];
    const processed = new Set();

    for (let i = 0; i < locations.length; i++) {
      if (processed.has(locations[i].id)) continue;

      const loc1 = locations[i];
      const lat1 = loc1.position?._lat || loc1.position?._latitude;
      const lng1 = loc1.position?._long || loc1.position?._longitude;

      if (typeof lat1 !== 'number' || typeof lng1 !== 'number') {
        console.log(`⚠️  ${loc1.id} (${loc1.name}) - 沒有有效的座標`);
        continue;
      }

      const group = [loc1];
      processed.add(loc1.id);

      // 尋找與此地點座標相近的其他地點
      for (let j = i + 1; j < locations.length; j++) {
        if (processed.has(locations[j].id)) continue;

        const loc2 = locations[j];
        const lat2 = loc2.position?._lat || loc2.position?._latitude;
        const lng2 = loc2.position?._long || loc2.position?._longitude;

        if (typeof lat2 !== 'number' || typeof lng2 !== 'number') continue;

        if (areCoordinatesClose(lat1, lng1, lat2, lng2)) {
          group.push(loc2);
          processed.add(loc2.id);
        }
      }

      if (group.length > 1) {
        overlappingGroups.push(group);
      }
    }

    // 顯示結果
    if (overlappingGroups.length === 0) {
      console.log('✅ 沒有發現重疊的地點');
    } else {
      console.log(`🔍 發現 ${overlappingGroups.length} 組重疊的地點:\n`);

      overlappingGroups.forEach((group, index) => {
        console.log(`--- 組 ${index + 1}: ${group.length} 個地點在相同位置 ---`);

        const firstLoc = group[0];
        const lat = firstLoc.position?._lat || firstLoc.position?._latitude;
        const lng = firstLoc.position?._long || firstLoc.position?._longitude;
        console.log(`座標: (${lat}, ${lng})\n`);

        group.forEach((loc, i) => {
          console.log(`  ${i + 1}. ${loc.name}`);
          console.log(`     ID: ${loc.id}`);
          console.log(`     提交者: ${loc.submitterInfo?.displayName || '未知'}`);
          console.log(`     照片數: ${loc.photoURLs?.length || 0}`);
          console.log(`     描述: ${loc.description?.substring(0, 50) || '無'}...`);
          console.log('');
        });
      });
    }

    // 特別檢查中都愛河濕地公園
    console.log('\n=== 特別檢查：中都愛河濕地公園 ===\n');
    const zhongduLocations = locations.filter(loc => loc.name?.includes('中都愛河濕地公園'));

    if (zhongduLocations.length === 0) {
      console.log('沒有找到中都愛河濕地公園');
    } else {
      console.log(`找到 ${zhongduLocations.length} 個「中都愛河濕地公園」:\n`);

      zhongduLocations.forEach((loc, i) => {
        const lat = loc.position?._lat || loc.position?._latitude;
        const lng = loc.position?._long || loc.position?._longitude;
        console.log(`${i + 1}. ID: ${loc.id}`);
        console.log(`   座標: (${lat}, ${lng})`);
        console.log(`   提交者: ${loc.submitterInfo?.displayName || '未知'}`);
        console.log(`   照片數: ${loc.photoURLs?.length || 0}`);
        console.log('');
      });

      // 檢查它們的座標是否相同
      if (zhongduLocations.length >= 2) {
        const loc1 = zhongduLocations[0];
        const loc2 = zhongduLocations[1];

        const lat1 = loc1.position?._lat || loc1.position?._latitude;
        const lng1 = loc1.position?._long || loc1.position?._longitude;
        const lat2 = loc2.position?._lat || loc2.position?._latitude;
        const lng2 = loc2.position?._long || loc2.position?._longitude;

        if (areCoordinatesClose(lat1, lng1, lat2, lng2)) {
          console.log('✅ 兩個地點的座標相同或非常接近，會被識別為重疊地點');
        } else {
          console.log('❌ 兩個地點的座標不同：');
          console.log(`   地點1: (${lat1}, ${lng1})`);
          console.log(`   地點2: (${lat2}, ${lng2})`);
          console.log(`   距離差: lat=${Math.abs(lat1 - lat2)}, lng=${Math.abs(lng1 - lng2)}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

checkOverlappingLocations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
