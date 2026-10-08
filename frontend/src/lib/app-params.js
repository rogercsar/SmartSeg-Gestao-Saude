const isNode = typeof window === 'undefined';

export const getAccessToken = () => {
  if (isNode) return null;
  return window.localStorage.getItem('token') || window.localStorage.getItem('access_token') || null;
};

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('access_token');
  window.localStorage.removeItem('base44_access_token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  return {
    appId: import.meta.env.VITE_APP_ID || 'smartseg',
    token: getAccessToken(),
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  };
};

export const appParams = {
  ...getAppParams(),
};
