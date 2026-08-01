import { createDevelopmentGatewayApplication } from "./development.js";

const application = createDevelopmentGatewayApplication();
await application.start();

console.log("Gateway development server listening on http://127.0.0.1:8080");

let stopping = false;

function stopServer() {
  if (stopping) {
    return;
  }

  stopping = true;
  application.server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);
