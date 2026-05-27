import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useProfileStore } from './store/useProfileStore';
import { useGamificationStore } from './store/useGamificationStore';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './pages/Onboarding';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import { initSpeechEngine } from './lib/speech';

const Agent = lazy(() => import('./pages/Agent'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const BibleStrong = lazy(() => import('./pages/BibleStrong'));
const Heritage = lazy(() => import('./pages/Heritage'));
const Library = lazy(() => import('./pages/Library'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Podcasts = lazy(() => import('./pages/Podcasts'));
const Cells = lazy(() => import('./pages/Cells'));
const MapPage = lazy(() => import('./pages/MapPage'));
const BookReader = lazy(() => import('./pages/BookReader'));
const HeritageArticle = lazy(() => import('./pages/HeritageArticle'));
const CourseModule = lazy(() => import('./pages/CourseModule'));
const About = lazy(() => import('./pages/About'));
const Friends = lazy(() => import('./pages/Friends'));
const FriendChat = lazy(() => import('./pages/FriendChat'));

function PageFallback() {
  return <LoadingScreen />;
}

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
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="agent"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Agent />
                </Suspense>
              }
            />
            <Route
              path="community"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Community />
                </Suspense>
              }
            />
            <Route
              path="friends"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Friends />
                </Suspense>
              }
            />
            <Route
              path="friends/chat/:friendId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <FriendChat />
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Profile />
                </Suspense>
              }
            />
            <Route
              path="library"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Library />
                </Suspense>
              }
            />
            <Route
              path="courses"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Courses />
                </Suspense>
              }
            />
            <Route
              path="courses/:courseId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <CourseDetail />
                </Suspense>
              }
            />
            <Route
              path="courses/:courseId/module/:moduleIndex"
              element={
                <Suspense fallback={<PageFallback />}>
                  <CourseModule />
                </Suspense>
              }
            />
            <Route
              path="podcasts"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Podcasts />
                </Suspense>
              }
            />
            <Route
              path="book/:id"
              element={
                <Suspense fallback={<PageFallback />}>
                  <BookReader />
                </Suspense>
              }
            />
            <Route
              path="bible"
              element={
                <Suspense fallback={<PageFallback />}>
                  <BibleStrong />
                </Suspense>
              }
            />
            <Route
              path="heritage"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Heritage />
                </Suspense>
              }
            />
            <Route
              path="heritage/article/:slug"
              element={
                <Suspense fallback={<PageFallback />}>
                  <HeritageArticle />
                </Suspense>
              }
            />
            <Route
              path="cells"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Cells />
                </Suspense>
              }
            />
            <Route
              path="map"
              element={
                <Suspense fallback={<PageFallback />}>
                  <MapPage />
                </Suspense>
              }
            />
            <Route
              path="about"
              element={
                <Suspense fallback={<PageFallback />}>
                  <About />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
