import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const payload = req.body?.data || req.body;
  if (!payload || !payload.date || (!payload.sleep && !payload.workouts)) {
    return res.status(400).json({ error: 'Missing date or no sleep/workouts data.' });
  }

  const safeDate = payload.date.slice(0, 10);

  try {
    let { data: existing } = await supabase.from('summaries').select('*').eq('date', safeDate).single();

    const updateObj = {};
    if (payload.sleep) updateObj.sleep = payload.sleep;
    if (payload.workouts) updateObj.workouts = payload.workouts;

    if (Object.keys(updateObj).length === 0)
      return res.status(400).json({ error: 'No sleep or workouts data to update.' });

    if (existing) {
      await supabase.from('summaries').update(updateObj).eq('date', safeDate);
      return res.status(200).json({ message: 'Autoexport updated.' });
    } else {
      await supabase.from('summaries').insert([{
        date: safeDate,
        workouts: payload.workouts || [],
        sleep: payload.sleep || {},
        nutrition: {},
      }]);
      return res.status(200).json({ message: 'Autoexport created.' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Insert/update failed', details: e.message });
  }
}
