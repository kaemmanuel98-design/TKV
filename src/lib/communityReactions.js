const STORAGE_KEY = 'tkv_community_reacted';

function loadSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function hasReacted(postId) {
  return loadSet().has(postId);
}

export function markReacted(postId) {
  const set = loadSet();
  set.add(postId);
  saveSet(set);
}

export function unmarkReacted(postId) {
  const set = loadSet();
  set.delete(postId);
  saveSet(set);
}
