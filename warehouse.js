const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { randomUUID } = require("crypto");

const client = new EventBridgeClient();

module.exports.worker = async (queueEvent) => {
  console.log(queueEvent);

  const event = JSON.parse(queueEvent.Records[0].body).detail;

  switch (event.type) {
    case "order.placed":
      await client.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
              Source: "warehouse",
              DetailType: "warehouse.stock-reserved",
              Detail: JSON.stringify({
                specversion: "1.0",
                id: randomUUID(),
                source: "warehouse",
                type: "warehouse.stock-reserved",
                data: {
                  order: event.data.order,
                  reservation: { id: randomUUID() },
                },
                time: new Date().toISOString(),
                dataschema: "",
                correlationid: event.correlationid,
              }),
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
              Source: "warehouse",
              DetailType: "warehouse.order-shipped",
              Detail: JSON.stringify({
                specversion: "1.0",
                id: randomUUID(),
                source: "warehouse",
                type: "warehouse.order-shipped",
                data: {
                  order: event.data.order,
                  shipping: { address: "23 Fake Street" },
                },
                time: new Date().toISOString(),
                dataschema: "",
                correlationid: event.correlationid,
              }),
            },
          ],
        })
      );

      return;
  }
};
