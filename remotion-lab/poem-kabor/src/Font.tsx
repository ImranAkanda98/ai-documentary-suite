import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoSerifBengali';

loadFont('normal', {
  subsets: ['bengali', 'latin'],
  weights: ['300', '400', '500', '600', '700'],
});

export const FONT_NAME = 'Noto Serif Bengali';
