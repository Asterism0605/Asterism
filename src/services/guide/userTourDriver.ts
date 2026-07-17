import { h, render } from 'vue';
import { driver, type Alignment, type Driver, type PopoverDOM, type Side } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/styles/user-tour.css';
import UserTourActions from '@/components/feature/guide/UserTourActions.vue';
import UserTourCloseButton from '@/components/feature/guide/UserTourCloseButton.vue';

const TOUR_OVERLAY_Z_INDEX = '900';
const TOUR_MULTI_HIGHLIGHT_Z_INDEX = '901';
const TOUR_POPOVER_Z_INDEX = '902';

interface HighlightOverlay {
  update: () => void;
  destroy: () => void;
}

export interface UserTourPresentation {
  target: string | Element | (() => Element | null);
  title: string;
  description: string;
  progressLabel: string;
  previousLabel?: string;
  nextLabel?: string;
  closeLabel: string;
  side?: Side;
  align?: Alignment;
  allowInteraction?: boolean;
  multiTargetSelector?: string;
  centerPopover?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose: () => void;
}

function resolveTarget(target: UserTourPresentation['target']): Element | null {
  if (typeof target === 'string') return document.querySelector(target);
  if (typeof target === 'function') return target();
  return target;
}

function createRoundedRectPath(rect: DOMRect, padding: number): string {
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(window.innerWidth, rect.right + padding);
  const bottom = Math.min(window.innerHeight, rect.bottom + padding);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const radius = Math.min(height / 2, width / 2);

  return [
    `M${left + radius},${top}`,
    `H${right - radius}`,
    `Q${right},${top} ${right},${top + radius}`,
    `V${bottom - radius}`,
    `Q${right},${bottom} ${right - radius},${bottom}`,
    `H${left + radius}`,
    `Q${left},${bottom} ${left},${bottom - radius}`,
    `V${top + radius}`,
    `Q${left},${top} ${left + radius},${top}`,
    'Z'
  ].join(' ');
}

function createMultiTargetHighlight(selector: string, padding = 6): HighlightOverlay {
  const layer = document.createElement('div');
  let updateFrame: number | null = null;
  let overlayPathObserver: MutationObserver | null = null;
  let observedOverlayPath: SVGPathElement | null = null;
  let spotlightPath = '';

  layer.className = 'asterism-tour-multi-highlight';
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    zIndex: TOUR_MULTI_HIGHLIGHT_Z_INDEX,
    pointerEvents: 'none'
  });
  document.body.appendChild(layer);

  function renderHighlight(): void {
    updateFrame = null;
    const rects = Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => element.getBoundingClientRect())
      .filter(
        (rect) =>
          rect.width > 0 &&
          rect.height > 0 &&
          rect.right > 0 &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.top < window.innerHeight
      );
    const overlayPath = document.querySelector<SVGPathElement>('.driver-overlay path');

    if (!overlayPath || rects.length === 0) {
      layer.replaceChildren();
      return;
    }

    spotlightPath = [
      `M${window.innerWidth},0 H0 V${window.innerHeight} H${window.innerWidth} Z`,
      ...rects.map((rect) => createRoundedRectPath(rect, padding))
    ].join(' ');

    if (observedOverlayPath !== overlayPath) {
      overlayPathObserver?.disconnect();
      observedOverlayPath = overlayPath;
      overlayPathObserver = new MutationObserver(() => {
        if (observedOverlayPath?.getAttribute('d') !== spotlightPath) {
          observedOverlayPath?.setAttribute('d', spotlightPath);
        }
      });
      overlayPathObserver.observe(overlayPath, {
        attributes: true,
        attributeFilter: ['d']
      });
    }

    if (overlayPath.getAttribute('d') !== spotlightPath) {
      overlayPath.setAttribute('d', spotlightPath);
    }

    layer.replaceChildren(
      ...rects.map((rect) => {
        const outline = document.createElement('div');
        outline.className = 'asterism-tour-multi-highlight__outline';
        Object.assign(outline.style, {
          position: 'fixed',
          left: `${rect.left - padding}px`,
          top: `${rect.top - padding}px`,
          width: `${rect.width + padding * 2}px`,
          height: `${rect.height + padding * 2}px`,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          borderRadius: '9999px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 0 18px rgba(255,255,255,0.24)'
        });
        return outline;
      })
    );
  }

  function update(): void {
    if (updateFrame !== null) return;
    updateFrame = requestAnimationFrame(renderHighlight);
  }

  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  update();

  return {
    update,
    destroy() {
      if (updateFrame !== null) cancelAnimationFrame(updateFrame);
      updateFrame = null;
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      overlayPathObserver?.disconnect();
      overlayPathObserver = null;
      observedOverlayPath = null;
      layer.remove();
    }
  };
}

