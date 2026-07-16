import { ref, type Ref } from 'vue'
import type { MoodboardOrbitParams } from '@/types/moodboard'

// 拖拉旋轉資料夾軌道，手機與桌機共用。
// 幾何差異（軌道中心、舞台元素、縮放）由呼叫端以 getter 傳入，composable 本身不綁死任一版型。
export function useOrbitDrag(
  getStageEl: () => HTMLElement | null,
  scaleRef: Ref<number>,
  orbitPhaseRef: Ref<number>,
  enabledRef: Ref<boolean>,
  getCenter: () => Pick<MoodboardOrbitParams, 'cx' | 'cy'>,
  // 起拖命中判定（舞台座標）：只有落在資料夾附近才起拖。預設整片可拖。
  canStartAt: (p: { x: number; y: number }) => boolean = () => true
) {
  const mHover = ref(-1)
  const dragging = ref(false)
  let didDrag = false
  let dragStart: { x: number; y: number } | null = null
  let dragLastAng = 0

  function evtPoint(e: PointerEvent) {
    const t = (e as PointerEvent & { touches?: Touch[] }).touches?.[0] ?? e
    const el = getStageEl()
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return {
      x: (t.clientX - r.left) / scaleRef.value,
      y: (t.clientY - r.top) / scaleRef.value
    }
  }

  function onDragStart(e: PointerEvent) {
    if (!enabledRef.value) return
    const p = evtPoint(e)
    // 只有落在資料夾附近才起拖，避免整個版面（含軌道弧線空白處）都能拖。
    if (!canStartAt(p)) return
    const c = getCenter()
    dragging.value = true
    didDrag = false
    dragStart = p
    dragLastAng = Math.atan2(p.y - c.cy, p.x - c.cx)
  }

  function onDragMove(e: PointerEvent) {
    if (!dragging.value) return
    const p = evtPoint(e)
    const c = getCenter()
    if (Math.hypot(p.x - dragStart!.x, p.y - dragStart!.y) > 6) didDrag = true
    const ang = Math.atan2(p.y - c.cy, p.x - c.cx)
    let d = ang - dragLastAng
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    orbitPhaseRef.value += d
    dragLastAng = ang
  }

  function onDragEnd() {
    dragging.value = false
  }

  function consumeDidDrag(): boolean {
    if (didDrag) { didDrag = false; return true }
    return false
  }

  return { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag }
}
