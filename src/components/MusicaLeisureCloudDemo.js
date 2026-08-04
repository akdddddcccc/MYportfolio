import CloudDemo from "./MusicSideTableCloudDemo.js";

export default {
  ...CloudDemo,
  name: "MusicaLeisureCloudDemo",
  props: {
    ...CloudDemo.props,
    cloudUrl: { type: String, default: "/models/musica-leisure-cloud.bin" },
    zhName: { type: String, default: "乐憩空间" },
    enName: { type: String, default: "MUSICA LEISURE" }
  }
};
