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
        activeEnergyBurned: workout.activeEnergyBurned?.qty,
        heartRateAvg: workout.heartRateData?.[0]?.Avg,
        steps: workout.stepCount?.reduce((sum, s) => sum + (s.qty || 0), 0),
      });
    }

    // NUTRITION
    const nutrition = data?.data?.metrics || [];
    for (const metric of nutrition) {
      if (['protein', 'carbohydrates', 'total_fat', 'dietary_energy'].includes(metric.name)) {
        result.nutrition[metric.name] = metric.data?.[0]?.qty || 0;
      }
    }

    // SLEEP
    const sleep = nutrition.find((m) => m.name === 'sleep_analysis');
    if (sleep) {
      const s = sleep.data?.[0] || {};
      result.sleep = {
        totalSleep: s.totalSleep,
        deep: s.deep,
        rem: s.rem,
        core: s.core,
        awake: s.awake,
        start: s.sleepStart,
        end: s.sleepEnd,
      };
    }

    res.status(200).json({
      message: '✅ Duomenys apdoroti',
      summary: result,
    });
  } catch (e) {
    console.error('Klaida:', e);
    res.status(500).json({ error: 'Vidinė serverio klaida', details: e.message });
  }
}
