import React, { createContext, useContext, useState, useEffect } from 'react';
import { avatarsList } from '../data/avatars';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_profiles');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'prof-default',
          name: 'Alex',
          avatar: avatarsList[0],
          isKids: false
        }
      ];
    } catch {
      return [
        {
          id: 'prof-default',
          name: 'Alex',
          avatar: avatarsList[0],
          isKids: false
        }
      ];
    }
  });

  const [currentProfile, setCurrentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_current_profile');
      if (saved) return JSON.parse(saved);
      return profiles[0] || null;
    } catch {
      return profiles[0] || null;
    }
  });

  // Flow states: 'signin' | 'signup' | 'browser_save_dialog' | 'netflix_splash' | 'create_profile' | 'home'
  const [flowState, setFlowState] = useState(() => {
    // If user already logged in and has profile, start at 'home', else 'signin'
    try {
      const savedUser = localStorage.getItem('neplify_user');
      const savedProfile = localStorage.getItem('neplify_current_profile');
      if (savedUser && savedProfile) return 'home';
      return 'signin';
    } catch {
      return 'signin';
    }
  });

  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('neplify_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('neplify_user');
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('neplify_profiles', JSON.stringify(profiles));
    } catch {}
  }, [profiles]);

  useEffect(() => {
    try {
      if (currentProfile) {
        localStorage.setItem('neplify_current_profile', JSON.stringify(currentProfile));
      }
    } catch {}
  }, [currentProfile]);

  // Auth actions
  const initiateAuthSubmit = (credentials, isSignUp = false) => {
    setPendingCredentials(credentials);
    // Proceed to browser save password dialog step
    setFlowState('browser_save_dialog');
  };

  const handleBrowserPasswordAction = (choice) => {
    // 'save' or 'never'
    if (pendingCredentials) {
      const newUser = {
        email: pendingCredentials.email,
        name: pendingCredentials.email.split('@')[0] || 'User',
        savedPasswordInBrowser: choice === 'save'
      };
      setUser(newUser);
    }
    // Proceed to Netflix loading splash screen
    setFlowState('netflix_splash');
  };

  const handleSplashComplete = () => {
    // Move to Profile Creation screen
    setFlowState('create_profile');
  };

  const saveNewProfile = (name, avatar, isKids = false) => {
    const newProf = {
      id: `prof-${Date.now()}`,
      name: name || 'New Profile',
      avatar: avatar || avatarsList[0],
      isKids
    };

    setProfiles((prev) => {
      const updated = [...prev, newProf];
      return updated;
    });

    setCurrentProfile(newProf);
    setFlowState('home');
  };

  const switchProfile = (profileId) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setCurrentProfile(found);
      setFlowState('home');
    }
  };

  const openCreateProfile = () => {
    setFlowState('create_profile');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neplify_user');
    setFlowState('signin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        currentProfile,
        flowState,
        setFlowState,
        pendingCredentials,
        initiateAuthSubmit,
        handleBrowserPasswordAction,
        handleSplashComplete,
        saveNewProfile,
        switchProfile,
        openCreateProfile,
        logout,
        selectedProviderId,
        setSelectedProviderId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
