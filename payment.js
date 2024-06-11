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
  async (_eventId, incoming) => {
    switch (incoming["detail-type"]) {
      case "warehouse.stock-reserved":
        await client.send(
          new PutEventsCommand({
            Entries: [
              {
                EventBusName: process.env.GLOBAL_EVENT_BUS_ARN,
                Detail: JSON.stringify({
                  eventId: randomUUID(),
                  correlationId: incoming.detail.correlationId,
                  order: incoming.detail.order,
                  payment: { id: randomUUID(), provider: "VISA" },
                }),
                DetailType: "payment.taken",
                Source: "payment",
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

module.exports.worker = async (event, context) => {
  config.registerLambdaContext(context);

  console.log(event);

  const incoming = JSON.parse(event.Records[0].body);
  await handleEvent(incoming.detail.eventId, incoming);
};
