// src/components/feature/moodboard/sphere.ts
import * as THREE from 'three'

type TextureWithAspect = THREE.Texture & { _aspect: number }
import { fibSphere } from './layout'
import { SPRITE_RADIUS, type MoodboardOrbitImage } from './config'

export interface SphereHandle {
  resize: () => void
  dispose: () => void
}

export function initSphere(
  canvas: HTMLCanvasElement,
  getScale: () => number,
  getHasFolders: () => boolean,
  images: MoodboardOrbitImage[]
): SphereHandle {
  // sphereDPR as private closure (uses getScale() instead of scale.value)
  function sphereDPR() {
    return Math.min((window.devicePixelRatio || 1) * Math.max(1, getScale()), 3)
  }

  // renderer init (from original lines 1165–1177)
  const W = canvas.clientWidth || 880
  const H = canvas.clientHeight || 840
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(sphereDPR())
  renderer.setClearColor(0x000000, 0)
  renderer.setSize(W, H, false)
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
  camera.position.set(0, 0, 7)
  const scene = new THREE.Scene()
  const group = new THREE.Group()
  scene.add(group)

  // makeFallbackTexture as private closure (from original lines 1135–1161, logic unchanged)
  function makeFallbackTexture(i: number) {
    const w = 240, h = 320, cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    const ctx = cv.getContext('2d')!
    const tones: [string, string][] = [
      ['#3c3d42', '#17181c'], ['#47484d', '#1d1e22'],
      ['#2f3034', '#141519'], ['#4a4b51', '#222329'], ['#36373c', '#1a1b1f']
    ]
    const [c0, c1] = tones[i % tones.length]
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, c0); g.addColorStop(1, c1)
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2
    ctx.strokeRect(1, 1, w - 2, h - 2)
    const t = new THREE.CanvasTexture(cv)
    ;(t as unknown as TextureWithAspect)._aspect = w / h
    return t
  }

  const positions = fibSphere(images.length, SPRITE_RADIUS)
  const textures: THREE.Texture[] = new Array(images.length)
  const sprites: THREE.Sprite[] = []
  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'anonymous'
  let rafId = 0

  // build() + animate() (from original lines 1186–1241, getHasFolders() replaces hasFolders.value)
  function build() {
    positions.forEach((pos, i) => {
      const tex = textures[i]
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      )
      sp.userData.isPlaceholder = images[i].isPlaceholder
      const a = (tex as unknown as TextureWithAspect)._aspect || 0.75
      sp.scale.set(0.9 * a, 0.9, 1)
      sp.position.copy(pos)
      group.add(sp)
      sprites.push(sp)
    })
    animate()
  }

  let done = 0
  const finishOne = () => { if (++done >= images.length) build() }

  images.forEach((image, i) => {
    loader.load(
      image.src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        tex.minFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        ;(tex as unknown as TextureWithAspect)._aspect = (tex.image?.naturalWidth || 3) / (tex.image?.naturalHeight || 4)
        textures[i] = tex
        finishOne()
      },
      undefined,
      () => { textures[i] = makeFallbackTexture(i); finishOne() }
    )
  })

  const tmp = new THREE.Vector3()
  let t = 0
  function animate() {
    rafId = requestAnimationFrame(animate)
    if (!getHasFolders()) return
    t += 0.004
    group.rotation.y = t
    group.rotation.x = Math.sin(t * 0.22) * 0.13
    for (const sp of sprites) {
      sp.getWorldPosition(tmp)
      const k = Math.max(0, Math.min(1, (tmp.z + SPRITE_RADIUS) / (2 * SPRITE_RADIUS)))
      sp.material.opacity = sp.userData.isPlaceholder ? 0.35 : 0.55 + 0.45 * k
    }
    renderer.render(scene, camera)
  }

  // resize (from original resizeSphere lines 1108–1118, uses sphereDPR() closure)
  function resize() {
    const W2 = canvas.clientWidth, H2 = canvas.clientHeight
    if (!W2 || !H2) return
    renderer.setPixelRatio(sphereDPR())
    renderer.setSize(W2, H2, false)
    camera.aspect = W2 / H2
    camera.updateProjectionMatrix()
  }

  function dispose() {
    cancelAnimationFrame(rafId)
    textures.forEach((texture) => texture.dispose())
    renderer.dispose()
  }

  return { resize, dispose }
}
