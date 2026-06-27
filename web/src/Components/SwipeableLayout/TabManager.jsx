import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingRunner from '../LoadingRunner/LoadingRunner';
import DashboardNav from '../DashboardNav/DashboardNav';

const Dashboard = lazy(() => import('../Dashboard/Dashboard'));
const Community = lazy(() => import('../Community/Community'));
const UserEventsPage = lazy(() => import('../UserEventsPage/UserEventsPage'));
const PlansPage = lazy(() => import('../Plans/PlansPage'));
const FitnessTracker = lazy(() => import('../FitnessTracker/FitnessTracker'));

const SWIPEABLE_ROUTES = [
  '/dashboard',
  '/community',
  '/user-events',
  '/plans',
  '/fitness'
];

const TabManager = () => {
  const location = useLocation();
  // Initialize with the current path if it's a tab, otherwise start empty
  const initialTabs = new Set(
    SWIPEABLE_ROUTES.includes(location.pathname) ? [location.pathname] : []
  );
  
  const [mountedTabs, setMountedTabs] = useState(initialTabs);

  // Queue rendering for remaining tabs
  useEffect(() => {
    // Only start queueing if we are on one of the main tabs
    if (!SWIPEABLE_ROUTES.includes(location.pathname)) return;

    const tabsToMount = SWIPEABLE_ROUTES.filter(path => !mountedTabs.has(path));
    
    if (tabsToMount.length > 0) {
      tabsToMount.forEach((path, index) => {
        setTimeout(() => {
          setMountedTabs(prev => {
            const next = new Set(prev);
            next.add(path);
            return next;
          });
        }, 1500 + (index * 800)); // Delay initial load by 1.5s, then stagger by 800ms
      });
    }
  }, [location.pathname]); // Add location.pathname to catch when user navigates to a tab for the first time

  const activeIndex = SWIPEABLE_ROUTES.indexOf(location.pathname);

  // Render nothing if we are not on a swipeable route
  if (activeIndex === -1) {
    return null;
  }

  const getTabStyle = (path) => {
    const tabIndex = SWIPEABLE_ROUTES.indexOf(path);
    let translate = '0%';
    
    if (tabIndex < activeIndex) translate = '-100%';
    if (tabIndex > activeIndex) translate = '100%';
    
    // Only keep the active and immediately adjacent tabs visible to the browser rendering engine 
    // to improve performance, but don't use display: none so they can animate out.
    const isVisible = Math.abs(tabIndex - activeIndex) <= 1;

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      transform: `translateX(${translate})`,
      transition: 'transform 0.35s cubic-bezier(0.15, 0.3, 0.25, 1)',
      visibility: isVisible ? 'visible' : 'hidden',
      WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
    };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
      <DashboardNav />
      <Suspense fallback={<LoadingRunner />}>
        {mountedTabs.has('/dashboard') && (
          <div style={getTabStyle('/dashboard')}>
            <Dashboard />
          </div>
        )}
        {mountedTabs.has('/community') && (
          <div style={getTabStyle('/community')}>
            <Community />
          </div>
        )}
        {mountedTabs.has('/user-events') && (
          <div style={getTabStyle('/user-events')}>
            <UserEventsPage />
          </div>
        )}
        {mountedTabs.has('/plans') && (
          <div style={getTabStyle('/plans')}>
            <PlansPage />
          </div>
        )}
        {mountedTabs.has('/fitness') && (
          <div style={getTabStyle('/fitness')}>
            <FitnessTracker />
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default TabManager;
