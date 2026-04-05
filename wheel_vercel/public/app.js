// =============================================
//  Roue de la Fortune — Telegram Mini App
// =============================================

const tg = window.Telegram.WebApp
tg.ready()
tg.expand()

// ---- 5 segments VISUELS égaux ----
// Index 0-3 = prizes actifs côté serveur / Index 4 = déco seulement
const PRIZES = [
  { id: 'lingerie',         emoji: '👙', line1: 'Lot',         line2: 'Lingerie',    color: '#c0187a', dark: '#8e1259' },
  { id: 'free_spin',        emoji: '🎡', line1: 'Tour',        line2: 'Gratuit',     color: '#1a6eb5', dark: '#14518a' },
  { id: 'lingerie_topless', emoji: '🔥', line1: 'Pack',        line2: 'Topless',     color: '#c75000', dark: '#963c00' },
  { id: 'full_pack',        emoji: '💎', line1: 'Pack',        line2: 'Complet',     color: '#7d3c98', dark: '#5b2c72' },
  { id: 'solo_video',       emoji: '🎬', line1: 'Vidéo',       line2: 'Solo',        color: '#148a70', dark: '#0d6652' },
]

const N   = PRIZES.length           // 5
const SEG = (2 * Math.PI) / N      // 72° chacun

// ---- Canvas haute résolution ----
const canvas = document.getElementById('wheelCanvas')
const ctx    = canvas.getContext('2d')
const DISPLAY_SIZE = 300
const DPR    = window.devicePixelRatio || 1

canvas.width        = DISPLAY_SIZE * DPR
canvas.height       = DISPLAY_SIZE * DPR
canvas.style.width  = DISPLAY_SIZE + 'px'
canvas.style.height = DISPLAY_SIZE + 'px'
ctx.scale(DPR, DPR)

const CX = DISPLAY_SIZE / 2
const CY = DISPLAY_SIZE / 2
const R  = DISPLAY_SIZE / 2 - 8

let rotation = -Math.PI / 2 - SEG / 2
let spinning = false

// ---- Dessin de la roue ----
function drawWheel(rot) {
  ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE)

  // Ombre
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur  = 24
  ctx.beginPath()
  ctx.arc(CX, CY, R + 6, 0, 2 * Math.PI)
  ctx.fillStyle = '#f1c40f'
  ctx.fill()
  ctx.restore()

  PRIZES.forEach((p, i) => {
    const a0  = rot + i * SEG
    const a1  = a0 + SEG
    const mid = a0 + SEG / 2

    // Segment dégradé
    const grd = ctx.createRadialGradient(CX, CY, R * 0.15, CX, CY, R)
    grd.addColorStop(0, p.color)
    grd.addColorStop(1, p.dark)

    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, R, a0, a1)
    ctx.closePath()
    ctx.fillStyle = grd
    ctx.fill()

    // Séparateur blanc
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth   = 2
    ctx.stroke()

    // Texte
    const tr = R * 0.68
    const tx = CX + tr * Math.cos(mid)
    const ty = CY + tr * Math.sin(mid)

    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(mid + Math.PI / 2)
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'

    // Emoji
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur  = 4
    ctx.font = '18px Arial'
    ctx.fillText(p.emoji, 0, -15)

    // Ligne 1
    ctx.fillStyle = '#ffffff'
    ctx.font      = 'bold 9.5px Arial'
    ctx.shadowBlur = 3
    ctx.fillText(p.line1, 0, 0)

    // Ligne 2
    ctx.font = 'bold 9.5px Arial'
    ctx.fillText(p.line2, 0, 11)

    ctx.restore()
  })

  // Anneau doré
  ctx.beginPath()
  ctx.arc(CX, CY, R, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,215,0,0.7)'
  ctx.lineWidth   = 3
  ctx.stroke()

  // Centre
  const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 30)
  cg.addColorStop(0, '#fff9e6')
  cg.addColorStop(1, '#f1c40f')
  ctx.beginPath()
  ctx.arc(CX, CY, 30, 0, 2 * Math.PI)
  ctx.fillStyle = cg
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth   = 2
  ctx.stroke()

  // Étoile centre
  ctx.font      = '22px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⭐', CX, CY)
}

