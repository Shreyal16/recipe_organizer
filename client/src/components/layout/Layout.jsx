import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import api from '../../services/api';

const pageTitles = {
  '/': 'Home Dashboard',
  '/recipes': 'Recipe Collection',
  '/favorites': 'Favorite Recipes',
  '/planner': 'Weekly Meal Planner',
  '/grocery-list': 'Smart Grocery List',
  '/insights': 'AI Recipe Insights & Preferences',
};

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;

  // States: 'checking' | 'waking' | 'ready' | 'unavailable'
  const [probeState, setProbeState] = useState('checking');

  const checkReadiness = useCallback(() => {
    setProbeState('checking');
    let isCurrent = true;

    // Transition from checking to waking if probe is still in-flight after 2.5 seconds
    const wakingTimer = setTimeout(() => {
      if (isCurrent) setProbeState('waking');
    }, 2500);

    api.get('/health/ready')
      .then((res) => {
        if (!isCurrent) return;
        clearTimeout(wakingTimer);
        if (res?.data?.database === 'connected') {
          setProbeState('ready');
        } else {
          setProbeState('unavailable');
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        clearTimeout(wakingTimer);
        setProbeState('unavailable');
      });

    return () => {
      isCurrent = false;
      clearTimeout(wakingTimer);
    };
  }, []);

  useEffect(() => {
    const cleanup = checkReadiness();
    return cleanup;
  }, [checkReadiness]);

  let title = 'Recipe Organizer';
  if (currentPath === '/') {
    title = 'Home Dashboard';
  } else if (currentPath.startsWith('/recipes')) {
    title = 'Recipe Collection';
  } else if (pageTitles[currentPath]) {
    title = pageTitles[currentPath];
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-surface-text flex transition-colors">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header title={title} />

        {/* Cold-start waking banner */}
        {probeState === 'waking' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm px-4 py-2 text-center flex items-center justify-center gap-2 animate-pulse">
            <span>Connecting to backend... The free-tier server is spinning up (this may take 30–45 seconds on cold start).</span>
          </div>
        )}

        {/* Backend unavailable banner */}
        {probeState === 'unavailable' && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm px-4 py-2 text-center flex items-center justify-center gap-3">
            <span>Backend service is currently unreachable or database is initializing.</span>
            <button
              onClick={checkReadiness}
              className="underline font-semibold hover:text-rose-700 dark:hover:text-rose-300"
            >
              Retry Connection
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
