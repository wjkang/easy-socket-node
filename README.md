# easy-socket-node: websocket server for Node.js,depend on [ws](https://github.com/websockets/ws)

## Installing

```
npm install easy-socket-node --save
```

## Use
```js
import EasySocket from 'easy-socket-node';

const config = {
    port: 3001,
    perMessageDeflate: {
        zlibDeflateOptions: { // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3,
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        clientMaxWindowBits: 10,       // Defaults to negotiated value.
        serverMaxWindowBits: 10,       // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10,          // Limits zlib concurrency for perf.
        threshold: 1024,               // Size (in bytes) below which messages
        // should not be compressed.
    }
}

const easySocket = new EasySocket();
easySocket
    .listen(config)

console.log('Now start WebSocket server on port ' + config.port + '...')
```

See [ws](https://github.com/websockets/ws) for more options

## connection Middleware

```js
const easySocket = new EasySocket();
easySocket
    .connectionUse((context,next)=>{
       console.log("new Connected");
       next()
    })
    .listen(config)
```

**context properties**:

| name | description | use |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| client | current connect client ||
| req | req |req.url|






