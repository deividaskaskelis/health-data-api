import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Missing date' });
  }

  try {
    const { error } = await supabase
      .from('summaries')
      .update({ nutrition: {} })
      .eq('date', date.slice(0, 10));

    if (error) throw error;

    return res.status(200).json({ message: 'Nutrition cleared' });
  } catch (e) {
    return res.status(500).json({ error: 'Clear failed', details: e.message });
  }
}
