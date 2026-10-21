// Non-destructive, AI-assisted material/lighting studies. Original exports stay available.
export const leisureRenderAssets = {
  '1156-imgUntitled7': { file: 'renders-v2/private-mode.webp', size: [1402, 1122] },
  '1156-imgUntitled6': { file: 'renders-v2/sharing-mode.webp', size: [1403, 1121] },
  '1156-img61': { file: 'renders-v2/live-mode.webp', size: [1206, 1305] },
  '1156-img16564803898452': { file: 'renders-v2/light-plan.webp', size: [1594, 987] },
  '1292-imgImage183': { file: 'renders-v2/exterior.webp', size: [1515, 1038] },
  '1293-imgUntitled9': { file: 'renders-v2/overhead.webp', size: [1402, 1122] },
  '1294-imgUntitled4': { file: 'renders-v2/interior-high.webp', size: [1448, 1086] },
  '1287-imgUntitled11': { file: 'renders-v2/interior-low.webp', size: [1448, 1086] }
};

export function leisurePhotoSource(file) {
  return '/images/study/leisure-story/' + (leisureRenderAssets[file]?.file || file + '.webp');
}
