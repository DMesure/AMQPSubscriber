const express = require('express');
const app = express();
require('dotenv').config();

var args = require('./options.js').options({
    'client': { default: process.env.ARTEMIS_CLIENT, describe: 'name of identifier for client container'},
    'subscription': { default: process.env.ARTEMIS_SUBSCRIPTION, describe: 'name of identifier for subscription'},
    't': { alias: 'topic', default: process.env.AMQP_TOPIC, describe: 'name of topic to subscribe to'},
    'h': { alias: 'host', default: process.env.AMQP_HOST, describe: 'dns or ip name of server where you want to connect'},
    'p': { alias: 'port', default: process.env.AMQP_PORT, describe: 'port to connect to'},
    'u' : { alias: 'username', default: process.env.ARTEMIS_USERNAME, describe: 'username to connect to artemis instance'},
    'pw': { alias: 'password', default: process.env.ARTEMIS_PASSWORD, describe: 'password to connect to artemis instance'}
}).help('help').argv;


var connection = require('rhea').connect({ port:args.port, host: args.host, container_id:args.client, username: args.username, password: args.password });
connection.on('receiver_open', function (context) {
    console.log('subscribed');
});
connection.on('message', function (context) {
    if (context.message.body === 'detach') {
        // detaching leaves the subscription active, so messages sent
        // while detached are kept until we attach again
        context.receiver.detach();
        context.connection.close();
    } else if (context.message.body === 'close') {
        // closing cancels the subscription
        context.receiver.close();
        context.connection.close();
    } else {
        console.log(context.message);
        console.log(context.message.body);
    }
});
// the identity of the subscriber is the combination of container id
// and link (i.e. receiver) name
connection.open_receiver({name:args.subscription, source:{address:args.topic, durable:2, expiry_policy:'never'}});


app.get('/', (req, res) => {
    console.log('Subscriber received a request.');

    res.send(`This is the Subscriber endpoint`);
});


const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log('Subscriber listening on port', port);
});