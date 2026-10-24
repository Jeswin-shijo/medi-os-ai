import { Suspense, lazy } from 'react';
import App from './App';

// Screens that run full screen without a staff sign-in, each with its own device
// key: the waiting-room display and the card check-in kiosk.
const QueueDisplayPage = lazy(() => import('./display/QueueDisplayPage'));
const KioskPage = lazy(() => import('./kiosk/KioskPage'));

const DEVICE_PAGES: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  '/display': QueueDisplayPage,
  '/kiosk': KioskPage
};

export default function Root() {
  const Page = DEVICE_PAGES[window.location.pathname.replace(/\/+$/, '')];
  if (!Page) return <App />;
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}
