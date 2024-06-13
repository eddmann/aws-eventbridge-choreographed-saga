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
    await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.LOYALTY_EVENT_BUS_ARN,
            Source: "loyalty",
            DetailType: "loyalty.points-awarded",
            Detail: JSON.stringify({
              specversion: "1.0",
              id: randomUUID(),
              source: "loyalty",
              type: "loyalty.points-awarded",
              data: {
                order: event.data.order,
                points: {
                  awarded: 100,
                  expires: Math.floor(Date.now() / 1000) + 604800, // one week from now
                },
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
  },
  {
    persistenceStore,
    config,
  }
);

module.exports.award = async (lambdaEvent, context) => {
  config.registerLambdaContext(context);

  console.log(lambdaEvent);

  const event = lambdaEvent.detail;

  if (event.type !== "payment.taken") {
    throw new Error();
  }

  await handleEvent(`${event.source}${event.id}`, event);
};
