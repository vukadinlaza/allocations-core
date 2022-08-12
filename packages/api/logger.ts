import pino from "pino";

const pinoOptions = {
  name: "allocations-core",
  mixin() {
    return { stage: process.env.STAGE };
  },
  dedupe: false,
  formatters: {
    level(level: any) {
      return { level };
    },
  },
};

export default pino(pinoOptions);
