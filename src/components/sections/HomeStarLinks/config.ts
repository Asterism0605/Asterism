import { createStarStyle } from './starStyle';
import type { StarStyleConfig, StarStyleVars } from './starStyle';

export type HomeStarLinkKey = 'privacy' | 'terms';

type HomeStarLinkConfig = {
  key: HomeStarLinkKey;
  routeName: HomeStarLinkKey;
  style: StarStyleVars;
};

function createStarLink(key: HomeStarLinkKey, config: StarStyleConfig): HomeStarLinkConfig {
  return {
    key,
    routeName: key,
    style: createStarStyle(config)
  };
}

export const starLinks = [
  createStarLink('privacy', {
    top: '30px',
    left: '40px',
    mobileTop: '70px',
    mobileLeft: '50px',
    size: '7px',
    color: 'rgb(240 237 230 / 0.86)',
    hoverGlow:
      '0 0 50px rgb(240 237 230 / 0.98), 0 0 38px rgb(168 137 58 / 0.7), 0 0 62px rgb(168 137 58 / 0.34)',
    floatDelay: '0s'
  }),
  createStarLink('terms', {
    top: '100px',
    left: '130px',
    mobileTop: '20px',
    mobileLeft: '0px',
    size: '5px',
    color: 'rgb(240 237 230 / 0.74)',
    glow: '0 0 9px rgb(240 237 230 / 0.72), 0 0 22px rgb(196 92 58 / 0.34)',
    hoverGlow:
      '0 0 13px rgb(240 237 230 / 0.92), 0 0 34px rgb(196 92 58 / 0.6), 0 0 56px rgb(196 92 58 / 0.28)',
    floatDelay: '1.1s'
  })
] satisfies HomeStarLinkConfig[];
