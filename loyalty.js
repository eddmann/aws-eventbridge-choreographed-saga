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
  async (_eventId, event) => {
    await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.LOYALTY_EVENT_BUS_ARN,
            Detail: JSON.stringify({
              eventId: randomUUID(),
              correlationId: event.detail.correlationId,
              order: event.detail.order,
              points: {
                awarded: 100,
                expires: Math.floor(Date.now() / 1000) + 604800, // one week from now
              },
            }),
            DetailType: "loyalty.points-awarded",
            Source: "loyalty",
          },
        ],
      })
    );

    return true; // `makeIdempotent` requires a value to be returned
  },
  {
    persistenceStore,
    config,
  }
);

module.exports.award = async (event, context) => {
  config.registerLambdaContext(context);

  console.log(event);

  if (event["detail-type"] !== "payment.taken") {
    throw new Error();
  }

  await handleEvent(event.detail.eventId, event);
};
