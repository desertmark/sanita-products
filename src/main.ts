require("module-alias/register");
import "reflect-metadata";
import { serverBuilder } from "@config/server";

(async () => {
  try {
    await serverBuilder();
  } catch (error) {
    console.error("Failed to start server", error);
  }
})();
