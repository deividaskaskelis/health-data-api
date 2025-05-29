export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const data = req.body;

  // 👇 Čia gali daryti ką nori su JSON – išsaugoti, filtruoti, analizuoti
  console.log("Gauti duomenys:", JSON.stringify(data, null, 2));

  res.status(200).json({ message: '✅ JSON gautas!', receivedKeys: Object.keys(data) });
}
