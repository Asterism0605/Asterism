export type StarStyleVars = Record<`--star-${string}`, string>;

export type StarStyleConfig = {
  top: string;
  left: string;
  mobileTop: string;
  mobileLeft: string;
  size: string;
  color: string;
  glow?: string;
  hoverGlow: string;
  floatDelay: string;
};

export function createStarStyle(config: StarStyleConfig): StarStyleVars {
  return {
    '--star-top': config.top,
    '--star-left': config.left,
    '--star-mobile-top': config.mobileTop,
    '--star-mobile-left': config.mobileLeft,
    '--star-size': config.size,
    '--star-color': config.color,
    '--star-glow': config.glow ?? 'none',
    '--star-hover-glow': config.hoverGlow,
    '--star-float-delay': config.floatDelay
  };
}
