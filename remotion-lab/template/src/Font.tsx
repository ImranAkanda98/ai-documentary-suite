import React from 'react';
import {loadFont} from '@remotion/google-fonts/HindSiliguri';

// বাংলা যুক্তাক্ষর ঠিক রেন্ডার হওয়ার জন্য ফন্ট আগে থেকে লোড করতে হয়।
// @remotion/google-fonts প্যাকেজের ফন্ট বান্ডেল করা — তাই ইন্টারনেট ছাড়াই চলে।
// v4 সিগনেচার: loadFont(style, {subsets, weights})
const FONT_FAMILY = 'Hind Siliguri';

loadFont('normal', {
  subsets: ['bengali', 'latin'],
  weights: ['300', '400', '500', '600', '700'],
});

export const FONT_NAME = FONT_FAMILY;
