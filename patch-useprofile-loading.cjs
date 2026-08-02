const fs = require('fs');
let content = fs.readFileSync('src/lib/useProfile.ts', 'utf8');

// replace listener logic
content = content.replace('let globalProfileListeners: any[] = [];', 'let globalProfileListeners: ((profile: any, loading: boolean) => void)[] = [];\nlet globalIsLoading = true;');
content = content.replace('globalProfileListeners.forEach(listener => listener(globalProfileCache));', 'globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));');

// we need to replace all `globalProfileListeners.forEach(listener => listener(globalProfileCache));`
content = content.replaceAll('globalProfileListeners.forEach(listener => listener(globalProfileCache));', 'globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));');

// set loading to false when we have no user
const noUserTarget = `      console.log("Setting globalProfileCache to null. user:", user);
      globalProfileCache = null;
      console.log("notifyListeners called with", globalProfileCache);
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
      return;`;
const noUserReplacement = `      console.log("Setting globalProfileCache to null. user:", user);
      globalProfileCache = null;
      globalIsLoading = false;
      console.log("notifyListeners called with", globalProfileCache);
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
      return;`;
content = content.replaceAll(noUserTarget, noUserReplacement);

const errorGettingSessionTarget = `        console.warn("Error getting session in fetchProfileForUser:", err);
        globalProfileCache = null;
        globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
        return;`;
const errorGettingSessionReplacement = `        console.warn("Error getting session in fetchProfileForUser:", err);
        globalProfileCache = null;
        globalIsLoading = false;
        globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
        return;`;
content = content.replaceAll(errorGettingSessionTarget, errorGettingSessionReplacement);

// set loading state inside fetch
const fetchStartTarget = `    fetchProfilePromise = (async () => {
    try {`;
const fetchStartReplacement = `    fetchProfilePromise = (async () => {
    globalIsLoading = true;
    globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
    try {`;
content = content.replace(fetchStartTarget, fetchStartReplacement);

const fetchEndTarget = `    } finally {
      fetchProfilePromise = null;
    }
  })();`;
const fetchEndReplacement = `    } finally {
      fetchProfilePromise = null;
      globalIsLoading = false;
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
    }
  })();`;
content = content.replace(fetchEndTarget, fetchEndReplacement);

// useProfile hook
const useProfileTarget = `export function useProfile() {
  const [profile, setProfile] = useState<any>(globalProfileCache);
  const [loading, setLoading] = useState(!globalProfileCache);
  useEffect(() => {
    let isMounted = true;
    
    const listener = (newProfile: any) => {
      if (isMounted) {
        setProfile(newProfile);
        setLoading(false);
      }
    };
    
    globalProfileListeners.push(listener);
    
    if (!supabase) {
      if (isMounted) setLoading(false);
      return;
    }`;
const useProfileReplacement = `export function useProfile() {
  const [profile, setProfile] = useState<any>(globalProfileCache);
  const [loading, setLoading] = useState<boolean>(globalIsLoading);
  
  useEffect(() => {
    let isMounted = true;
    
    // Catch up in case we missed a state change before mounting
    setProfile(globalProfileCache);
    setLoading(globalIsLoading);
    
    const listener = (newProfile: any, newLoading: boolean) => {
      if (isMounted) {
        setProfile(newProfile);
        setLoading(newLoading);
      }
    };
    
    globalProfileListeners.push(listener);
    
    if (!supabase) {
      if (isMounted) setLoading(false);
      return;
    }`;
content = content.replace(useProfileTarget, useProfileReplacement);

const alreadyCachedTarget = `    } else if (globalProfileCache) {
       // Already cached and initialized
       if (isMounted) setLoading(false);
    }`;
const alreadyCachedReplacement = `    } else if (globalProfileCache && !globalIsLoading) {
       // Already cached and initialized and not loading
       if (isMounted) setLoading(false);
    }`;
content = content.replace(alreadyCachedTarget, alreadyCachedReplacement);


fs.writeFileSync('src/lib/useProfile.ts', content);
console.log('useProfile.ts patched with proper loading state.');
