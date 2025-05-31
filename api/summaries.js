// pages/api/summaries.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const payload = req.body?.data || req.body;
  if (!payload || !payload.date) {
    return res.status(400).json({ error: 'Missing date' });
  }

  const safeDate = payload.date.slice(0, 10);

  try {
    let { data: existing, error: selectError } = await supabase
      .from('summaries')
      .select('*')
      .eq('date', safeDate)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    // Paruošiame naujus laukus įrašui/arba atnaujinimui
    const updateObj = {};

    // Workout
    if (payload.workouts) updateObj.workouts = payload.workouts;

    // Sleep
    if (payload.sleep) updateObj.sleep = payload.sleep;

    // Maistas kaip anksčiau (tik jei yra meal ir items)
    if (payload.meal && payload.items) {
      let meals = existing?.nutrition?.meals || [];
      let totals = existing?.nutrition?.totals || {calories:0,protein:0,carbs:0,fat:0};
      const newMeal = { name: payload.meal, items: payload.items };
      meals = [...meals, newMeal];
      for (const item of payload.items) {
        totals.calories += item.calories || 0;
        totals.protein += item.protein || 0;
        totals.carbs += item.carbs || 0;
        totals.fat += item.fat || 0;
      }
      updateObj.nutrition = { meals, totals };
    }

    // Jei nėra nei workouts, nei sleep, nei meal+items – nieko neatnaujina!
    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: 'No valid data provided.' });
    }

    if (existing) {
      // UPDATE
      const { error: updateError } = await supabase
        .from('summaries')
        .update(updateObj)
        .eq('date', safeDate);
      if (updateError) throw updateError;
      return res.status(200).json({ message: 'Summary updated.' });
    } else {
      // INSERT
      const insertObj = {
        date: safeDate,
        workouts: updateObj.workouts || [],
        sleep: updateObj.sleep || {},
        nutrition: updateObj.nutrition || {},
      };
      const { error: insertError } = await supabase.from('summaries').insert([insertObj]);
      if (insertError) throw insertError;
      return res.status(200).json({ message: 'Summary created.' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Insert/update failed', details: e.message });
  }
}
