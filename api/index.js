// failas: api/index.js

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
    const workouts = data?.workouts || [];
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
    const metrics = data?.metrics || [];
    for (const metric of metrics) {
      if (["protein", "carbohydrates", "total_fat", "dietary_energy"].includes(metric.name)) {
        result.nutrition[metric.name] = metric.data?.[0]?.qty || 0;
      }
    }

    // SLEEP
    const sleepSessions = data?.sleep_analysis || [];
    const totalSleepMinutes = sleepSessions.reduce((sum, s) => sum + (s.value || 0), 0);
    result.sleep.totalMinutes = totalSleepMinutes;

  } catch (e) {
    return res.status(500).json({ error: 'Failed to parse health data', details: e.message });
  }

  console.log('Gauti duomenys:', JSON.stringify(data, null, 2));

  return res.status(200).json({ message: '✅ JSON gautas!', parsed: result });
}
