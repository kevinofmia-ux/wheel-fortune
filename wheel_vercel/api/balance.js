export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  try {
    const response = await fetch(
      `http://${process.env.VPS_IP}:5000/api/balance?user_id=${user_id}`,
      { headers: { 'X-API-Key': process.env.API_SECRET } }
    )
    const data = await response.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: e.message })
  }
}
