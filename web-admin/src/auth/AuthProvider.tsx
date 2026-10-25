import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export type UserRole = "admin" | "staff" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            setRole((data.role as UserRole) ?? "staff");
          } else {
            // Fallback theo email hệ thống
            const email = currentUser.email?.toLowerCase().trim() ?? "";
            const isSystemAdmin =
              email === "admin@gmail.com" ||
              email === "admin@quanlycf.com" ||
              email.includes("admin");
            const assignedRole: UserRole = isSystemAdmin ? "admin" : "staff";
            setRole(assignedRole);

            // Tự động khởi tạo doc trong users/{uid} để Firestore Rules có thể tra cứu
            try {
              await setDoc(
                userDocRef,
                {
                  email: currentUser.email,
                  role: assignedRole,
                  active: true,
                  createdAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch {
              // Bỏ qua nếu rules chưa cho phép ghi
            }
          }
        } catch {
          // Khi offline hoặc lỗi mạng, fallback an toàn theo email
          const email = currentUser.email?.toLowerCase().trim() ?? "";
          setRole(email.includes("admin") ? "admin" : "staff");
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
