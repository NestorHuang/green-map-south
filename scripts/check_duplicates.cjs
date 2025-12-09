const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkDuplicates() {
  try {
    const locationsRef = db.collection('locations');
    const snapshot = await locationsRef.where('status', '==', 'approved').get();

    const locationsByKey = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const key = data.name + '|||' + data.address;

      if (!locationsByKey[key]) {
        locationsByKey[key] = [];
      }

      locationsByKey[key].push({
        id: doc.id,
        name: data.name,
        address: data.address,
        typeId: data.typeId,
        hasFirstCheckIn: !!data.firstCheckIn,
        checkInStats: data.checkInStats
      });
    });

    console.log('=== 重複的地點（相同名稱和地址）===\n');
    let foundDuplicates = false;

    for (const key in locationsByKey) {
      const locations = locationsByKey[key];
      if (locations.length > 1) {
        foundDuplicates = true;
        const parts = key.split('|||');
        const name = parts[0];
        const address = parts[1];
        console.log('地點:', name);
        console.log('地址:', address);
        console.log('共有', locations.length, '筆重複資料：\n');

        locations.forEach((loc, index) => {
          console.log('  [' + (index + 1) + '] ID:', loc.id);
          console.log('      類型:', loc.typeId);
          console.log('      firstCheckIn:', loc.hasFirstCheckIn ? '有' : '無');
          console.log('      登錄次數:', loc.checkInStats?.totalCheckIns || 1);
          console.log('');
        });
        console.log('---\n');
      }
    }

    if (!foundDuplicates) {
      console.log('沒有發現重複的地點');
    }

  } catch (error) {
    console.error('錯誤:', error);
  } finally {
    process.exit(0);
  }
}

checkDuplicates();
