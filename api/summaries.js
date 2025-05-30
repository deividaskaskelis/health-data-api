import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  const { from, to } = req.query;

  try {
    let query = supabase.from('summaries').select('*');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Supabase query failed', details: e.message });
  }
}
