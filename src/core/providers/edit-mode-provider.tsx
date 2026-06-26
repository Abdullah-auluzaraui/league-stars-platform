'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './auth-provider';

// ─── أنواع البيانات ───────────────────────────────────────────────────────────
interface EditModeContextValue {
  isEditMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean; // isAdmin && isEditMode
}

// ─── السياق ───────────────────────────────────────────────────────────────────
const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  toggleEditMode: () => {},
  canEdit: false,
});

// ─── المزود ───────────────────────────────────────────────────────────────────
export function EditModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = useCallback(() => {
    // يمكن تفعيل وضع التعديل للمشرف فقط
    if (!isAdmin) return;
    setIsEditMode((prev) => !prev);
  }, [isAdmin]);

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        toggleEditMode,
        canEdit: isAdmin && isEditMode,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

// ─── Hook للاستخدام السهل ────────────────────────────────────────────────────
export function useEditMode() {
  return useContext(EditModeContext);
}
