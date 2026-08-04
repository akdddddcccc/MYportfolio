import CloudDemo from "./MusicSideTableCloudDemo.js";

export default {
  ...CloudDemo,
  name: "RoadMachineCloudDemo",
  props: {
    ...CloudDemo.props,
    cloudUrl: { type: String, default: "/models/road-machine-cloud.bin" },
    zhName: { type: String, default: "道路机" },
    enName: { type: String, default: "ROAD MACHINE" }
  }
};
