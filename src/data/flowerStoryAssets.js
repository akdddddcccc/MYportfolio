export const flowerStorySizes = {
  "window-01": [612, 405], "window-02": [612, 255],
  "window-03": [612, 408], "window-04": [612, 408],
  "window-05": [612, 408], "window-06": [612, 408],
  "mood-geometric": [1400, 1400], "mood-bauhaus": [710, 1016],
  "mood-kandinsky": [710, 887], "mood-chair-black": [1400, 1400],
  "mood-chair-geometric": [600, 424], "mood-form": [1423, 1236],
  "sketch-elements": [1024, 716], "sun-window-reference": [554, 186],
  "grasshopper-definition": [1888, 702], "motif-white": [1129, 866],
  "motif-green": [1280, 720], "process-laser": [2200, 1650],
  "process-glue": [2200, 1650], "process-support": [1350, 1800],
  "process-assembly": [1350, 1800], "prototype-wood": [2200, 1466],
  "render-product": [2200, 1374], "render-in-use": [1024, 640],
  "prototype-front": [2200, 1466], "prototype-angle": [2200, 1466],
  "home-oak-v2": [1536, 1024], "home-walnut-v2": [1586, 992],
  "motif-green-v2": [1672, 941],
  "window-vector-white": [229, 226], "window-vector-green": [149, 148]
};

export const flowerStorySource = file => `/images/study/flower-story/${file}${file.startsWith('window-vector-') ? '.svg' : '.webp'}`;
