import { useEffect, useState } from 'react';
import BuildTrackApp from './components/BuildTrackApp';
import Login from './components/Login';

function currentPath() {
  return window.location.pathname;
}

function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const handlePopState = () => setPath(currentPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  if (path === '/dashboard' && localStorage.getItem('token')) return <BuildTrackApp />;
  if (path !== '/') {
    window.history.replaceState({}, '', '/');
  }
  return <Login onLogin={() => navigate('/dashboard')} />;
}

export default App;
