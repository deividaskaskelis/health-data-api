import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Only PUT allowed' });
  }

  const { date, nutrition } = req.body;

  if (!date || !nutrition || !Array.isArray(nutrition.meals)) {
    return res.status(400).json({ error: 'Missing or invalid data: date and nutrition.meals required' });
  }

  const safeDate = date.slice(0, 10);

  try {
    const { error } = await supabase
      .from('summaries')
      .update({ nutrition })
      .eq('date', safeDate);

    if (error) throw error;

    return res.status(200).json({ message: 'Nutrition replaced successfully' });
  } catch (e) {
    return res.status(500).json({ error: 'Update failed', details: e.message });
  }
}
