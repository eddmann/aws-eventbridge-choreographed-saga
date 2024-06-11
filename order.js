const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { randomUUID } = require("crypto");

const client = new EventBridgeClient();

module.exports.place = async () => {
  const event = {
    EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
    Detail: JSON.stringify({
      eventId: randomUUID(),
      correlationId: randomUUID(),
      order: {
        id: randomUUID(),
        items: [{ sku: "123", price: 123 }],
      },
    }),
    DetailType: "order.placed",
    Source: "order",
  };

  const result = await client.send(
    new PutEventsCommand({
      Entries: [event],
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ event, result }, null, 2),
  };
};
