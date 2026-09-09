'use server';

import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/core/lib/auth';
import { executeDemoReset } from '@/core/lib/demoReset';

export async function resetDemoData() {
  try {
    await verifyAdmin();

    const result = await executeDemoReset();

    if (result.success) {
      revalidatePath('/', 'layout');
      revalidatePath('/admin');
      revalidatePath('/matches');
      revalidatePath('/standings');
      revalidatePath('/votes');
    }

    return result;
  } catch (error) {
    console.error('Action error in resetDemoData:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `خطأ في الصلاحيات أو التنفيذ: ${msg}`,
    };
  }
}
