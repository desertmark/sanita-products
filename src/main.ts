require("module-alias/register");
import "reflect-metadata";
import { serverBuilder } from "@config/server";
import { config } from "@config/config";

(async () => {
  try {
    await serverBuilder(config);
  } catch (error) {
    console.error("Failed to start server", error);
  }
})();
