import { h, render } from 'vue';
import { driver, type Alignment, type Driver, type PopoverDOM, type Side } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/user-tour.css';
import UserTourActions from '../components/UserTourActions.vue';

export interface UserTourPresentation {
  target: string | Element | (() => Element | null);
  title: string;
  description: string;
  sectionLabel: string;
  progressLabel: string;
  pauseLabel: string;
  nextLabel?: string;
  side?: Side;
  align?: Alignment;
  allowInteraction?: boolean;
  onPause: () => void;
  onNext?: () => void;
}

function resolveTarget(target: UserTourPresentation['target']): Element | null {
  if (typeof target === 'string') return document.querySelector(target);
  if (typeof target === 'function') return target();
  return target;
}

export function createUserTourDriver() {
  let instance: Driver | null = null;
  let actionsRoot: HTMLElement | null = null;
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
    motionFrame = requestAnimationFrame(refreshMotionFrame);
  }

  function startMotionTracking(): void {
    if (motionFrame === null) motionFrame = requestAnimationFrame(refreshMotionFrame);
  }

  function finishMotionTracking(): void {
    if (motionFrame !== null) cancelAnimationFrame(motionFrame);
    motionFrame = null;
    instance?.refresh();
  }

  function trackTargetMotion(target: Element): void {
    motionTarget = target;
    target.addEventListener('animationstart', startMotionTracking);
    target.addEventListener('animationend', finishMotionTracking);
    target.addEventListener('animationcancel', finishMotionTracking);

    if (target.getAnimations?.({ subtree: true }).some((animation) => animation.playState === 'running')) {
      startMotionTracking();
    }
  }

  function unmountActions(): void {
    if (actionsRoot) render(null, actionsRoot);
    actionsRoot = null;
  }

  function destroy(): void {
    stopMotionTracking();
    unmountActions();
    instance?.destroy();
    instance = null;
  }

  function mountPopoverActions(popover: PopoverDOM, step: UserTourPresentation): void {
    unmountActions();

    popover.wrapper.style.zIndex = '1000000003';

    const meta = document.createElement('div');
    meta.className = 'asterism-tour-popover__meta';
    popover.progress.textContent = step.progressLabel;
    const section = document.createElement('span');
    section.textContent = step.sectionLabel;
    meta.append(popover.progress, section);
    popover.wrapper.insertBefore(meta, popover.title);

    popover.footerButtons.replaceChildren();
    actionsRoot = popover.footerButtons;
    render(
      h(UserTourActions, {
        pauseLabel: step.pauseLabel,
        nextLabel: step.nextLabel,
        onPause: step.onPause,
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
      animate: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      disableActiveInteraction: !step.allowInteraction,
      overlayColor: '#050508',
      overlayOpacity: 0.72,
      popoverClass: 'asterism-tour-popover',
      showButtons: [],
      showProgress: true,
      stagePadding: 10,
      stageRadius: 10,
      onDestroyed: unmountActions
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
    trackTargetMotion(target);

    return true;
  }

  return {
    show,
    destroy,
    refresh: () => instance?.refresh(),
    isActive: () => instance?.isActive() ?? false
  };
}
