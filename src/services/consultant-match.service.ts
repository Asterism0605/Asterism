import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

const DEFAULT_CONSULTANT_LABEL = 'Spatial Consultant · Asterism Studio';

const consultantByStyleTag = new Map<string, string>([
  ['cyberpunk', 'Spatial Consultant · Theo Lin'],
  ['futurism', 'Spatial Consultant · Theo Lin'],
  ['glitch art', 'Spatial Consultant · Theo Lin'],
  ['neo-tokyo', 'Spatial Consultant · Theo Lin'],
  ['techwear', 'Spatial Consultant · Theo Lin'],
  
  ['bubblegum futurism', 'Spatial Consultant · Ilya Chen'],
  ['chrome design', 'Spatial Consultant · Ilya Chen'],
  ['frutiger aero', 'Spatial Consultant · Ilya Chen'],
  ['mcbling', 'Spatial Consultant · Ilya Chen'],
  ['y2k', 'Spatial Consultant · Ilya Chen'],

  ['art deco', 'Spatial Consultant · Nora Reyes'],
  ['baroque', 'Spatial Consultant · Nora Reyes'],
  ['maximalism', 'Spatial Consultant · Nora Reyes'],
  ['rococo', 'Spatial Consultant · Nora Reyes'],

  ['minimalism', 'Spatial Consultant · Mira Chen'],
  ['modernism', 'Spatial Consultant · Mira Chen'],
  ['quiet luxury', 'Spatial Consultant · Mira Chen'],
  ['scandinavian', 'Spatial Consultant · Mira Chen'],
  ['swiss design', 'Spatial Consultant · Mira Chen'],

  ['biophilic design', 'Spatial Consultant · Elena Park'],
  ['japandi', 'Spatial Consultant · Elena Park'],
  ['organic modern', 'Spatial Consultant · Elena Park'],
  ['wabi-sabi', 'Spatial Consultant · Elena Park'],

  ['cottagecore', 'Spatial Consultant · Camille Wu'],
  ['grandmillennial', 'Spatial Consultant · Camille Wu'],
  ['romanticism', 'Spatial Consultant · Camille Wu'],
  ['vintage floral', 'Spatial Consultant · Camille Wu'],

  ['americana', 'Spatial Consultant · Jules Huang'],
  ['mid-century modern', 'Spatial Consultant · Jules Huang'],
  ['retro', 'Spatial Consultant · Jules Huang'],
  ['vintage', 'Spatial Consultant · Jules Huang'],

  ['anti-design', 'Spatial Consultant · Ren Sato'],
  ['avant-garde', 'Spatial Consultant · Ren Sato'],
  ['brutalism', 'Spatial Consultant · Ren Sato'],
  ['deconstructivism', 'Spatial Consultant · Ren Sato'],
  ['experimental typography', 'Spatial Consultant · Ren Sato'],

  ['graffiti', 'Spatial Consultant · Kai Lin'],
  ['hypebeast', 'Spatial Consultant · Kai Lin'],
  ['skate culture', 'Spatial Consultant · Kai Lin'],
  ['streetwear', 'Spatial Consultant · Kai Lin'],
  ['urban contemporary', 'Spatial Consultant · Kai Lin']
]);

const normalizeMatchKey = (value: string): string => value.trim().toLowerCase();

export function matchConsultantByStyleTag(result: ComputedStyleDnaResult): string {
  return (
    consultantByStyleTag.get(normalizeMatchKey(result.primaryStyle)) ??
    DEFAULT_CONSULTANT_LABEL
  );
}
