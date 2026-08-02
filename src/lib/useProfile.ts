console.log("useProfile.ts loaded");
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

let globalProfileCache: any = null;
let globalProfileListeners: ((profile: any, loading: boolean) => void)[] = [];
let globalIsLoading = true;
let isListeningToAuth = false;

function notifyListeners() {
  globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
}

let fetchProfilePromise: Promise<void> | null = null;

// A Postgrest/network failure (blocked request, offline, adblocker, transient
// outage) surfaces here as a raw "Failed to fetch" TypeError rather than a
// structured Postgrest error. Kept in sync with the identical helper in
// Login.tsx, which is the other place a profile row can be auto-created.
function isFetchFailure(err: any) {
  return !!(err && (err.message?.includes('fetch') || err.message?.includes('Fetch')));
}

async function fetchProfileForUser(user: any, force = false) {
  if (!user || !supabase) {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("fetchProfileForUser called with null, but session exists. Using session user.");
          user = session.user;
        } else {
          console.log("Setting globalProfileCache to null. user:", user);
          globalProfileCache = null;
          console.log("notifyListeners called with", globalProfileCache);
          globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
          return;
        }
      } catch (err) {
        console.warn("Error getting session in fetchProfileForUser:", err);
        globalProfileCache = null;
        globalIsLoading = false;
        globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
        return;
      }
    } else {
      console.log("Setting globalProfileCache to null. user:", user);
      globalProfileCache = null;
      globalIsLoading = false;
      console.log("notifyListeners called with", globalProfileCache);
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
      return;
    }
  }
  
  if (fetchProfilePromise) {
    if (!force) {
      return fetchProfilePromise;
    } else {
      await fetchProfilePromise; // wait for it to finish
    }
  }
  
  fetchProfilePromise = (async () => {
    try {
       
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
       
      
      // If fetch fails due to network/adblocker (Failed to fetch) blocking the 'profiles' path,
      // we can fallback to the user's metadata to allow the app to function.
      if (error && isFetchFailure(error)) {
         const meta = user.user_metadata || {};
         data = {
             id: user.id,
             full_name: meta.full_name || 'User',
             email: user.email,
             role: meta.role || 'Student',
             portal: meta.portal || 'UTME',
             university: meta.university || null,
             course: meta.course || null,
             created_at: meta.registration_date || new Date().toISOString(),
             student_id: meta.student_id || null
         };
         error = null;
      }

      if (error && error.code === 'PGRST116') {
        console.warn("Profile not found in useProfile.ts. It should have been created during signup.");
        error = null;
      }
      
            if (data) {
         const meta = user.user_metadata || {};
         const getVal = (dbVal: any, metaVal: any) => (dbVal !== undefined && dbVal !== null) ? dbVal : metaVal;
         data = {
           ...data,
           full_name: getVal(data.full_name, meta.full_name),
           phone_number: getVal(data.phone_number, meta.phone_number),
           bio: getVal(data.bio, meta.bio),
           university: getVal(data.university, meta.university),
           course: getVal(data.course, meta.course),
           level: getVal(data.level, meta.level),
           avatar_url: getVal(data.avatar_url, meta.avatar_url)
         };
         globalProfileCache = data;
      } else if (error) {
         console.warn("Profile fetch error, using fallback/existing cache to prevent logout:", error);
         if (!globalProfileCache) {
             const meta = user.user_metadata || {};
             globalProfileCache = {
                 id: user.id,
                 full_name: meta.full_name || 'User',
                 email: user.email,
                 role: meta.role || 'Student',
                 portal: meta.portal || 'UTME'
             };
         }
      } else {
         globalProfileCache = null;
      }
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
    } catch(err) {
      console.warn("Failed to fetch profile", err);
      console.log("notifyListeners called with", globalProfileCache);
  globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
    } finally {
      fetchProfilePromise = null;
      globalIsLoading = false;
      globalProfileListeners.forEach(listener => listener(globalProfileCache, globalIsLoading));
    }
  })();
  return fetchProfilePromise;
}

export function useProfile() {
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
    }
    
    if (!isListeningToAuth) {
      isListeningToAuth = true;
      
      
      // Listen to changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("onAuthStateChange fired. event:", _event, "session:", session);
        fetchProfileForUser(session?.user || null);
      });
    } else if (globalProfileCache && !globalIsLoading) {
       // Already cached and initialized and not loading
       if (isMounted) setLoading(false);
    }
    
    return () => {
      isMounted = false;
      globalProfileListeners = globalProfileListeners.filter(l => l !== listener);
    };
  }, []);

  return { profile, loading };
}

export async function refreshProfile() {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await console.log("getUser resolved. user:", user);
        await fetchProfileForUser(user);
  } catch (err) {
    console.warn("refreshProfile error:", err);
  }
}

export function getProfileCache() { return globalProfileCache; }


// Initialize auth state immediately on load
if (supabase && typeof window !== 'undefined') {
  fetchProfileForUser(null);
}
