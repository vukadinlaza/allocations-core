import { send } from "@allocations/service-common";

export const HEALTH_CHECK_PATH = "health-check";

module.exports.handler = async () => {
  return send({ message: "Healthy!" });
};
