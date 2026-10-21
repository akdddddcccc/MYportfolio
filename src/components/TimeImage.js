export default {
  name: 'TimeImage',
  props: { photo: { type: Object, required: true }, lang: { type: String, required: true }, eager: Boolean },
  template: `<span class="time-image" :class="{ 'time-image--cropped': photo.crop }" :style="photo.crop"><img :src="photo.src" :alt="photo[lang]" :width="photo.width" :height="photo.height" :loading="eager ? 'eager' : 'lazy'" decoding="async"></span>`
};
