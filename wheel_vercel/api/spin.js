export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, username, first_name } = req.body || {}
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  try {
    const response = await fetch(
      `http://${process.env.VPS_IP}:5000/api/spin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.API_SECRET,
        },
        body: JSON.stringify({ user_id, username, first_name }),
      }
    )
    const data = await response.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: e.message })
  }
}
