import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const from = req.query.from;
    const to = req.query.to;

    const query = supabase.from('summaries').select('*');

    if (from && to) {
      query.gte('date', from).lte('date', to).order('date', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Supabase query failed', details: e.message });
  }
}
