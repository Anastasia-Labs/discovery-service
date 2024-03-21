import { client, v2 } from "@datadog/datadog-api-client";
import dotenv from "dotenv";
dotenv.config();

const configurationOpts = {
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY,
    appKeyAuth: process.env.DD_APP_KEY,
  },
};

export const loggerDD = async (message: string) => {
  if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
    console.log(message);
    return;
  }

  const configuration = client.createConfiguration(configurationOpts);
  const apiInstance = new v2.LogsApi(configuration);

  const params: v2.LogsApiSubmitLogRequest = {
    body: [
      {
        ddsource: "discovery-service",
        ddtags: `discovery-service-network:${process.env.NETWORK}`,
        hostname: "pde",
        message: `${new Date(Date.now()).toUTCString()} INFO: ${message}`,
        service: "discovery-service",
      },
    ],
    contentEncoding: "deflate",
  };
  console.log("Sending Datadog log:", params.body[0].message);

  await apiInstance.submitLog(params);
};
