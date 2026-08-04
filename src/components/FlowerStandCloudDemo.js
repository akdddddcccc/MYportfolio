import CloudDemo from "./MusicSideTableCloudDemo.js";

export default {
  ...CloudDemo,
  name: "FlowerStandCloudDemo",
  props: {
    ...CloudDemo.props,
    cloudUrl: { type: String, default: "/models/flower-stand-cloud.bin" },
    zhName: { type: String, default: "花架子" },
    enName: { type: String, default: "FLOWER STAND" }
  }
};
