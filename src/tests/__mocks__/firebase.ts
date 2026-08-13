import { vi } from "vitest";

export function crearMocksFirestore() {
  return {
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    where: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    deleteDoc: vi.fn(),
  };
}

export function configurarMocksFirestore(comportamiento: Record<string, unknown>) {
  return vi.mock("firebase/firestore", () => comportamiento);
}

export function crearMocksAuth() {
  return {
    getAuth: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
  };
}

export function configurarMocksAuth(comportamiento: Record<string, unknown>) {
  return vi.mock("firebase/auth", () => comportamiento);
}
