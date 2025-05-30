import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const payload = req.body?.data;

  if (!payload || !payload.date || !payload.nutrition) {
    return res.status(400).json({ error: 'Missing date or nutrition data' });
  }

  try {
    // Check if summary exists
    const { data: existing, error: selectError } = await supabase
      .from('summaries')
      .select('*')
      .eq('date', payload.date)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existing) {
      // Update nutrition
      const { error: updateError } = await supabase
        .from('summaries')
        .update({ nutrition: payload.nutrition })
        .eq('date', payload.date);

      if (updateError) throw updateError;

      return res.status(200).json({ message: 'Nutrition updated' });
    } else {
      // Insert new with fallback for other fields
      const { error: insertError } = await supabase.from('summaries').insert([
        {
          date: payload.date,
          workouts: [],
          sleep: {},
          nutrition: payload.nutrition,
        },
      ]);

      if (insertError) throw insertError;

      return res.status(200).json({ message: 'Nutrition inserted as new' });
    }
  } catch (e) {
    return res
      .status(500)
      .json({ error: 'Failed to insert/update nutrition', details: e.message });
  }
}
