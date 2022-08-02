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

// const prettyOptions = {
//   colorize: true,
//   sync: true,
//   levelKey: "level",
//   ignore: "pid,hostname,time",
//   messageKey: "msg",
//   translateTime: "SYS:UTC:yyyy-mm-dd HH:MM:ss Z",
// };

// const prettyTransport = pino.transport({
//   target: "pino-pretty",
//   options: prettyOptions,
// });

const logger = () => {
  // return process.env.NODE_ENV === "dev"
  //   ? pino(pinoOptions, prettyTransport)
  //   : pino(pinoOptions);
  return pino(pinoOptions);
};

export default logger;
