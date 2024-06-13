const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { randomUUID } = require("crypto");

const client = new EventBridgeClient();

module.exports.place = async () => {
  const event = {
    specversion: "1.0",
    id: randomUUID(),
    source: "order",
    type: "order.placed",
    data: {
      order: {
        id: randomUUID(),
        items: [{ sku: "123", price: 123 }],
      },
    },
    time: new Date().toISOString(),
    dataschema: "",
    correlationid: randomUUID(),
  };

  const result = await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
          Source: event.source,
          DetailType: event.type,
          Detail: JSON.stringify(event),
        },
      ],
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ event, result }, null, 2),
  };
};
