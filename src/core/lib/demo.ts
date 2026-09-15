export const DEMO_ADMIN_USERNAME = 'demo-admin';

export function isDemoEnabled(): boolean {
  return process.env.DEMO_MODE === 'true' && process.env.DEMO_DATABASE === 'true';
}

export function assertDemoEnabled(): void {
  if (!isDemoEnabled()) {
    throw new Error('Demo operations require DEMO_MODE=true and DEMO_DATABASE=true on an isolated database');
  }
}
