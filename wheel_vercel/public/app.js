// =============================================
//  Roue de la Fortune — Telegram Mini App
// =============================================

const tg = window.Telegram.WebApp
tg.ready()
tg.expand()

// ---- Prizes (must match server order exactly) ----
const PRIZES = [
  { id: 'lose',             label: '😔',  name: 'Perdu',              color: '#c0392b', weight: 30 },
  { id: 'free_spin',        label: '🎡',  name: 'Tour Gratuit',        color: '#2471a3', weight: 20 },
  { id: 'lingerie',         label: '👙',  name: 'Lingerie',            color: '#c0187a', weight: 25 },
  { id: 'lingerie_topless', label: '🔥',  name: 'Lingerie+Topless',    color: '#d35400', weight: 20 },
  { id: 'full_pack',        label: '💎',  name: 'Pack Complet',        color: '#7d3c98', weight:  3 },
  { id: 'solo_video',       label: '🎬',  name: 'Vidéo Solo',          color: '#117a65', weight:  2 },
]

const TOTAL = PRIZES.reduce((s, p) => s + p.weight, 0)

// Pre-compute segment angles
let cumAngle = -Math.PI / 2  // start at top
const SEGMENTS = PRIZES.map(p => {
  const sweep = (p.weight / TOTAL) * 2 * Math.PI
  const seg = { ...p, startAngle: cumAngle, sweep }
  cumAngle += sweep
  return seg
})

// ---- Canvas ----
const canvas  = document.getElementById('wheelCanvas')
const ctx     = canvas.getContext('2d')
const CX      = canvas.width  / 2
const CY      = canvas.height / 2
const R       = canvas.width  / 2 - 6

let rotation  = 0
let spinning  = false
let spinCount = 0

// ---- Draw ----
function drawWheel (rot) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Gold border
  ctx.beginPath()
  ctx.arc(CX, CY, R + 5, 0, 2 * Math.PI)
  ctx.fillStyle = '#f1c40f'
  ctx.fill()

  SEGMENTS.forEach(seg => {
    const a0 = seg.startAngle + rot
    const a1 = a0 + seg.sweep

    // Segment fill
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, R, a0, a1)
    ctx.closePath()
    ctx.fillStyle = seg.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Label (emoji + short text)
    const mid    = a0 + seg.sweep / 2
    const textR  = R * 0.68
    const tx     = CX + textR * Math.cos(mid)
    const ty     = CY + textR * Math.sin(mid)

    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(mid + Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'

    // Emoji
    ctx.font = `${seg.sweep > 0.8 ? 18 : 14}px Arial`
    ctx.fillText(seg.label, 0, -12)

    // Text (only if segment large enough)
    if (seg.sweep > 0.35) {
      ctx.font = `bold ${seg.sweep > 0.8 ? 9 : 8}px Arial`
      const words = seg.name.split('+')
      words.forEach((w, i) => ctx.fillText(w.trim(), 0, i * 10))
    }

    ctx.restore()
  })

  // Centre circle
  ctx.beginPath()
  ctx.arc(CX, CY, 22, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(CX, CY, 18, 0, 2 * Math.PI)
  ctx.fillStyle = '#f1c40f'
  ctx.fill()
}

// ---- Spin animation ----
function animateTo (prizeIndex, onDone) {
  const seg    = SEGMENTS[prizeIndex]
  // angle where prize center sits (without rotation)
  const prizeCenter = seg.startAngle + seg.sweep / 2
  // we want prizeCenter + rot = -π/2 (top)
  // rot = -π/2 - prizeCenter
  const rawTarget   = -Math.PI / 2 - prizeCenter
  // ensure we spin at least 6 full turns forward
  const extraTurns  = Math.ceil((6 * Math.PI * 2 - (rawTarget - rotation)) / (2 * Math.PI))
  const finalRot    = rawTarget + extraTurns * 2 * Math.PI

  const duration  = 4500
  const startTime = performance.now()
  const startRot  = rotation

  function easeOut (t) { return 1 - Math.pow(1 - t, 4) }

  function step (now) {
    const t = Math.min((now - startTime) / duration, 1)
    rotation = startRot + (finalRot - startRot) * easeOut(t)
    drawWheel(rotation)
    if (t < 1) requestAnimationFrame(step)
    else { rotation = finalRot; spinning = false; onDone() }
  }

  spinning = true
  requestAnimationFrame(step)
}

// ---- UI helpers ----
const spinBtn    = document.getElementById('btnSpin')
const resultBox  = document.getElementById('resultBox')
const spinLabel  = document.getElementById('spinCount')
const loaderEl   = document.getElementById('loader')

function setSpinCount (n) {
  spinCount = n
  spinLabel.textContent = n
  spinBtn.disabled = false
  spinBtn.textContent = n > 0
    ? `🎡 Tourner  (${n} tour${n > 1 ? 's' : ''} dispo)`
    : '🎡 Tourner — 500 ⭐'
}

function showResult (prize, desc) {
  resultBox.className = 'result-box show' + (prize.is_win ? ' win' : '')
  resultBox.innerHTML = `
    <span class="emoji">${PRIZES.find(p => p.id === prize.id)?.label || '🎰'}</span>
    <div class="title">${prize.name}</div>
    <div class="desc">${desc}</div>
  `
  resultBox.scrollIntoView({ behavior: 'smooth' })
}

// ---- API calls ----
const user = tg.initDataUnsafe?.user || {}

async function fetchBalance () {
  try {
    const r = await fetch(`/api/balance?user_id=${user.id}`)
    const d = await r.json()
    setSpinCount(d.spins || 0)
  } catch { setSpinCount(0) }
}

async function doSpin () {
  if (spinning) return
  loaderEl.classList.add('show')
  spinBtn.disabled = true
  resultBox.className = 'result-box'

  try {
    const r = await fetch('/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:    user.id,
        username:   user.username   || '',
        first_name: user.first_name || 'User',
      }),
    })
    const d = await r.json()
    loaderEl.classList.remove('show')

    if (d.error) {
      // No spins → buy flow
      buySpins('spin_1')
      spinBtn.disabled = false
      return
    }

    animateTo(d.prize.index, () => {
      setSpinCount(d.spins_left)
      const desc = d.prize.is_win
        ? `✨ ${d.prize.description}\n\n📩 L'admin te contactera dès qu'il sera en ligne !`
        : d.prize.is_free_spin
          ? '✅ 1 tour gratuit ajouté à ton solde !'
          : 'Pas de chance… Retente ta chance !'
      showResult(d.prize, desc)
    })
  } catch (e) {
    loaderEl.classList.remove('show')
    spinBtn.disabled = false
    alert('Erreur réseau, réessaie.')
  }
}

async function buySpins (type) {
  try {
    const r = await fetch(`/api/invoice?type=${type}`)
    const d = await r.json()
    if (!d.url) { alert('Erreur lors de la création du paiement.'); return }

    tg.openInvoice(d.url, async (status) => {
      if (status === 'paid') {
        // Wait a moment for bot to process payment then refresh balance
        await new Promise(res => setTimeout(res, 2000))
        await fetchBalance()
        tg.showAlert('✅ Paiement confirmé ! Tes tours ont été ajoutés.')
      }
    })
  } catch { alert('Erreur réseau, réessaie.') }
}

// ---- Init ----
drawWheel(0)
fetchBalance()
