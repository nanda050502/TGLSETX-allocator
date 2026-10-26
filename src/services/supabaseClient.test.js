import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ mockClient: true })),
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should not configure supabase if env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();

    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('should configure supabase if env vars are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-anon-key');

    const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');
    expect(isSupabaseConfigured).toBe(true);
    expect(supabase).toEqual({ mockClient: true });

    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'some-anon-key');
  });
});
