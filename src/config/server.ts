import bodyParser from "body-parser";
import { InversifyExpressServer } from "inversify-express-utils";
import { IConfig } from "./config";
import createContainer from "./container";
import fileUpload from "express-fileupload";
import cors from "cors";
import { Server } from "http";
import { Application } from "express";
import { Container } from "inversify";
import { AddressInfo } from "net";

export async function serverBuilder(config: IConfig): Promise<Sanita> {
  const container = await createContainer(config);
  const {
    server: { host, port },
  } = container.get<IConfig>("config");

  const app = new InversifyExpressServer(container)
    .setConfig((app) => {
      app.use(cors());
      app.use(bodyParser.json());
      app.use(fileUpload());
      app.set("container", container);
    })
    .build();
  const server = app.listen(port, () => console.log(`🚀  Server ready at http://${host}:${port}`));
  return new Sanita(app, server, container);
}

export class Sanita {
  constructor(public app: Application, public server: Server, public container: Container) {}

  get port(): number {
    return (this.server.address() as AddressInfo).port;
  }

  stop(): Promise<void> {
    return new Promise((res, rej) => {
      this.server.close((error?: Error) => {
        if (error) {
          rej(error);
        }
        res();
      });
    });
  }
}
