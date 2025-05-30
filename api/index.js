let lastSummary = null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const data = req.body;
  const result = {
    date: new Date().toISOString().split('T')[0],
    workouts: [],
    nutrition: {},
    sleep: {},
  };

  try {
    // WORKOUTS
    const workouts = data?.data?.workouts || [];
    for (const workout of workouts) {
      result.workouts.push({
        name: workout.name,
        start: workout.start,
        end: workout.end,
        activeEnergyBurned: workout.activeEnergyBurned?.[0]?.qty,
        heartRateAvg: workout.heartRateData?.[0]?.Avg,
        steps: workout.stepCount?.reduce((sum, s) => sum + (s.qty || 0), 0),
      });
    }

    // NUTRITION
    const nutrition = data?.data?.metrics || [];
    for (const metric of nutrition) {
      if (["protein", "carbohydrates", "total_fat", "dietary_energy"].includes(metric.name)) {
        result.nutrition[metric.name] = metric.data?.[0]?.qty || 0;
      }
    }

    // SLEEP
    const sleepSessions = data?.data?.sleep_analysis || [];
    const totalSleepMinutes = sleepSessions.reduce((sum, s) => sum + (s.value || 0), 0);
    result.sleep.totalMinutes = totalSleepMinutes;

    // 🔽 SUPABASE INSERT
    await fetch('https://YOUR_PROJECT_ID.supabase.co/rest/v1/summaries', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        date: result.date,
        workouts: result.workouts,
        nutrition: result.nutrition,
        sleep: result.sleep,
      }),
    });

  } catch (e) {
    return res.status(500).json({ error: 'Failed to parse or insert health data', details: e.message });
  }

  lastSummary = result;
  return res.status(200).json({ message: '✅ JSON gautas ir įrašytas į DB', parsed: result });
}

export async function getLastSummary(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }
  if (!lastSummary) {
    return res.status(404).json({ error: 'No data received yet' });
  }
  return res.status(200).json(lastSummary);
}
