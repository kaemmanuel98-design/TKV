import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useProfileStore } from './store/useProfileStore';
import { useGamificationStore } from './store/useGamificationStore';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Agent from './pages/Agent';
import Community from './pages/Community';
import Profile from './pages/Profile';
import BibleStrong from './pages/BibleStrong';
import Heritage from './pages/Heritage';
import Library from './pages/Library';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Podcasts from './pages/Podcasts';
import Cells from './pages/Cells';
import MapPage from './pages/MapPage';
import AuthPage from './pages/AuthPage';
import BookReader from './pages/BookReader';
import HeritageArticle from './pages/HeritageArticle';
import CourseModule from './pages/CourseModule';
import About from './pages/About';
import { initSpeechEngine } from './lib/speech';

function App() {
  const { initialize, loading, user } = useAuthStore();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const syncFromProfile = useGamificationStore((s) => s.syncFromProfile);

  useEffect(() => {
    initialize();
    initSpeechEngine();
  }, [initialize]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then((profile) => {
        if (profile) syncFromProfile(profile);
      });
    }
  }, [user?.id, fetchProfile, syncFromProfile]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="agent" element={<Agent />} />
          <Route path="community" element={<Community />} />
          <Route path="profile" element={<Profile />} />
          <Route path="library" element={<Library />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CourseDetail />} />
          <Route path="courses/:courseId/module/:moduleIndex" element={<CourseModule />} />
          <Route path="podcasts" element={<Podcasts />} />
          <Route path="book/:id" element={<BookReader />} />
          <Route path="bible" element={<BibleStrong />} />
          <Route path="heritage" element={<Heritage />} />
          <Route path="heritage/article/:slug" element={<HeritageArticle />} />
          <Route path="cells" element={<Cells />} />
          <Route path="map" element={<MapPage />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
