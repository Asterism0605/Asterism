import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { MoodboardOrbitParams } from '@/types/moodboard'

// 拖拉旋轉資料夾軌道，手機與桌機共用。
// 幾何差異（軌道中心、舞台元素、縮放）由呼叫端以 getter 傳入，composable 本身不綁死任一版型。
export function useOrbitDrag(
  getStageEl: () => HTMLElement | null,
  scaleRef: Ref<number>,
  orbitPhaseRef: Ref<number>,
  enabledRef: Ref<boolean>,
  getCenter: () => Pick<MoodboardOrbitParams, 'cx' | 'cy'>
) {
  const mHover = ref(-1)
  const dragging = ref(false)
  let didDrag = false
  let dragStart: { x: number; y: number } | null = null
  let dragLastAng = 0
  let dragRect: DOMRect | null = null
  let activePointerId: number | null = null
  let captureTarget: HTMLElement | null = null
  let pendingAngleDelta = 0
  let dragRaf = 0

  function evtPoint(e: PointerEvent) {
    const t = (e as PointerEvent & { touches?: Touch[] }).touches?.[0] ?? e
    const el = getStageEl()
    if (!el) return { x: 0, y: 0 }
    const r = dragRect ?? el.getBoundingClientRect()
    return {
      x: (t.clientX - r.left) / scaleRef.value,
      y: (t.clientY - r.top) / scaleRef.value
    }
  }

  function flushPendingAngle() {
    if (pendingAngleDelta === 0) return
    orbitPhaseRef.value += pendingAngleDelta
    pendingAngleDelta = 0
  }

  function scheduleAngleUpdate(delta: number) {
    pendingAngleDelta += delta
    if (dragRaf) return
    dragRaf = window.requestAnimationFrame(() => {
      dragRaf = 0
      flushPendingAngle()
    })
  }

  function onDragStart(e: PointerEvent) {
    if (!enabledRef.value) return
    const el = getStageEl()
    if (!el) return
    dragRect = el.getBoundingClientRect()
    const p = evtPoint(e)
    const c = getCenter()
    dragging.value = true
    didDrag = false
    dragStart = p
    dragLastAng = Math.atan2(p.y - c.cy, p.x - c.cx)
    activePointerId = e.pointerId
    captureTarget = e.currentTarget instanceof HTMLElement ? e.currentTarget : el
  }

  function onDragMove(e: PointerEvent) {
    if (!dragging.value || (activePointerId !== null && e.pointerId !== activePointerId)) return
    const p = evtPoint(e)
    const c = getCenter()
    if (!didDrag && Math.hypot(p.x - dragStart!.x, p.y - dragStart!.y) > 6) {
      didDrag = true
      if (activePointerId !== null) captureTarget?.setPointerCapture?.(activePointerId)
    }
    const ang = Math.atan2(p.y - c.cy, p.x - c.cx)
    let d = ang - dragLastAng
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    scheduleAngleUpdate(d)
    dragLastAng = ang
  }

  function onDragEnd(e?: PointerEvent) {
    if (activePointerId !== null && e && e.pointerId !== activePointerId) return false
    const endedWithDrag = dragStart !== null && didDrag
    if (dragRaf) {
      window.cancelAnimationFrame(dragRaf)
      dragRaf = 0
    }
    flushPendingAngle()
    if (activePointerId !== null && captureTarget?.hasPointerCapture?.(activePointerId)) {
      captureTarget.releasePointerCapture(activePointerId)
    }
    dragging.value = false
    dragStart = null
    dragRect = null
    activePointerId = null
    captureTarget = null
    return endedWithDrag
  }

  function consumeDidDrag(): boolean {
    if (didDrag) { didDrag = false; return true }
    return false
  }

  onBeforeUnmount(() => {
    if (dragRaf) window.cancelAnimationFrame(dragRaf)
  })

  return { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag }
}
