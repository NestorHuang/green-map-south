// src/config/iconLibrary.js

export const ICON_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'place', name: '場地' },
  { id: 'life', name: '綠生活' },
  { id: 'eco', name: '環保' },
  { id: 'activity', name: '活動' },
  { id: 'other', name: '其他' },
];

export const ICON_LIBRARY = [
  // 場地
  { id: 'meeting-room', name: '會議室', emoji: '🏢', category: 'place' },
  { id: 'park', name: '公園', emoji: '🌳', category: 'place' },
  { id: 'school', name: '學校', emoji: '🏫', category: 'place' },
  { id: 'outdoor', name: '戶外', emoji: '⛺', category: 'place' },
  { id: 'library', name: '圖書館', emoji: '📚', category: 'place' },
  
  // 綠生活
  { id: 'store', name: '店家', emoji: '🏪', category: 'life' },
  { id: 'restaurant', name: '餐廳', emoji: '🍴', category: 'life' },
  { id: 'cafe', name: '咖啡廳', emoji: '☕', category: 'life' },
  { id: 'farm', name: '農場', emoji: '🧑‍🌾', category: 'life' },
  { id: 'market', name: '市集', emoji: '🧺', category: 'life' },
  
  // 環保
  { id: 'recycle', name: '回收', emoji: '♻️', category: 'eco' },
  { id: 'leaf', name: '綠葉', emoji: '🌿', category: 'eco' },
  { id: 'water', name: '水資源', emoji: '💧', category: 'eco' },
  { id: 'repair', name: '維修', emoji: '🛠️', category: 'eco' },
  
  // 活動
  { id: 'hike', name: '登山', emoji: '⛰️', category: 'activity' },
  { id: 'lecture', name: '演講', emoji: '🗣️', category: 'activity' },
  { id: 'tour', name: '導覽', emoji: '🗺️', category: 'activity' },

  // 其他
  { id: 'info', name: '資訊', emoji: 'ℹ️', category: 'other' },
  { id: 'pin', name: '圖釘', emoji: '📍', category: 'other' },
  { id: 'star', name: '星星', emoji: '⭐', category: 'other' },
];
