import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

let authInitPromise = null;

async function waitForAuthInit() {
  if (auth.currentUser) return;
  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      const unsub = onAuthStateChanged(
        auth,
        () => {
          unsub();
          resolve();
        },
        () => resolve(),
      );
    });
  }
  await authInitPromise;
}

async function getToken(preferredUser, forceRefresh = false) {
  await waitForAuthInit();
  const user = preferredUser || auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
}

export async function apiFetch(path, options = {}) {
  const {
    authUser = null,
    retryOnAuthError = true,
    headers,
    ...fetchOptions
  } = options;

  const request = async (forceRefresh = false) => {
    const token = await getToken(authUser, forceRefresh);
    return fetch(path, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  };

  let res = await request(false);
  if (
    res.status === 401 &&
    retryOnAuthError &&
    (authUser || auth.currentUser)
  ) {
    res = await request(true);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}
