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

  const payload = req.body?.data;

  if (!payload || !payload.date || !payload.meal || !payload.items) {
    return res.status(400).json({ error: 'Missing date, meal or items' });
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from('summaries')
      .select('nutrition')
      .eq('date', payload.date)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    const newMeal = {
      name: payload.meal,
      items: payload.items
    };

    let updatedMeals = [];
    let updatedTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (existing && existing.nutrition && existing.nutrition.meals) {
      updatedMeals = [...existing.nutrition.meals, newMeal];
      updatedTotals = existing.nutrition.totals || updatedTotals;
    } else {
      updatedMeals = [newMeal];
    }

    for (const item of payload.items) {
      updatedTotals.calories += item.calories || 0;
      updatedTotals.protein += item.protein || 0;
      updatedTotals.carbs += item.carbs || 0;
      updatedTotals.fat += item.fat || 0;
    }

    const nutrition = {
      meals: updatedMeals,
      totals: updatedTotals
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from('summaries')
        .update({ nutrition })
        .eq('date', payload.date);

      if (updateError) throw updateError;

      return res.status(200).json({ message: 'Meal added and totals updated' });
    } else {
      const { error: insertError } = await supabase.from('summaries').insert([
        {
          date: payload.date,
          workouts: [],
          sleep: {},
          nutrition
        }
      ]);

      if (insertError) throw insertError;

      return res.status(200).json({ message: 'Meal added in new summary' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Insert/update failed', details: e.message });
  }
}
