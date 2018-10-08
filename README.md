# easy-socket-node: websocket server for Node.js,depend on [ws](https://github.com/websockets/ws)

## Installing

```
npm install easy-socket-node --save
```

**[browser client](https://github.com/wjkang/easy-socket-browser)**

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
       let location = url.parse(context.req.url, true);
       let token=location.query.token;
       if(!token){
           client.send("invalid token");
           client.close(1003, "invalid token");
           return;
       }
       context.client.token=token;
       next();
    })
    .listen(config)
```

**context properties**:

| property | description |  |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| client | current connect client ||
| req | req.url ||

## close Middleware
```js
const easySocket = new EasySocket();
easySocket
    .closeUse((context,next)=>{
        let server = context.server;
        let client = context.client;
        let code = context.code;
        let reason = context.message;
        if (code === 1003 && reason === 'invalid token') {
            console.log("'invalid token' closed")
        }else{
            console.log(client.token + " closed");
        }
        next();
    })
```

**context properties**:

| property | description |  |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| client | current client ||
| code | close code ||
| message | close reason ||

## message Middleware
```js
const easySocket = new EasySocket();
easySocket
    .messageUse((context,next)=>{
        if (context.req.type === 'event' && context.req.event === 'addRoom') {
            if (!context.server.roomMap) {
                context.server.roomMap = new Map();
            }
            let roomId = shortid.generate();
            context.req.args.id = roomId;
            context.server.roomMap.set(roomId, {
                id:roomId,
                name: context.req.args.name,
                userList: []
            });
        }
        console.log(context.client.token+' send '+context.req);
        next();
    })
```
receive `{"type":"event","event":"addRoom","args":{"name":"myroom"}}` from browser

then context.req is `{"type":"event","event":"addRoom","args":{"name":"myroom"}}`

**context properties**:

| property | description |  |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| client | current client ||
| req | receive message from client||

## error Middleware
```js
const easySocket = new EasySocket();
easySocket
    .errorUse((context,next)=>{
        console.log(context.error);
        next();
    })
```
**context properties**:

| property | description |  |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| client | current client ||
| error | error||

## remoteEmit Middleware
```js
const easySocket = new EasySocket();
easySocket
    .messageUse((context,next)=>{
        if (context.req.type === 'event') {
            context.server.emit(context.req.event, context.req.args);//will call remoteEmit Middleware 
        }
        next();
    })
    .remoteEmitUse((context,next)=>{
        let server = context.server;
        let event = context.event;
        //broadcast
        for (let client of server.clients.values()) {
            client.send({
                type: 'event',
                event: event.event,
                args: event.args
            });
        }
    })

```

receive `{"type":"event","event":"addRoom","args":{"name":"myroom"}}` from browser

then send `{"type":"event","event":"addRoom","args":{"name":"myroom"}}` to all clients


**context properties**:

| property | description |  |
| ------ | ------ | ------ |
| server | instance of EasySocket||
| event | event and args ||

## build a route middleware to process message 

messageRouteMiddleware.js

```js
export default (routes) => {
    return async (context, next) => {
        if (context.req.type === 'event') {
            if (routes[context.req.event]) {
                await routes[context.req.event](context);
            } else {
                context.server.emit(context.req.event, context.req.args);
            }
        }
        next();
    }
}
```
route.js
```js
{
    addRoom: function (context) {
        if (!context.server.roomMap) {
            context.server.roomMap = new Map();
        }
        let roomId = shortid.generate();
        context.req.args.id = roomId;
        context.server.roomMap.set(roomId, {
            id: roomId,
            name: context.req.args.name,
            userList: []
        });
        context.server.emit("addRoom", context.req.args);
        console.log("addRoom")
    },
    enterRoom: function (context) {
        let room = context.server.roomMap.get(context.req.args.room.id);
        room.userList.push({ ...context.req.args.user });
        context.server.emit("enterRoom", context.req.args);
        console.log("enterRoom")
    },
    leaveRoom: function (context) {
        let room = context.server.roomMap.get(context.req.args.room.id);
        room.userList.splice(room.userList.findIndex((user) => user.id == context.req.args.user.id), 1);
        context.server.emit("enterRoom", context.req.args);
        console.log("enterRoom")
    }
}
```
app2.js
```js
const easySocket = new EasySocket();
easySocket
    .messageUse(im.messageRouteMiddleware(imMergeRoutes))
    .remoteEmitUse(im.remoteEmitMiddleware())
    .listen(config)
```

[complete example](https://github.com/wjkang/easy-socket-node/tree/master/examples/chat-routeMiddleware)

## example and online demo

[chat example](https://github.com/wjkang/easy-socket-node/tree/master/examples/chat)

[online chat demo](http://jaycewu.coding.me/easy-socket-chat/#/)








