/**
 * 資料遷移腳本：將現有地點資料遷移到多重登錄架構
 *
 * 執行方式：node scripts/migrate_to_checkins.cjs
 *
 * 功能：
 * 1. 將 description, photoURLs, tags, dynamicFields 遷移到 firstCheckIn
 * 2. 新增 checkInStats 統計資訊
 * 3. 保留原欄位以確保向下兼容
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('../green-map-south-firebase-adminsdk-4rw45-e23c866f54.json');

// 初始化 Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * 遷移單一地點
 */
async function migrateLocation(locationDoc) {
  const data = locationDoc.data();
  const locationId = locationDoc.id;

  // 跳過已遷移的地點
  if (data.firstCheckIn) {
    console.log(`⏩ 跳過已遷移：${data.name} (${locationId})`);
    return { skipped: true };
  }

  // 建構 firstCheckIn 物件
  const firstCheckIn = {
    description: data.description || '',
    photoURLs: data.photoURLs || [],
    photoURL: data.photoURL || '',
    tags: data.tags || [],
    dynamicFields: data.dynamicFields || {},
    submitterInfo: data.submitterInfo || {
      uid: data.createdBy || 'unknown',
      email: '',
      displayName: '未知使用者',
      isWildernessPartner: false,
      groupName: '',
      naturalName: ''
    },
    submittedAt: data.submittedAt || data.createdAt || Timestamp.now()
  };

  // 建構 checkInStats 物件
  const checkInStats = {
    totalCheckIns: 1,
    uniqueSubmitters: 1,
    lastCheckInAt: firstCheckIn.submittedAt
  };

  // 更新地點文檔
  try {
    await locationDoc.ref.update({
      firstCheckIn,
      checkInStats,
      updatedAt: Timestamp.now(),
      updatedBy: 'migration_script'
    });

    console.log(`✅ 成功遷移：${data.name} (${locationId})`);
    return { success: true };
  } catch (error) {
    console.error(`❌ 遷移失敗：${data.name} (${locationId})`, error.message);
    return { error: true, message: error.message };
  }
}

/**
 * 主要遷移流程
 */
async function migrate() {
  console.log('🚀 開始遷移地點資料...\n');

  const locationsRef = db.collection('locations');
  const snapshot = await locationsRef.get();

  if (snapshot.empty) {
    console.log('⚠️  沒有地點需要遷移');
    return;
  }

  console.log(`📊 找到 ${snapshot.size} 個地點\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  // 分批處理（每批 100 個）
  const batchSize = 100;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`\n處理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(docs.length / batchSize)} (${batch.length} 個地點)`);

    // 並行處理批次內的文檔
    const results = await Promise.all(batch.map(migrateLocation));

    // 統計結果
    results.forEach((result, index) => {
      if (result.success) successCount++;
      else if (result.skipped) skippedCount++;
      else if (result.error) {
        errorCount++;
        errors.push({
          locationId: batch[index].id,
          name: batch[index].data().name,
          error: result.message
        });
      }
    });
  }

  // 顯示摘要
  console.log('\n' + '='.repeat(50));
  console.log('📈 遷移摘要');
  console.log('='.repeat(50));
  console.log(`✅ 成功遷移：${successCount} 個`);
  console.log(`⏩ 已遷移（跳過）：${skippedCount} 個`);
  console.log(`❌ 失敗：${errorCount} 個`);
  console.log(`📊 總計：${snapshot.size} 個`);

  if (errors.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ 錯誤詳情');
    console.log('='.repeat(50));
    errors.forEach(({ locationId, name, error }) => {
      console.log(`\n地點：${name} (${locationId})`);
      console.log(`錯誤：${error}`);
    });
  }

  console.log('\n✨ 遷移完成！\n');
}

/**
 * 驗證遷移結果
 */
async function verify() {
  console.log('🔍 驗證遷移結果...\n');

  const locationsRef = db.collection('locations');
  const snapshot = await locationsRef.get();

  let migratedCount = 0;
  let notMigratedCount = 0;
  const notMigrated = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.firstCheckIn && data.checkInStats) {
      migratedCount++;
    } else {
      notMigratedCount++;
      notMigrated.push({
        id: doc.id,
        name: data.name
      });
    }
  });

  console.log('='.repeat(50));
  console.log('📊 驗證結果');
  console.log('='.repeat(50));
  console.log(`✅ 已遷移：${migratedCount} 個`);
  console.log(`⚠️  未遷移：${notMigratedCount} 個`);
  console.log(`📊 總計：${snapshot.size} 個`);

  if (notMigrated.length > 0) {
    console.log('\n未遷移的地點：');
    notMigrated.forEach(({ id, name }) => {
      console.log(`  - ${name} (${id})`);
    });
  }

  console.log('\n✨ 驗證完成！\n');
}

/**
 * 回滾遷移（移除 firstCheckIn 和 checkInStats）
 */
async function rollback() {
  console.log('⚠️  開始回滾遷移...\n');
  console.log('⚠️  注意：這將移除所有 firstCheckIn 和 checkInStats 欄位\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    readline.question('確定要繼續嗎？(yes/no): ', resolve);
  });
  readline.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ 取消回滾');
    return;
  }

  const locationsRef = db.collection('locations');
  const snapshot = await locationsRef.get();

  console.log(`\n找到 ${snapshot.size} 個地點\n`);

  let count = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      firstCheckIn: FieldValue.delete(),
      checkInStats: FieldValue.delete(),
      updatedAt: Timestamp.now(),
      updatedBy: 'rollback_script'
    });
    count++;
  });

  await batch.commit();

  console.log(`✅ 回滾完成：${count} 個地點\n`);
}

// CLI 介面
const command = process.argv[2] || 'migrate';

(async () => {
  try {
    switch (command) {
      case 'migrate':
        await migrate();
        break;
      case 'verify':
        await verify();
        break;
      case 'rollback':
        await rollback();
        break;
      default:
        console.log('用法：');
        console.log('  node scripts/migrate_to_checkins.cjs migrate   # 執行遷移');
        console.log('  node scripts/migrate_to_checkins.cjs verify    # 驗證遷移結果');
        console.log('  node scripts/migrate_to_checkins.cjs rollback  # 回滾遷移');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    process.exit(1);
  }
})();
