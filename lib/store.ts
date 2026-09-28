"use client";
import type { Session } from "./types";

// ---- Dummy auth (client-only, prototype) ----
const USERS = "cr_users";
const CURRENT = "cr_current";
const SESSIONS = "cr_sessions";
const KEY = "cr_api_key";

function readJSON<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.warn("storage write failed", e);
  }
}

export const DEMO_EMAIL = "demo@critroom.app";
export const DEMO_PASSWORD = "demo1234";

export function login(email: string, password: string): { ok: true; created: boolean } | { ok: false; error: string } {
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const users = readJSON<Record<string, { password: string; name: string }>>(USERS, {});
  let created = false;
  if (!users[email]) {
    users[email] = { password, name: email.split("@")[0] };
    writeJSON(USERS, users);
    created = true;
  } else if (users[email].password !== password) {
    return { ok: false, error: "That password doesn't match this email." };
  }
  writeJSON(CURRENT, email);
  return { ok: true, created };
}
export function currentUser(): { email: string; name: string } | null {
  const email = readJSON<string | null>(CURRENT, null);
  if (!email) return null;
  const users = readJSON<Record<string, { name: string }>>(USERS, {});
  const name = users[email]?.name ?? email.split("@")[0];
  return { email, name: name.charAt(0).toUpperCase() + name.slice(1) };
}
export function logout() {
  try {
    localStorage.removeItem(CURRENT);
  } catch {}
}

// ---- Optional bring-your-own API key ----
export const getApiKey = () => readJSON<string>(KEY, "");
export const setApiKey = (k: string) => writeJSON(KEY, k.trim());

// ---- Sessions ----
export function listSessions(email: string): Session[] {
  return readJSON<Session[]>(SESSIONS, [])
    .filter((s) => s.userEmail === email)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function getSession(id: string): Session | undefined {
  return readJSON<Session[]>(SESSIONS, []).find((s) => s.id === id);
}
export function saveSession(s: Session) {
  const all = readJSON<Session[]>(SESSIONS, []).filter((x) => x.id !== s.id);
  all.push(s);
  writeJSON(SESSIONS, all);
}
export function deleteSession(id: string) {
  writeJSON(SESSIONS, readJSON<Session[]>(SESSIONS, []).filter((x) => x.id !== id));
  deleteVideo(id).catch(() => {});
}
export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---- Video blobs in IndexedDB ----
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("critroom", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("videos");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function saveVideo(id: string, blob: Blob) {
  const d = await db();
  await new Promise<void>((res, rej) => {
    const tx = d.transaction("videos", "readwrite");
    tx.objectStore("videos").put(blob, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function loadVideo(id: string): Promise<Blob | null> {
  const d = await db();
  return new Promise((res) => {
    const r = d.transaction("videos").objectStore("videos").get(id);
    r.onsuccess = () => res((r.result as Blob) ?? null);
    r.onerror = () => res(null);
  });
}
async function deleteVideo(id: string) {
  const d = await db();
  const s = d.transaction("videos", "readwrite").objectStore("videos");
  s.delete(id);
  s.delete(`${id}:frames`);
}
export async function saveFrames(id: string, frames: unknown[]) {
  await saveVideo(`${id}:frames`, new Blob([JSON.stringify(frames)], { type: "application/json" }));
}
export async function loadFrames<T>(id: string): Promise<T[]> {
  const b = await loadVideo(`${id}:frames`);
  if (!b) return [];
  try {
    return JSON.parse(await b.text()) as T[];
  } catch {
    return [];
  }
}
