export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const type = req.method === 'POST' ? req.body?.type : req.query?.type

  const configs = {
    spin_1:  { title: '🎡 1 Tour de Roue',  description: 'Lance la roue et tente de gagner !', amount: 500   },
    spin_10: { title: '🎡 Pack 10 Tours',    description: '10 tours — économise 10% !',         amount: 4500  },
    spin_30: { title: '🎡 Pack 30 Tours',    description: '30 tours — économise 23% !',         amount: 11500 },
  }

  const cfg = configs[type]
  if (!cfg) return res.status(400).json({ error: 'Invalid type' })

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          cfg.title,
          description:    cfg.description,
          payload:        type,
          provider_token: '',
          currency:       'XTR',
          prices:         [{ label: cfg.title, amount: cfg.amount }],
        }),
      }
    )
    const tgData = await tgRes.json()
    if (!tgData.ok) return res.status(500).json({ error: 'Telegram error', detail: tgData })
    res.json({ url: tgData.result })
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: e.message })
  }
}