// ---- Animation ----
function animateTo(prizeIndex, onDone) {
  const segCenter = prizeIndex * SEG + SEG / 2
  const target    = -Math.PI / 2 - segCenter
  const turns     = 6 * 2 * Math.PI
  let   delta     = ((target - rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  if (delta < 0.2) delta += 2 * Math.PI
  const finalRot  = rotation + turns + delta
  const duration  = 4200 + Math.random() * 600
  const startTime = performance.now()
  const startRot  = rotation

  function ease(t) { return 1 - Math.pow(1 - t, 4) }

  function step(now) {
    const t  = Math.min((now - startTime) / duration, 1)
    rotation = startRot + (finalRot - startRot) * ease(t)
    drawWheel(rotation)
    if (t < 1) requestAnimationFrame(step)
    else { rotation = finalRot; spinning = false; onDone() }
  }

  spinning = true
  requestAnimationFrame(step)
}

// ---- UI ----
const spinBtn   = document.getElementById('btnSpin')
const resultBox = document.getElementById('resultBox')
const spinLabel = document.getElementById('spinCount')
const loaderEl  = document.getElementById('loader')

function setSpinCount(n) {
  spinLabel.textContent = n
  spinBtn.disabled      = false
  spinBtn.textContent   = n > 0
    ? `🎡 Tourner  (${n} tour${n > 1 ? 's' : ''} dispo)`
    : '🎡 Tourner — 500 ⭐'
}

function showResult(prize, desc) {
  const p = PRIZES.find(x => x.id === prize.id)
  resultBox.className = 'result-box show' + (prize.is_win ? ' win' : '')
  resultBox.innerHTML = `
    <span class="emoji">${p ? p.emoji : '🎰'}</span>
    <div class="title">${prize.name}</div>
    <div class="desc">${desc}</div>
  `
}

// ---- API ----
const user = tg.initDataUnsafe?.user || {}

async function fetchBalance() {
  try {
    const r = await fetch(`/api/balance?user_id=${user.id}`)
    const d = await r.json()
    setSpinCount(d.spins || 0)
  } catch { setSpinCount(0) }
}

async function doSpin() {
  if (spinning) return
  resultBox.className = 'result-box'
  loaderEl.classList.add('show')
  spinBtn.disabled = true

  try {
    const r = await fetch('/api/spin', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        user_id:    user.id,
        username:   user.username   || '',
        first_name: user.first_name || 'User',
      }),
    })
    const d = await r.json()
    loaderEl.classList.remove('show')

    if (d.error) { buySpins('spin_1'); spinBtn.disabled = false; return }

    animateTo(d.prize.index, () => {
      setSpinCount(d.spins_left)
      const desc = d.prize.is_win
        ? `✨ ${d.prize.description}<br><br>📩 L'admin te contactera dès qu'il sera en ligne !`
        : d.prize.is_free_spin
          ? '✅ 1 tour gratuit ajouté à ton solde !'
          : '😔 Pas de chance… Retente ta chance !'
      showResult(d.prize, desc)
    })
  } catch {
    loaderEl.classList.remove('show')
    spinBtn.disabled = false
    alert('Erreur réseau, réessaie.')
  }
}

async function buySpins(type) {
  try {
    const r = await fetch(`/api/invoice?type=${type}`)
    const d = await r.json()
    if (!d.url) { alert('Erreur paiement.'); return }
    tg.openInvoice(d.url, async status => {
      if (status === 'paid') {
        await new Promise(res => setTimeout(res, 2000))
        await fetchBalance()
        tg.showAlert('✅ Paiement confirmé ! Tes tours ont été ajoutés.')
      }
    })
  } catch { alert('Erreur réseau.') }
}

// ---- Init ----
drawWheel(rotation)
fetchBalance()
