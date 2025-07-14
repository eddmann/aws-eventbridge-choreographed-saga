# Choreographed Saga using AWS EventBridge

Example of an choreographed saga to handle order fulfillment using a Event-Driven Architecture (EDA) via AWS EventBridge.
Inspired by an example found in the [Monolith to Microservices](https://samnewman.io/books/monolith-to-microservices/) book.

Events are published in [CloudEvents](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md) [structured mode](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md#message) message format.

<img src="example.png" style="max-width:800px">

## Subdomains

- Order
- Warehouse
- Payment
- Loyalty

## Events

- `order.placed`
- `warehouse.stock-reserved`
- `warehouse.order-shipped`
- `payment.taken`
- `loyalty.points-awarded`

## Happy Path

- Order is placed (via HTTP endpoint).
- Stock is reserved (via SQS FIFO Lambda worker, self-handling deduplication).
- Payment is taken (via SQS Lambda worker, handles deduplication within the service).
- Loyalty points are awarded (via internal Loyalty Event Bus, direct Lambda invocation and handling deduplication within the service).
- Order is shipped (via SQS FIFO Lambda worker, self-handling deduplication).
- Order notifications API endpoint is subsequently then notified of the shipped order.

All events emitted on the Global Events Bus can be observed via:

- The SQS local polling worker (`QUEUE=sqs_arn node ./observability-polling-worker/app.js`).
- The CloudWatch Logs integration.

## TODO

- Look at examples of out-of-order processing (domain-specific saga patterns and time-based buffer windows).
- Look into Event Catalogues and Event Schema Definitions.
- Look into unhappy paths and how to 'rollback' the saga.

## Resources

- https://aws.amazon.com/blogs/compute/sending-and-receiving-cloudevents-with-amazon-eventbridge/
- https://serverlessland.com/event-driven-architecture/idempotency
- https://serverlessland.com/event-driven-architecture/ordering
