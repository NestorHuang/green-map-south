import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [expandedLocations, setExpandedLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('new'); // 'new' or 'resolved'

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', filter));
      const querySnapshot = await getDocs(reportsQuery);
      const reportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);

      // Group reports by locationId
      const grouped = reportsData.reduce((acc, report) => {
        const locationId = report.locationId || 'unknown';
        if (!acc[locationId]) {
          acc[locationId] = {
            locationName: report.locationName || '未知地點',
            reports: []
          };
        }
        acc[locationId].reports.push(report);
        return acc;
      }, {});

      setGroupedReports(grouped);
    } catch (err) {
      setError('Failed to fetch reports.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (id) => {
    try {
      const reportDocRef = doc(db, 'reports', id);
      await updateDoc(reportDocRef, {
        status: 'resolved',
        resolvedAt: new Date(),
      });
      // Refresh reports
      await fetchReports();
    } catch (err) {
      setError(`Failed to resolve report: ${err.message}`);
      console.error(err);
    }
  };

  const toggleLocationExpansion = (locationId) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  if (loading) return <div className="p-8">載入回報中...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  const locationIds = Object.keys(groupedReports);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">錯誤回報列表</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-l-md font-medium transition-colors ${
              filter === 'new'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            待處理
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-r-md font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            已解決
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {locationIds.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">目前沒有{filter === 'new' ? '待處理的' : '已解決的'}回報。</p>
          </div>
        ) : (
          locationIds.map(locationId => {
            const locationGroup = groupedReports[locationId];
            const reportCount = locationGroup.reports.length;
            const isExpanded = expandedLocations[locationId];

            return (
              <div key={locationId} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Location Header */}
                <div
                  className="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleLocationExpansion(locationId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">
                        {locationGroup.locationName}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reportCount > 1
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reportCount} 個回報
                      </span>
                    </div>
                    <svg
                      className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Reports List (Expandable) */}
                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {locationGroup.reports.map((report, index) => (
                      <div key={report.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            回報 #{index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {report.reportedAt?.toDate().toLocaleString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-sm text-gray-800">{report.reportText}</p>
                        </div>
                        {report.status === 'new' && (
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            標示為已解決
                          </button>
                        )}
                        {report.status === 'resolved' && report.resolvedAt && (
                          <span className="text-xs text-green-600">
                            ✓ 已於 {report.resolvedAt.toDate().toLocaleString('zh-TW')} 解決
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {locationIds.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            共 <strong>{locationIds.length}</strong> 個地點，
            <strong>{reports.length}</strong> 個回報
            {Object.values(groupedReports).filter(g => g.reports.length > 1).length > 0 && (
              <span>
                （其中 <strong className="text-red-600">
                  {Object.values(groupedReports).filter(g => g.reports.length > 1).length}
                </strong> 個地點有多個回報）
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

