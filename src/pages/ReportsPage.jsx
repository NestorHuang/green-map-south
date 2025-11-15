import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
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
      // Update UI
      setReports(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(`Failed to resolve report: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">錯誤回報列表</h1>
        <div>
          <button onClick={() => setFilter('new')} className={`px-3 py-1 rounded-l-md ${filter === 'new' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>待處理</button>
          <button onClick={() => setFilter('resolved')} className={`px-3 py-1 rounded-r-md ${filter === 'resolved' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>已解決</button>
        </div>
      </div>
      <div className="space-y-4">
        {reports.length === 0 ? (
          <p>目前沒有{filter === 'new' ? '待處理的' : '已解決的'}回報。</p>
        ) : (
          reports.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-bold">地點: {item.locationName}</h2>
              <p className="text-sm my-2 bg-gray-100 p-2 rounded">“{item.reportText}”</p>
              <p className="text-xs text-gray-500">
                回報時間: {item.reportedAt.toDate().toLocaleString()}
              </p>
              {item.status === 'new' && (
                <div className="mt-4">
                  <button onClick={() => handleResolve(item.id)} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">標示為已解決</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