export function createUserTourDriver() {
  let instance: Driver | null = null;
  let actionsRoot: HTMLElement | null = null;
  let closeRoot: HTMLElement | null = null;
  let multiTargetHighlight: HighlightOverlay | null = null;
  let motionFrame: number | null = null;
  let motionTarget: Element | null = null;

  function stopMotionTracking(): void {
    if (motionFrame !== null) cancelAnimationFrame(motionFrame);
    motionTarget?.removeEventListener('animationstart', startMotionTracking);
    motionTarget?.removeEventListener('animationend', finishMotionTracking);
    motionTarget?.removeEventListener('animationcancel', finishMotionTracking);
    motionFrame = null;
    motionTarget = null;
  }

  function refreshMotionFrame(): void {
    instance?.refresh();
    multiTargetHighlight?.update();
    motionFrame = requestAnimationFrame(refreshMotionFrame);
  }

  function startMotionTracking(): void {
    if (motionFrame === null) motionFrame = requestAnimationFrame(refreshMotionFrame);
  }

  function finishMotionTracking(): void {
    if (
      motionTarget?.getAnimations?.({ subtree: true }).some((animation) => animation.playState === 'running')
    ) {
      return;
    }

    if (motionFrame !== null) cancelAnimationFrame(motionFrame);
    motionFrame = null;
    instance?.refresh();
    multiTargetHighlight?.update();
  }

  function trackTargetMotion(target: Element): void {
    const motionRoot = target.parentElement ?? target;
    motionTarget = motionRoot;
    motionRoot.addEventListener('animationstart', startMotionTracking);
    motionRoot.addEventListener('animationend', finishMotionTracking);
    motionRoot.addEventListener('animationcancel', finishMotionTracking);

    if (
      motionRoot.getAnimations?.({ subtree: true }).some((animation) => animation.playState === 'running')
    ) {
      startMotionTracking();
    }
  }

  function unmountActions(): void {
    if (actionsRoot) render(null, actionsRoot);
    actionsRoot = null;
  }

  function unmountCloseButton(): void {
    if (closeRoot) render(null, closeRoot);
    closeRoot = null;
  }

  function destroyMultiTargetHighlight(): void {
    multiTargetHighlight?.destroy();
    multiTargetHighlight = null;
  }

  function destroy(): void {
    stopMotionTracking();
    destroyMultiTargetHighlight();
    unmountActions();
    unmountCloseButton();
    instance?.destroy();
    instance = null;
  }

  function mountPopoverActions(popover: PopoverDOM, step: UserTourPresentation): void {
    unmountActions();
    popover.wrapper.style.zIndex = TOUR_POPOVER_Z_INDEX;
    popover.wrapper.classList.toggle(
      'asterism-tour-popover--centered',
      Boolean(step.centerPopover)
    );
    popover.arrow.style.display = step.centerPopover ? 'none' : '';

    unmountCloseButton();
    closeRoot = document.createElement('div');
    closeRoot.className = 'asterism-tour-close-root';
    popover.wrapper.prepend(closeRoot);
    render(
      h(UserTourCloseButton, {
        label: step.closeLabel,
        onClose: step.onClose
      }),
      closeRoot
    );

    const meta = document.createElement('div');
    meta.className = 'asterism-tour-popover__meta';
    popover.progress.textContent = step.progressLabel;
    meta.append(popover.progress);
    popover.wrapper.insertBefore(meta, popover.title);

    popover.footerButtons.replaceChildren();
    actionsRoot = popover.footerButtons;
    render(
      h(UserTourActions, {
        previousLabel: step.previousLabel,
        nextLabel: step.nextLabel,
        onPrevious: () => step.onPrevious?.(),
        onNext: () => step.onNext?.()
      }),
      actionsRoot
    );
  }

  function show(step: UserTourPresentation): boolean {
    const target = resolveTarget(step.target);
    if (!target) return false;

    destroy();
    instance = driver({
      allowClose: false,
      allowScroll: true,
      animate:
        !step.multiTargetSelector &&
        !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      disableActiveInteraction: !step.allowInteraction,
      overlayColor: '#050508',
      overlayOpacity: 0.72,
      popoverClass: 'asterism-tour-popover',
      showButtons: [],
      showProgress: true,
      stagePadding: step.multiTargetSelector ? 0 : 10,
      stageRadius: step.multiTargetSelector ? 0 : 10,
      onDestroyed: () => {
        destroyMultiTargetHighlight();
        unmountActions();
        unmountCloseButton();
      }
    });
    instance.highlight({
      element: target,
      disableActiveInteraction: !step.allowInteraction,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? 'bottom',
        align: step.align ?? 'start',
        showButtons: [],
        onPopoverRender: (popover) => mountPopoverActions(popover, step)
      }
    });
    if (step.multiTargetSelector) {
      multiTargetHighlight = createMultiTargetHighlight(step.multiTargetSelector);
    }
    requestAnimationFrame(() => {
      document.querySelector<SVGElement>('.driver-overlay')?.style.setProperty(
        'z-index',
        TOUR_OVERLAY_Z_INDEX
      );
    });
    trackTargetMotion(target);

    return true;
  }

  return {
    show,
    destroy,
    refresh: () => {
      instance?.refresh();
      multiTargetHighlight?.update();
    },
    isActive: () => instance?.isActive() ?? false
  };
}
