require("module-alias/register");
import "reflect-metadata";
import { serverBuilder } from "@config/server";

(async () => {
  try {
    const server = await serverBuilder();
  } catch (error) {
    console.error("Failed to start server", error);
  }
})();
