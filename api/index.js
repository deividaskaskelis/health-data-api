let lastSummary = null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const payload = req.body?.data;

  if (!payload || !payload.date) {
    return res.status(400).json({ error: 'Missing data or date field' });
  }

  // Supabase insert
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/summaries`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        date: payload.date,
        workouts: payload.workouts || [],
        nutrition: payload.nutrition || {},
        sleep: payload.sleep || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Failed to insert into Supabase', details: errorText });
    }

    lastSummary = payload;
    return res.status(200).json({ message: '✅ Duomenys įrašyti į Supabase', inserted: payload.date });

  } catch (e) {
    return res.status(500).json({ error: 'Exception during insert', details: e.message });
  }
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
