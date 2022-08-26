import pino from "pino";

const pinoOptions = {
  name: "build-api",
  dedupe: false,
  formatters: {
    level(level: any) {
      return { level };
    },
  },
};
export default pino(pinoOptions);
