// failas: api/index.js

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
  } catch (e) {
    return res.status(500).json({ error: 'Failed to parse health data', details: e.message });
  }

  console.log('✅ Gauti duomenys:', JSON.stringify(data, null, 2));

  lastSummary = result;
  return res.status(200).json({ message: '✅ JSON gautas!', parsed: result });
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
