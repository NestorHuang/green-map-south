import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuditActionLabels } from '../utils/auditLog';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterOperator, setFilterOperator] = useState('');

  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (loadMore = false) => {
    setLoading(true);
    try {
      let logsQuery = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(LOGS_PER_PAGE)
      );

      if (loadMore && lastVisible) {
        logsQuery = query(
          collection(db, 'audit_logs'),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(LOGS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(logsQuery);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (loadMore) {
        setLogs(prev => [...prev, ...logsData]);
      } else {
        setLogs(logsData);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === LOGS_PER_PAGE);
    } catch (err) {
      setError(`無法載入操作記錄: ${err.message}`);
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('delete') || action.includes('reject') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('approve') || action.includes('create') || action.includes('add')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('lock') || action.includes('unlock')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'superAdmin') return 'bg-red-100 text-red-800';
    if (role === 'admin') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    if (role === 'superAdmin') return '超級管理員';
    if (role === 'admin') return '管理員';
    return '使用者';
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterOperator && log.operatorEmail && !log.operatorEmail.includes(filterOperator)) return false;
    return true;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueOperators = [...new Set(logs.map(log => log.operatorEmail).filter(Boolean))];

  if (loading && logs.length === 0) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">操作記錄</h1>
        <p className="text-sm text-gray-600">
          系統會自動記錄所有後台管理操作，記錄僅供查詢，無法修改或刪除。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              操作類型
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {AuditActionLabels[action] || action}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              操作者
            </label>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              {uniqueOperators.map(email => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filterAction || filterOperator) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setFilterAction('');
                setFilterOperator('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              清除篩選
            </button>
          </div>
        )}
      </div>

      {/* 操作記錄列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作對象
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  詳情
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {logs.length === 0 ? '目前沒有操作記錄' : '沒有符合篩選條件的記錄'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp?.toDate().toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                        {log.actionLabel || AuditActionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{log.targetName || '-'}</div>
                      {log.targetType && (
                        <div className="text-xs text-gray-500">
                          {log.targetType}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.operatorEmail || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(log.operatorRole)}`}>
                        {getRoleLabel(log.operatorRole)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.reason && (
                        <div className="mb-1">
                          <span className="font-medium">原因：</span>
                          {log.reason}
                        </div>
                      )}
                      {log.changes && (
                        <div className="text-xs">
                          <details className="cursor-pointer">
                            <summary className="text-indigo-600 hover:text-indigo-800">
                              查看變更
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      {!log.reason && !log.changes && '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 載入更多按鈕 */}
        {hasMore && filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <button
              onClick={() => fetchLogs(true)}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? '載入中...' : '載入更多'}
            </button>
          </div>
        )}

        {/* 統計資訊 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          顯示 {filteredLogs.length} 筆記錄
          {filterAction || filterOperator ? ' (已篩選)' : ''}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
