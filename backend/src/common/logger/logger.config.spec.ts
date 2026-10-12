import { buildLoggerParams } from "./logger.config";

const transportOf = (env: NodeJS.ProcessEnv, hasPretty: () => boolean) =>
  (buildLoggerParams(env, hasPretty).pinoHttp as { transport?: { target?: string } }).transport;

describe("buildLoggerParams — transport", () => {
  it("writes JSON in production", () => {
    expect(transportOf({ NODE_ENV: "production" }, () => true)).toBeUndefined();
  });

  it("pretty-prints in development when pino-pretty is installed", () => {
    expect(transportOf({ NODE_ENV: "development" }, () => true)?.target).toBe("pino-pretty");
  });

  // The stage outage: a built image (no devDependencies) on a host whose
  // NODE_ENV was not "production" crash-looped on boot.
  it.each([{ NODE_ENV: "staging" }, { NODE_ENV: "development" }, {}])(
    "falls back to JSON without pino-pretty, NODE_ENV=%j",
    (env) => {
      expect(transportOf(env, () => false)).toBeUndefined();
    },
  );

  it("detects pino-pretty by default (installed in this dev checkout)", () => {
    const transport = (buildLoggerParams({ NODE_ENV: "development" }).pinoHttp as { transport?: { target?: string } })
      .transport;
    expect(transport?.target).toBe("pino-pretty");
  });
});
