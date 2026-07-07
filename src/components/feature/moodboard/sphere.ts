// src/components/feature/moodboard/sphere.ts
import * as THREE from 'three'

type TextureWithAspect = THREE.Texture & { _aspect: number }
import { fibSphere } from './layout'
import { SPRITE_RADIUS, type MoodboardOrbitImage } from './config'

export interface SphereHandle {
  resize: () => void
  updateImages: (images: MoodboardOrbitImage[]) => void
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
    const w = 240,
      h = 320,
      cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d')!
    const tones: [string, string][] = [
      ['#3c3d42', '#17181c'],
      ['#47484d', '#1d1e22'],
      ['#2f3034', '#141519'],
      ['#4a4b51', '#222329'],
      ['#36373c', '#1a1b1f']
    ]
    const [c0, c1] = tones[i % tones.length]
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, c0)
    g.addColorStop(1, c1)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, w - 2, h - 2)
    const t = new THREE.CanvasTexture(cv)
    ;(t as unknown as TextureWithAspect)._aspect = w / h
    return t
  }

  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'anonymous'
  let textures: THREE.Texture[] = []
  let sprites: THREE.Sprite[] = []
  let pendingTextures: THREE.Texture[] = []
  let rafId = 0
  let disposed = false
  let loadVersion = 0
  let requestedImagesKey: string | null = null
  let animationStarted = false
  const tmp = new THREE.Vector3()
  let t = 0

  function disposeTextures(list: THREE.Texture[]) {
    list.forEach((texture) => texture.dispose())
  }

  function clearSprites() {
    sprites.forEach((sprite) => {
      group.remove(sprite)
      sprite.material.dispose()
    })
    sprites = []
    disposeTextures(textures)
    textures = []
  }

  function animate() {
    if (disposed) return
    rafId = requestAnimationFrame(animate)
    if (!getHasFolders()) return
    t += 0.004
    group.rotation.y = t
    group.rotation.x = Math.sin(t * 0.22) * 0.13
    for (const sp of sprites) {
      sp.getWorldPosition(tmp)
      const k = Math.max(0, Math.min(1, (tmp.z + SPRITE_RADIUS) / (2 * SPRITE_RADIUS)))
      sp.material.opacity = sp.userData.isPlaceholder ? 0.15 : 0.65 + 0.45 * k
    }
    renderer.render(scene, camera)
  }

  function updateImages(nextImages: MoodboardOrbitImage[]) {
    if (disposed) return

    const imagesKey = JSON.stringify(
      nextImages.map(({ id, src, isPlaceholder }) => [id, src, isPlaceholder])
    )
    if (imagesKey === requestedImagesKey) return
    requestedImagesKey = imagesKey

    const version = ++loadVersion
    disposeTextures(pendingTextures)
    pendingTextures = []

    if (nextImages.length === 0) {
      clearSprites()
      return
    }

    const positions = fibSphere(nextImages.length, SPRITE_RADIUS)
    const loadedTextures: THREE.Texture[] = new Array(nextImages.length)
    let loadedCount = 0

    const finishOne = () => {
      if (++loadedCount < nextImages.length || disposed || version !== loadVersion) return

      const nextSprites = positions.map((position, index) => {
        const texture = loadedTextures[index]
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
        )
        sprite.userData.isPlaceholder = nextImages[index].isPlaceholder
        const aspect = (texture as unknown as TextureWithAspect)._aspect || 0.75
        sprite.scale.set(0.9 * aspect, 0.9, 1)
        sprite.position.copy(position)
        return sprite
      })

      pendingTextures = []
      clearSprites()
      textures = loadedTextures
      sprites = nextSprites
      sprites.forEach((sprite) => group.add(sprite))

      if (!animationStarted) {
        animationStarted = true
        animate()
      }
    }

    nextImages.forEach((image, index) => {
      loader.load(
        image.src,
        (texture) => {
          if (disposed || version !== loadVersion) {
            texture.dispose()
            return
          }
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
          texture.minFilter = THREE.LinearFilter
          texture.generateMipmaps = false
          ;(texture as unknown as TextureWithAspect)._aspect =
            (texture.image?.naturalWidth || 3) / (texture.image?.naturalHeight || 4)
          loadedTextures[index] = texture
          pendingTextures.push(texture)
          finishOne()
        },
        undefined,
        () => {
          if (disposed || version !== loadVersion) return
          const texture = makeFallbackTexture(index)
          loadedTextures[index] = texture
          pendingTextures.push(texture)
          finishOne()
        }
      )
    })
  }

  // resize (from original resizeSphere lines 1108–1118, uses sphereDPR() closure)
  function resize() {
    const W2 = canvas.clientWidth,
      H2 = canvas.clientHeight
    if (!W2 || !H2) return
    renderer.setPixelRatio(sphereDPR())
    renderer.setSize(W2, H2, false)
    camera.aspect = W2 / H2
    camera.updateProjectionMatrix()
  }

  function dispose() {
    disposed = true
    loadVersion += 1
    cancelAnimationFrame(rafId)
    disposeTextures(pendingTextures)
    pendingTextures = []
    clearSprites()
    renderer.dispose()
  }

  updateImages(images)

  return { resize, updateImages, dispose }
}
