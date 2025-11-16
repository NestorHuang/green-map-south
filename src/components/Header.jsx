import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import PlacesAutocomplete from './PlacesAutocomplete';

const Header = ({ tags, onTagFilter, onClearFilter, onPlaceSelect }) => {
  const { user, userProfile, loading: userLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const NavLinks = () => (
    <div className="flex items-center gap-4">
      {!adminLoading && isAdmin && (
        <Link to="/admin" className="text-sm font-semibold text-red-600 hover:underline">管理後台</Link>
      )}
      <Link to="/register" className="text-sm text-green-600 hover:underline">登錄地點</Link>
      <Link to="/profile" className="text-sm text-blue-600 hover:underline">個人資料</Link>
      <button onClick={handleSignOut} className="text-sm text-gray-600 hover:underline">登出</button>
    </div>
  );

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-white bg-opacity-95 shadow-md p-4"
      style={{ zIndex: 1000 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-green-700">南區綠活圖</h1>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {!userLoading && user ? (
            <>
              <span className="text-sm">
                你好, {userProfile?.isWildernessPartner && userProfile?.groupName && userProfile?.naturalName
                  ? `${userProfile.naturalName}(${userProfile.groupName})`
                  : (userProfile?.displayName || user.displayName)}
              </span>
              <NavLinks />
            </>
          ) : (
            <button onClick={signInWithGoogle} className="text-sm text-blue-600 hover:underline">使用 Google 登入</button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-2">
          {!userLoading && user ? (
            <div className="border-t border-gray-200 pt-2">
              <span className="block text-sm px-4 py-2">
                你好, {userProfile?.isWildernessPartner && userProfile?.groupName && userProfile?.naturalName
                  ? `${userProfile.naturalName}(${userProfile.groupName})`
                  : (userProfile?.displayName || user.displayName)}
              </span>
              <NavLinks />
            </div>
          ) : !userLoading && !user && (
            <div className="border-t border-gray-200 pt-2">
              <button onClick={signInWithGoogle} className="w-full text-left text-sm text-blue-600 hover:underline px-4 py-2">使用 Google 登入</button>
            </div>
          )}
        </div>
      )}
      
      {/* Search and Filter Section (always visible) */}
      <div className={isMenuOpen ? 'hidden' : ''}>
        {/* Search Bar */}
        <div className="my-2">
          <PlacesAutocomplete onPlaceSelect={onPlaceSelect} />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onClearFilter}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-full"
          >
            所有地點
          </button>
          {tags.map(tag => (
            <button 
              key={tag.id} 
              onClick={() => onTagFilter(tag.id)}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(Header);


