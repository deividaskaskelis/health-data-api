let lastSummary = null;

function getDateString(isoString) {
  return new Date(isoString).toISOString().split('T')[0];
}

export default async function handler(req, res) {
  console.log('🟢 API function reached');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const data = req.body;
  const groupedResults = {};

  try {
    // WORKOUTS
    const workouts = data?.data?.workouts || [];
    for (const workout of workouts) {
      const date = getDateString(workout.start);
      if (!groupedResults[date]) {
        groupedResults[date] = { date, workouts: [], nutrition: {}, sleep: {} };
      }
      groupedResults[date].workouts.push({
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
        const firstEntry = metric.data?.[0];
        if (firstEntry?.date) {
          const date = getDateString(firstEntry.date);
          if (!groupedResults[date]) {
            groupedResults[date] = { date, workouts: [], nutrition: {}, sleep: {} };
          }
          groupedResults[date].nutrition[metric.name] = firstEntry.qty || 0;
        }
      }
    }

    // SLEEP
    const sleepSessions = data?.data?.sleep_analysis || [];
    for (const session of sleepSessions) {
      const date = getDateString(session.date || session.start);
      if (!groupedResults[date]) {
        groupedResults[date] = { date, workouts: [], nutrition: {}, sleep: {} };
      }
      groupedResults[date].sleep.totalMinutes = (groupedResults[date].sleep.totalMinutes || 0) + (session.value || 0);
    }

    // SIUNTIMAS Į SUPABASE
    for (const day of Object.values(groupedResults)) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/summaries`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          date: day.date,
          workouts: day.workouts,
          nutrition: day.nutrition,
          sleep: day.sleep,
        }),
      });
    }

  } catch (e) {
    console.error('💥 INSERT ERROR:', e);
    return res.status(500).json({ error: 'Failed to parse or insert health data', details: e.message });
  }

  lastSummary = groupedResults;
  return res.status(200).json({ message: '✅ Duomenys įrašyti per kelias datas', parsed: groupedResults });
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
