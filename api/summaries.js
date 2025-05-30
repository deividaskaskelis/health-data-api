import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    const payload = req.body?.data;

    if (!payload || !payload.date || !payload.meal || !payload.items) {
      return res.status(400).json({ error: 'Missing date, meal or items' });
    }

    const safeDate = payload.date.slice(0, 10);

    try {
      const { data: existing, error: selectError } = await supabase
        .from('summaries')
        .select('nutrition')
        .eq('date', safeDate)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      const newMeal = {
        name: payload.meal,
        time: payload.time || null,
        items: payload.items
      };

      let updatedMeals = [];
      let updatedTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      if (existing?.nutrition?.meals?.length) {
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
        // 🔍 Debug info
        console.log('✅ Updating summary for date:', safeDate);
        console.log('Current existing:', JSON.stringify(existing, null, 2));
        console.log('Nutrition object to update:', JSON.stringify(nutrition, null, 2));

        const { error: updateError } = await supabase
          .from('summaries')
          .update({ nutrition })
          .eq('date', safeDate);

        if (updateError) throw updateError;

        return res.status(200).json({ message: 'Meal added and totals updated' });
      } else {
        const { error: insertError } = await supabase.from('summaries').insert([
          {
            date: safeDate,
            workouts: [],
            sleep: {},
            nutrition
          }
        ]);

        if (insertError) throw insertError;

        return res.status(200).json({ message: 'Meal added in new summary' });
      }
    } catch (e) {
      console.error('❌ Error:', e.message);
      return res.status(500).json({ error: 'Insert/update failed', details: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
