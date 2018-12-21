const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const uuid = require('uuid/v4');
const kafka = require('kafka-node');

let client = new kafka.KafkaClient({
  kafkaHost: 'kafka:9092'
});
client.on('ready', () => {
  console.log('kafka client ready!!!');
});
var options = {
  host: 'zookeeper:2181',
  kafkaHost: 'kafka:9092',
  groupId: 'demo',
  sessionTimeout: 15000,
  protocol: ['roundrobin'],
  encoding: 'utf8',
  fromOffset: 'earliest',
  commitOffsetsOnFirstJoin: true,
  outOfRangeOffset: 'earliest'
};
let consumerGroup = new kafka.ConsumerGroup(options, ['product-created', 'product-updated']);
consumerGroup.on('message', (message) => {
  console.log(message);
  let product = JSON.parse(message.value)
  if (message.topic === 'product-created') {
    database.set(product.id, product);
  } else if (message.topic === 'product-updated') {
    let price = database.get(product.id);
    price.name = product.name;
    price.description = product.description;
    database.set(product.id, price);
  }
});


const app = new Koa();
let router = new Router();

let database = new Map();

router.get('/prices', (ctx, next) => {
  let response = []
  for (value of database.values()) {
    response.push(value)
  }
  ctx.body = response;
});

router.put('/prices/:id', (ctx, next) => {
  console.log(ctx.params.id)
  console.log(ctx.request.body)
  let price = database.get(ctx.params.id)
  price.amount = ctx.request.body.amount;
  database.set(price.id, price)
  ctx.body = JSON.stringify(price);
});

app
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
console.log('app started!');
