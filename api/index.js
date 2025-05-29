export default async function handler(req, res) {
  const data = req.method === "POST" ? req.body : { notice: "GET method test" };

  console.log("🧠 Gauti duomenys:", JSON.stringify(data, null, 2));

  res.status(200).json({
    message: "✅ Duomenys gauti",
    method: req.method,
    receivedKeys: Object.keys(data)
  });
}
