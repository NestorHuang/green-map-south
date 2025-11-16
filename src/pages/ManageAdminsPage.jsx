import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebaseConfig';

const ManageAdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [adminStatuses, setAdminStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [syncing, setSyncing] = useState({});

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminsData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsData);

      // Fetch detailed status for each admin
      const functions = getFunctions();
      const getAdminStatus = httpsCallable(functions, 'getAdminStatus');

      const statuses = {};
      for (const admin of adminsData) {
        try {
          const result = await getAdminStatus({ uid: admin.uid });
          statuses[admin.uid] = result.data;
        } catch (err) {
          console.error(`Error fetching status for ${admin.uid}:`, err);
          statuses[admin.uid] = { error: err.message };
        }
      }
      setAdminStatuses(statuses);
    } catch (err) {
      setError('無法載入管理員列表。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) {
      setError('請輸入 Email 地址。');
      return;
    }

    setAddingAdmin(true);
    setError('');

    try {
      const functions = getFunctions();
      const addAdminByEmail = httpsCallable(functions, 'addAdminByEmail');
      await addAdminByEmail({ email: newAdminEmail, role: 'admin' });

      alert(`成功新增管理員：${newAdminEmail}\n該使用者需要登出並重新登入才能獲得權限。`);
      setNewAdminEmail('');
      await fetchAdmins();
    } catch (err) {
      console.error('Error adding admin:', err);
      if (err.code === 'functions/not-found') {
        setError('找不到此 Email 的使用者，請確認該使用者已登入過系統。');
      } else if (err.code === 'functions/already-exists') {
        setError('此使用者已經是管理員。');
      } else if (err.code === 'functions/permission-denied') {
        setError('您沒有權限執行此操作。');
      } else {
        setError(`新增失敗：${err.message}`);
      }
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleSyncClaim = async (uid) => {
    setSyncing(prev => ({ ...prev, [uid]: true }));
    try {
      const functions = getFunctions();
      const syncAdminClaim = httpsCallable(functions, 'syncAdminClaim');
      await syncAdminClaim({ uid });

      alert('Custom Claim 已同步！\n該使用者需要登出並重新登入才能生效。');
      await fetchAdmins(); // Refresh to show updated status
    } catch (err) {
      console.error('Error syncing claim:', err);
      alert(`同步失敗：${err.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleDeleteAdmin = async (uid, email, role) => {
    if (role === 'superAdmin') {
      alert('無法刪除超級管理員帳號。');
      return;
    }

    if (!confirm(`確定要移除管理員「${email}」嗎？\n該使用者需要登出並重新登入後權限才會失效。`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'admins', uid));
      await fetchAdmins();
      alert(`已成功移除管理員：${email}`);
    } catch (err) {
      setError(`刪除失敗：${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">載入管理員列表中...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">管理員帳號管理</h1>

      {/* Add Admin Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">新增一般管理員</h2>
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="輸入使用者的 Email 地址"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={addingAdmin}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 whitespace-nowrap"
          >
            {addingAdmin ? '新增中...' : '新增管理員'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-sm text-gray-500 mt-2">
          <strong>注意：</strong>使用者必須先登入過系統至少一次。新增後該使用者需要登出並重新登入。
        </p>
      </div>

      {/* Admins List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">目前的管理員 ({admins.length})</h2>
        <div className="space-y-3">
          {admins.length === 0 ? (
            <p className="text-gray-500">目前沒有管理員。</p>
          ) : (
            admins.map(admin => {
              const status = adminStatuses[admin.uid];
              const isSynced = status?.isSynced;
              const customClaims = status?.customClaims || {};
              const firestoreRole = admin.role;
              const claimRole = customClaims.role;

              return (
                <div
                  key={admin.uid}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Admin Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-lg">{admin.email}</p>
                        {admin.role === 'superAdmin' && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            超級管理員
                          </span>
                        )}
                        {admin.role === 'admin' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            一般管理員
                          </span>
                        )}
                      </div>

                      {/* Status Display */}
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Firestore 角色:</span>
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {firestoreRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Custom Claim:</span>
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {claimRole || '未設定'}
                          </span>
                          {isSynced ? (
                            <span className="text-green-600 text-xs">✓ 已同步</span>
                          ) : (
                            <span className="text-amber-600 text-xs">⚠ 未同步</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!isSynced && admin.role !== 'superAdmin' && (
                        <button
                          onClick={() => handleSyncClaim(admin.uid)}
                          disabled={syncing[admin.uid]}
                          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-400 text-sm"
                        >
                          {syncing[admin.uid] ? '同步中...' : '同步權限'}
                        </button>
                      )}

                      {admin.role !== 'superAdmin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.uid, admin.email, admin.role)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                          移除
                        </button>
                      )}

                      {admin.role === 'superAdmin' && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
                          無法移除
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Debug Info (collapsible) */}
                  {status && !status.error && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        查看詳細資訊
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
{JSON.stringify({
  uid: admin.uid,
  customClaims,
  firestoreData: { email: admin.email, role: admin.role }
}, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 提示</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>未同步</strong>表示 Custom Claim 尚未設定或與 Firestore 不一致</li>
          <li>• 點擊<strong>「同步權限」</strong>可以手動觸發同步</li>
          <li>• 管理員權限的變更需要該使用者<strong>登出並重新登入</strong>才會生效</li>
          <li>• 超級管理員帳號無法被移除，以確保系統安全</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageAdminsPage;
