import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentService } from '../incidentService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
  const mockQuery: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [{ id: '1', title: 'Test' }], error: null })),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
    },
  };
});

describe('incidentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all incidents for a hotel', async () => {
    const hotelId = 'hotel-123';
    const data = await incidentService.getAll(hotelId);
    
    expect(supabase.from).toHaveBeenCalledWith('incidencias');
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Test');
  });

  it('should fetch all incidents when no hotelId is provided', async () => {
    const data = await incidentService.getAll(null);
    expect(supabase.from).toHaveBeenCalledWith('incidencias');
    expect(data).toHaveLength(1);
  });
});
