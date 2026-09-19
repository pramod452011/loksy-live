export interface InstagramFilter {
  id: string;
  name: string;
  filter: string;
  description: string;
}

export const INSTAGRAM_FILTERS: InstagramFilter[] = [
  { id: 'normal', name: 'Normal', filter: 'none', description: 'Original look without color grading' },
  { id: 'clarendon', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.25) brightness(1.05)', description: 'Adds light and darkens shadows for high pop' },
  { id: 'gingham', name: 'Gingham', filter: 'contrast(1.1) brightness(1.1) sepia(0.1) saturate(0.9)', description: 'Vintage washed-out warmth' },
  { id: 'moon', name: 'Moon', filter: 'grayscale(1) contrast(1.15) brightness(1.1)', description: 'Timeless black & white monochrome' },
  { id: 'lark', name: 'Lark', filter: 'contrast(0.95) brightness(1.15) saturate(1.15) hue-rotate(-5deg)', description: 'Brightens greens and blues with cool tones' },
  { id: 'reyes', name: 'Reyes', filter: 'sepia(0.25) brightness(1.12) contrast(0.88) saturate(0.75)', description: 'Subtle nostalgic golden dust haze' },
  { id: 'juno', name: 'Juno', filter: 'contrast(1.18) saturate(1.3) brightness(1.04) hue-rotate(5deg)', description: 'Vibrant punchy warm reds and yellows' },
  { id: 'slumber', name: 'Slumber', filter: 'saturate(0.7) brightness(1.05) sepia(0.3) contrast(1.05)', description: 'Dreamy retro yellow-amber atmosphere' },
  { id: 'crema', name: 'Crema', filter: 'sepia(0.2) contrast(1.12) saturate(0.92) brightness(1.02)', description: 'Smooth creamy cafe tone' },
  { id: 'ludwig', name: 'Ludwig', filter: 'saturate(1.2) contrast(1.08) brightness(1.02)', description: 'Warm minimalist editorial clarity' },
  { id: 'aden', name: 'Aden', filter: 'hue-rotate(-15deg) contrast(0.9) saturate(0.85) brightness(1.1)', description: 'Soft pastel glow with mild contrast' },
  { id: 'perpetua', name: 'Perpetua', filter: 'saturate(1.15) brightness(1.08) contrast(1.05)', description: 'Clean daylight aesthetic' },
];

export function getCombinedFilterStyle(filterId: string, intensity: number = 100): string {
  const item = INSTAGRAM_FILTERS.find((f) => f.id === filterId);
  if (!item || item.filter === 'none' || intensity === 0) return 'none';
  if (intensity === 100) return item.filter;

  // Scale down filter effects based on intensity 0-100
  const factor = intensity / 100;
  switch (filterId) {
    case 'clarendon':
      return `contrast(${1 + 0.2 * factor}) saturate(${1 + 0.25 * factor}) brightness(${1 + 0.05 * factor})`;
    case 'gingham':
      return `contrast(${1 + 0.1 * factor}) brightness(${1 + 0.1 * factor}) sepia(${0.1 * factor})`;
    case 'moon':
      return `grayscale(${factor}) contrast(${1 + 0.15 * factor}) brightness(${1 + 0.1 * factor})`;
    case 'lark':
      return `contrast(${1 - 0.05 * factor}) brightness(${1 + 0.15 * factor}) saturate(${1 + 0.15 * factor})`;
    case 'reyes':
      return `sepia(${0.25 * factor}) brightness(${1 + 0.12 * factor}) contrast(${1 - 0.12 * factor})`;
    case 'juno':
      return `contrast(${1 + 0.18 * factor}) saturate(${1 + 0.3 * factor})`;
    case 'slumber':
      return `sepia(${0.3 * factor}) saturate(${1 - 0.3 * factor})`;
    case 'crema':
      return `sepia(${0.2 * factor}) contrast(${1 + 0.12 * factor})`;
    case 'ludwig':
      return `saturate(${1 + 0.2 * factor}) contrast(${1 + 0.08 * factor})`;
    case 'aden':
      return `contrast(${1 - 0.1 * factor}) saturate(${1 - 0.15 * factor}) brightness(${1 + 0.1 * factor})`;
    case 'perpetua':
      return `saturate(${1 + 0.15 * factor}) brightness(${1 + 0.08 * factor})`;
    default:
      return item.filter;
  }
}
