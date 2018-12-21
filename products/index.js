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
let producer = new kafka.Producer(client);
producer.on('ready', () => {
  console.log('kafka producer ready!!!');
});

const app = new Koa();
let router = new Router();

let database = new Map();

router.get('/products', (ctx, next) => {
  let response = []
  for (value of database.values()) {
    response.push(value)
  }
  ctx.body = response;
});

router.post('/products', (ctx, next) => {
  console.log(ctx.request.body)
  let product = {
    id: uuid(),
    name: ctx.request.body.name,
    description: ctx.request.body.description
  }
  database.set(product.id, product)
  ctx.body = JSON.stringify(product);
  producer.send([{
    topic: 'product-created',
    messages: JSON.stringify(product),
    timestamp: Date.now()
  }], () => {
    console.log('product-created published');
  })
});

router.put('/products/:id', (ctx, next) => {
  console.log(ctx.params.id)
  console.log(ctx.request.body)
  let product = database.get(ctx.params.id)
  product.name = ctx.request.body.name;
  product.description = ctx.request.body.description;
  database.set(product.id, product)
  ctx.body = JSON.stringify(product);
  producer.send([{
    topic: 'product-updated',
    messages: JSON.stringify(product),
    timestamp: Date.now()
  }], () => {
    console.log('product-updated published');
  })
});

app
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
console.log('app started!');
