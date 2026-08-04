import CloudDemo from "./MusicSideTableCloudDemo.js";

export default {
  ...CloudDemo,
  name: "ShakerCloudDemo",
  props: {
    ...CloudDemo.props,
    cloudUrl: { type: String, default: "/models/shaker-cloud.bin" },
    zhName: { type: String, default: "SHAKER 交互灯具" },
    enName: { type: String, default: "SHAKER LUMINAIRE" }
  }
};
