// =============================================
//  Roue de la Fortune — Telegram Mini App
// =============================================

const tg = window.Telegram.WebApp
tg.ready()
tg.expand()

// ---- Prizes — visuellement égaux, proba côté serveur ----
const PRIZES = [
  { id: 'lose',             emoji: '😔', name: 'Perdu',             color: '#c0392b', dark: '#922b21' },
  { id: 'lingerie',         emoji: '👙', name: 'Lingerie',           color: '#c0187a', dark: '#96125f' },
  { id: 'free_spin',        emoji: '🎡', name: 'Tour Gratuit',       color: '#2471a3', dark: '#1a5276' },
  { id: 'lingerie_topless', emoji: '🔥', name: 'Lingerie+Topless',   color: '#d35400', dark: '#a04000' },
  { id: 'full_pack',        emoji: '💎', name: 'Pack Complet',       color: '#7d3c98', dark: '#6c3483' },
  { id: 'solo_video',       emoji: '🎬', name: 'Vidéo Solo',         color: '#117a65', dark: '#0e6655' },
]

// Segments égaux visuellement
const N = PRIZES.length
const SEG = (2 * Math.PI) / N   // 60° chacun

// ---- Canvas ----
const canvas = document.getElementById('wheelCanvas')
const ctx    = canvas.getContext('2d')
const SIZE   = canvas.width
const CX     = SIZE / 2
const CY     = SIZE / 2
const R      = SIZE / 2 - 8
const R_TEXT = R * 0.72

let rotation = -Math.PI / 2 - SEG / 2  // premier segment centré en haut
let spinning = false

// ---- Draw ----
function drawWheel(rot) {
  ctx.clearRect(0, 0, SIZE, SIZE)

  // Ombre externe
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur  = 20
  ctx.beginPath()
  ctx.arc(CX, CY, R + 6, 0, 2 * Math.PI)
  ctx.fillStyle = '#f1c40f'
  ctx.fill()
  ctx.restore()

  // Segments
  PRIZES.forEach((p, i) => {
    const a0 = rot + i * SEG
    const a1 = a0 + SEG

    // Segment principal
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, R, a0, a1)
    ctx.closePath()

    // Dégradé radial
    const grad = ctx.createRadialGradient(CX, CY, R * 0.2, CX, CY, R)
    grad.addColorStop(0, p.color)
    grad.addColorStop(1, p.dark)
    ctx.fillStyle = grad
    ctx.fill()

    // Séparateur
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth   = 2
    ctx.stroke()

    // Texte & emoji
    const mid = rot + i * SEG + SEG / 2
    const ex  = CX + R_TEXT * Math.cos(mid)
    const ey  = CY + R_TEXT * Math.sin(mid)

    ctx.save()
    ctx.translate(ex, ey)
    ctx.rotate(mid + Math.PI / 2)
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'

    // Emoji
    ctx.font = '20px Arial'
    ctx.fillText(p.emoji, 0, -14)

    // Nom (max 2 lignes)
    ctx.fillStyle = '#ffffff'
    ctx.font      = 'bold 9px Arial'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur  = 3
    const words = p.name.split(' ')
    if (words.length === 1) {
      ctx.fillText(words[0], 0, 2)
    } else if (words.length === 2) {
      ctx.fillText(words[0], 0, -2)
      ctx.fillText(words[1], 0, 9)
    } else {
      ctx.fillText(words.slice(0, 2).join(' '), 0, -2)
      ctx.fillText(words.slice(2).join(' '),    0,  9)
    }

    ctx.restore()
  })

  // Anneau doré intérieur
  ctx.beginPath()
  ctx.arc(CX, CY, R, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(241,196,15,0.6)'
  ctx.lineWidth   = 3
  ctx.stroke()

  // Centre
  const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 28)
  cg.addColorStop(0, '#ffffff')
  cg.addColorStop(1, '#f1c40f')
  ctx.beginPath()
  ctx.arc(CX, CY, 28, 0, 2 * Math.PI)
  ctx.fillStyle = cg
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth   = 2
  ctx.stroke()

  // Étoile au centre
  ctx.font      = '20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⭐', CX, CY)
}

// ---- Animation vers un segment précis ----
function animateTo(prizeIndex, onDone) {
  // Centre du segment en haut = -π/2
  const segCenter = prizeIndex * SEG + SEG / 2
  const target    = -Math.PI / 2 - segCenter
  const turns     = 6 * 2 * Math.PI
  let   delta     = (target - rotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  if (delta < 0.1) delta += 2 * Math.PI
  const finalRot  = rotation + turns + delta

  const duration  = 4000 + Math.random() * 800
  const startTime = performance.now()
  const startRot  = rotation

  function ease(t) { return 1 - Math.pow(1 - t, 4) }

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1)
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
  spinBtn.disabled = false
  spinBtn.textContent = n > 0
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
