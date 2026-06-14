// src/pages/MoodboardOrbit/useMobileOrbit.ts
import { ref, type Ref } from 'vue'
import { M_HOME_ORBIT } from './config'

export function useMobileOrbit(
  mStageRef: Ref<HTMLElement | null>,
  scaleRef: Ref<number>,
  orbitPhaseRef: Ref<number>,
  hasFoldersRef: Ref<boolean>
) {
  const mHover = ref(-1)
  const dragging = ref(false)
  let didDrag = false
  let dragStart: { x: number; y: number } | null = null
  let dragLastAng = 0

  function evtPoint(e: PointerEvent) {
    const t = (e as PointerEvent & { touches?: Touch[] }).touches?.[0] ?? e
    const r = mStageRef.value!.getBoundingClientRect()
    return {
      x: (t.clientX - r.left) / scaleRef.value,
      y: (t.clientY - r.top) / scaleRef.value
    }
  }

  function onDragStart(e: PointerEvent) {
    if (!hasFoldersRef.value) return
    const p = evtPoint(e)
    dragging.value = true
    didDrag = false
    dragStart = p
    dragLastAng = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx)
  }

  function onDragMove(e: PointerEvent) {
    if (!dragging.value) return
    const p = evtPoint(e)
    if (Math.hypot(p.x - dragStart!.x, p.y - dragStart!.y) > 6) didDrag = true
    let ang = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx)
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
