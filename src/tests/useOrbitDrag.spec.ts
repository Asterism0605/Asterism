import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useOrbitDrag } from '@/components/feature/moodboard/useOrbitDrag';

function createPointerEvent(
  type: string,
  pointerId: number,
  clientX: number,
  clientY: number
): PointerEvent {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY }
  });
  return event as PointerEvent;
}

describe('useOrbitDrag', () => {
  it('does not start a drag when the start point is rejected', () => {
    const stage = document.createElement('div');
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100));
    const canStartAt = vi.fn(() => false);
    let controller: ReturnType<typeof useOrbitDrag> | undefined;

    const wrapper = mount(
      defineComponent({
        setup() {
          const scaleRef = ref(1);
          const orbitPhaseRef = ref(0);
          const enabledRef = ref(true);
          controller = useOrbitDrag(
            () => stage,
            scaleRef,
            orbitPhaseRef,
            enabledRef,
            () => ({ cx: 50, cy: 50 }),
            canStartAt
          );
          return () => h('div');
        }
      })
    );

    controller?.onDragStart(createPointerEvent('pointerdown', 1, 40, 40));

    expect(canStartAt).toHaveBeenCalledWith({ x: 40, y: 40 });
    expect(controller?.dragging.value).toBe(false);
    expect(controller?.onDragEnd(createPointerEvent('pointerup', 1, 80, 80))).toBe(false);

    wrapper.unmount();
  });
});
