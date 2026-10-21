import TimeImage from './TimeImage.js';
export default {
  name: 'TimePhoto',
  components: { TimeImage },
  props: { photo: { type: Object, required: true }, lang: { type: String, required: true } },
  emits: ['inspect'],
  template: `<figure class="time-photo" :class="{ 'time-photo--featured': photo.featured }" :style="{ '--photo-background': photo.background }"><button class="time-photo__open" type="button" @click="$emit('inspect', photo)" :aria-label="(lang === 'zh' ? '放大查看：' : 'Enlarge: ') + photo[lang]"><TimeImage :photo="photo" :lang="lang" /><span class="time-photo__zoom" aria-hidden="true">↗</span></button><figcaption>{{ photo[lang] }}</figcaption></figure>`
};
