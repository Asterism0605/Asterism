type TranslationFunction = (key: string) => string;

const consultationValueKeys: Record<string, string> = {
  Online: 'consult.online',
  'In-Person': 'consult.inPerson',
  'Graphic Design': 'consult.fieldGraphic',
  graphic: 'consult.fieldGraphic',
  'Interior Design': 'consult.fieldInterior',
  interior: 'consult.fieldInterior',
  Architecture: 'consult.fieldArchitecture',
  architecture: 'consult.fieldArchitecture',
  'Styling Design': 'consult.fieldStyling',
  styling: 'consult.fieldStyling',
  'Visual Concept': 'consult.focusVisual',
  visual: 'consult.focusVisual',
  'Material Palette': 'consult.focusMaterial',
  material: 'consult.focusMaterial',
  'Spatial Mood': 'consult.focusSpatial',
  spatial: 'consult.focusSpatial',
  'Color Direction': 'consult.focusColor',
  color: 'consult.focusColor',
  'Furniture Selection': 'consult.focusFurniture',
  furniture: 'consult.focusFurniture',
  'I would like help defining the visual direction for a new brand identity.':
    'accountConsultations.sampleNotes.brand',
  'I need advice on natural finishes and a calm material palette for my home.':
    'accountConsultations.sampleNotes.homeMaterials',
  'I want to create a warm and quiet atmosphere for a small studio renovation.':
    'accountConsultations.sampleNotes.studio',
  'I would like to refine the color direction for an upcoming editorial shoot.':
    'accountConsultations.sampleNotes.editorial',
  'I need help selecting furniture that works with the scale of my living room.':
    'accountConsultations.sampleNotes.livingRoom'
};

export function formatConsultationDisplayValue(
  value: string | undefined,
  t: TranslationFunction
): string {
  if (!value) return '—';

  const translationKey = consultationValueKeys[value];
  return translationKey ? t(translationKey) : value;
}
