/** Remembers the last entered player name in this browser (storage may be unavailable). */
const KEY = 'doodle-jump.name';

export function loadLastName(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveLastName(name: string) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // ignore: only a convenience
  }
}
