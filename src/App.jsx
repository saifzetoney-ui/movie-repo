import React from 'react';
import Home from './pages/Home/Home';
import { Routes, Route } from 'react-router-dom';
import Player from './pages/Player/Player';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TvRemoteProvider } from './context/TvRemoteContext';
import RemoteControl from './components/RemoteControl/RemoteControl';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import BrowserSavePassword from './components/Auth/BrowserSavePassword';
import NetflixSplashScreen from './components/Auth/NetflixSplashScreen';
import CreateProfile from './components/Profile/CreateProfile';
import DemoFlowNavigator from './components/DemoFlowNavigator/DemoFlowNavigator';

const MainAppFlow = () => {
  const { flowState, setSelectedProviderId } = useAuth();

  if (flowState === 'signin' || flowState === 'signup') {
    return (
      <>
        <AuthModal />
        <DemoFlowNavigator onSelectProvider={setSelectedProviderId} />
      </>
    );
  }

  if (flowState === 'browser_save_dialog') {
    return (
      <>
        <BrowserSavePassword />
        <DemoFlowNavigator onSelectProvider={setSelectedProviderId} />
      </>
    );
  }

  if (flowState === 'netflix_splash') {
    return (
      <>
        <NetflixSplashScreen />
        <DemoFlowNavigator onSelectProvider={setSelectedProviderId} />
      </>
    );
  }

  if (flowState === 'create_profile') {
    return (
      <>
        <CreateProfile />
        <DemoFlowNavigator onSelectProvider={setSelectedProviderId} />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/player/:id' element={<Player />} />
        <Route path='/Player/:id' element={<Player />} />
        <Route path='*' element={<Home />} />
      </Routes>
      <DemoFlowNavigator onSelectProvider={setSelectedProviderId} />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <TvRemoteProvider>
        <div className="neplify-app-root">
          <ToastContainer theme='dark' />
          <MainAppFlow />
          {/* Smart TV Remote Control Controller & HUD */}
          <RemoteControl />
        </div>
      </TvRemoteProvider>
    </AuthProvider>
  );
};

export default App;
