import type { CSSProperties } from 'react';

export const CARD_BACK_IMAGE_URL = '/back-of-card.png';

export const CARD_BACK_STYLE: CSSProperties = {
  backgroundImage: `url("${CARD_BACK_IMAGE_URL}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#1a120d',
};

export function getCardBackStyle(overrides?: CSSProperties): CSSProperties {
  if (!overrides) {
    return CARD_BACK_STYLE;
  }

  return {
    ...CARD_BACK_STYLE,
    ...overrides,
  };
}
