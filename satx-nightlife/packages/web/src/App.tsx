import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { LocationProvider } from './context/LocationContext';

// Lazy load pages for code splitting
const TonightPage = lazy(() => import('./pages/TonightPage'));
const MonthlyPage = lazy(() => import('./pages/MonthlyPage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const YearPage = lazy(() => import('./pages/YearPage'));
const VenuePage = lazy(() => import('./pages/VenuePage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <LocationProvider>
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<TonightPage />} />
            <Route path="/monthly" element={<MonthlyPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/year" element={<YearPage />} />
            <Route path="/venue/:id" element={<VenuePage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </LocationProvider>
  );
}

export default App;
