import { ZodSchema, ZodError } from 'zod';

// ─── خطأ مخصص للـ Server Actions ───────────────────────────────────────────
export class ActionError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ActionError';
  }
}

// ─── تنسيق أخطاء Zod ────────────────────────────────────────────────────────
export function formatZodErrors(error: ZodError): string {
  // Zod v4 uses `issues`
  return error.issues
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
}

// ─── نتيجة التحقق ────────────────────────────────────────────────────────────
type ValidationResult<T> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: Array<{ path: string; message: string }> };

// ─── التحقق من البيانات مع Schema (Safe — لا يرمي) ──────────────────────────
export function validateAction<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return { success: false, data: null, errors };
}

// ─── تحويل FormData إلى Object ───────────────────────────────────────────────
export function parseFormData(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// ─── معالجة أخطاء Server Actions ────────────────────────────────────────────
export function handleActionError(error: unknown): {
  success: false;
  error: string;
  code: string;
} {
  if (error instanceof ActionError) {
    return { success: false, error: error.message, code: error.code };
  }
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى',
    code: 'INTERNAL_ERROR',
  };
}
