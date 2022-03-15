import bodyParser from "body-parser";
import express from "express";
import { InversifyExpressServer } from "inversify-express-utils";
import { IConfig } from "./config";
import createContainer from "./container";

export async function serverBuilder() {
  const container = await createContainer();
  const {
    server: { host, port },
  } = container.get<IConfig>("config");

  const server = new InversifyExpressServer(container)
    .setConfig((app) => {
      app.use(bodyParser.json());
    })
    .build();

  return server.listen(port, () =>
    console.log(`🚀  Server ready at http://${host}:${port}`)
  );
}
