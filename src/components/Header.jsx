import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import PlacesAutocomplete from './PlacesAutocomplete';
import RegisterLocationModal from './RegisterLocationModal';
import MyLocationsModal from './MyLocationsModal';

const LocationTypeLegendItem = ({ type }) => (
  <div className="flex items-center gap-1 mr-4 mb-1">
    <svg width="24" height="24" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill={type.color || '#A9A9A9'} d="M24 4C15.163 4 8 11.163 8 20c0 10.5 16 24 16 24s16-13.5 16-24C40 11.163 32.837 4 24 4z"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fontSize="20" fill="#FFF">{type.iconEmoji || '📍'}</text>
    </svg>
    <span className="text-xs text-gray-700 font-medium">{type.name}</span>
  </div>
);

const Header = ({ tags, onTagFilter, onClearFilter, onPlaceSelect }) => {
  const { user, userProfile, loading: userLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { activeTypes } = useLocationTypes();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMyLocationsModalOpen, setIsMyLocationsModalOpen] = useState(false);

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
      <button
        onClick={() => setIsRegisterModalOpen(true)}
        className="text-sm text-green-600 hover:underline"
      >
        登錄地點
      </button>
      <button
        onClick={() => setIsMyLocationsModalOpen(true)}
        className="text-sm text-purple-600 hover:underline"
      >
        我的地點
      </button>
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-green-700">親子團綠活地圖</h1>
          <a
            href="https://nestorhuang.github.io/green-map-manual/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
            title="查看操作手冊"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            操作手冊
          </a>
        </div>

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
        <div className="flex flex-wrap gap-2 mb-2">
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

        {/* Location Type Legend */}
        {activeTypes && activeTypes.length > 0 && (
          <div className="flex flex-wrap items-center mt-2 pt-2 border-t border-gray-100">
            {activeTypes.map(type => (
              <LocationTypeLegendItem key={type.id} type={type} />
            ))}
          </div>
        )}
      </div>

      {/* Register Location Modal */}
      <RegisterLocationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* My Locations Modal */}
      <MyLocationsModal
        isOpen={isMyLocationsModalOpen}
        onClose={() => setIsMyLocationsModalOpen(false)}
      />
    </div>
  );
};

export default memo(Header);