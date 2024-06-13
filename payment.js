const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { makeIdempotent, IdempotencyConfig } = require("@aws-lambda-powertools/idempotency");
const { DynamoDBPersistenceLayer } = require("@aws-lambda-powertools/idempotency/dynamodb");
const { randomUUID } = require("crypto");

const client = new EventBridgeClient();

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: process.env.IDEMPOTENCY_TABLE_NAME,
});
const config = new IdempotencyConfig({});

const handleEvent = makeIdempotent(
  async (_idempotencyId, event) => {
    switch (event.type) {
      case "warehouse.stock-reserved":
        await client.send(
          new PutEventsCommand({
            Entries: [
              {
                EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
                Source: "payment",
                DetailType: "payment.taken",
                Detail: JSON.stringify({
                  specversion: "1.0",
                  id: randomUUID(),
                  source: "payment",
                  type: "payment.taken",
                  data: {
                    order: event.data.order,
                    payment: { id: randomUUID(), provider: "VISA" },
                  },
                  time: new Date().toISOString(),
                  dataschema: "",
                  correlationid: event.correlationid,
                }),
              },
            ],
          })
        );

        return true; // `makeIdempotent` requires a value to be returned
    }
  },
  {
    persistenceStore,
    config,
  }
);

module.exports.worker = async (queueEvent, context) => {
  config.registerLambdaContext(context);

  console.log(queueEvent);

  const event = JSON.parse(queueEvent.Records[0].body).detail;
  await handleEvent(`${event.source}${event.id}`, event);
};
