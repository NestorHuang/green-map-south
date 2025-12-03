import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useSuperAdmin } from '../hooks/useSuperAdmin';

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isSuperAdmin } = useSuperAdmin();

  const SidebarContent = () => (
    <>
      <h1 className="text-2xl font-bold mb-6">管理後台</h1>
      <ul>
        <li className="mb-2">
          <Link to="/admin/pending" className="block py-2 px-4 rounded hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>待審核地點</Link>
        </li>
        <li className="mb-2">
          <Link to="/admin/reports" className="block py-2 px-4 rounded hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>錯誤回報</Link>
        </li>
        <li className="mb-2">
          <Link to="/admin/locations" className="block py-2 px-4 rounded hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>地點管理</Link>
        </li>
        <li className="mb-2">
          <Link to="/admin/tags" className="block py-2 px-4 rounded hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>標籤管理</Link>
        </li>
        <li className="mb-2">
          <Link to="/admin/types" className="block py-2 px-4 rounded hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>類型管理</Link>
        </li>
        {isSuperAdmin && (
          <li className="mb-2">
            <Link to="/admin/manage-admins" className="block py-2 px-4 rounded hover:bg-gray-700 bg-red-900" onClick={() => setSidebarOpen(false)}>管理員管理</Link>
          </li>
        )}
        <li className="mt-6 border-t border-gray-700 pt-4">
          <Link to="/" className="block py-2 px-4 rounded hover:bg-gray-700">&larr; 回到前台</Link>
        </li>
      </ul>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Static sidebar for desktop */}
      <nav className="hidden md:block w-64 bg-gray-800 text-white p-4 flex-shrink-0">
        <SidebarContent />
      </nav>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white p-4">
            <SidebarContent />
          </div>
          {/* Overlay */}
          <div onClick={() => setSidebarOpen(false)} className="flex-1 bg-black opacity-50"></div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-8">
        {/* Mobile header with hamburger button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">管理後台</h1>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        
        <Outlet /> {/* This will render the nested admin routes */}
      </main>
    </div>
  );
};

export default AdminLayout;
