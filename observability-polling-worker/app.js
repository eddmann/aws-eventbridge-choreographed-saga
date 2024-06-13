const { Consumer } = require("sqs-consumer");
const { inspect } = require("util");

const app = Consumer.create({
  queueUrl: process.env.QUEUE,
  handleMessage: async (message) => {
    const event = JSON.parse(message.Body).detail;
    console.log(inspect(event, { showHidden: false, depth: null, colors: true }));
  },
});

app.on("error", (err) => {
  console.error(err.message);
});

app.on("processing_error", (err) => {
  console.error(err.message);
});

app.start();
