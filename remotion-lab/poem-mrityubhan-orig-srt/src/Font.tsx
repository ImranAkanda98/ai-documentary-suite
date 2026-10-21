import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoSerifBengali';

// বাংলা যুক্তাক্ষর ঠিক রেন্ডার হওয়ার জন্য ফন্ট আগে থেকেই লোড করতে হয়।
// @remotion/google-fonts প্যাকেজে ফন্ট বান্ডেল করা — ইন্টারনেট ছাড়াই চলে।
loadFont('normal', {
  subsets: ['bengali', 'latin'],
  weights: ['300', '400', '500', '600', '700'],
});

export const FONT_NAME = 'Noto Serif Bengali';
