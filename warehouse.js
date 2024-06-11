const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { randomUUID } = require("crypto");

const client = new EventBridgeClient();

module.exports.worker = async (event) => {
  console.log(event);

  const incoming = JSON.parse(event.Records[0].body);

  switch (incoming["detail-type"]) {
    case "order.placed":
      await client.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
              Detail: JSON.stringify({
                eventId: randomUUID(),
                correlationId: incoming.detail.correlationId,
                order: incoming.detail.order,
                reservation: { id: randomUUID() },
              }),
              DetailType: "warehouse.stock-reserved",
              Source: "warehouse",
            },
          ],
        })
      );

      return;
    case "loyalty.points-awarded":
      await client.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
              Detail: JSON.stringify({
                eventId: randomUUID(),
                correlationId: incoming.detail.correlationId,
                order: incoming.detail.order,
                shipping: { address: "23 Fake Street" },
              }),
              DetailType: "warehouse.order-shipped",
              Source: "warehouse",
            },
          ],
        })
      );

      return;
  }
};
