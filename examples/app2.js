
import im from './chat-routeMiddleware';
import imRoutes from './chat-routeMiddleware/routes';
import EasySocket from '../src';

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

const imMergeRoutes = {};
Object.keys(imRoutes).forEach(function (key) {
    Object.assign(imMergeRoutes, imRoutes[key].default)
});
const easySocket = new EasySocket();
easySocket
    .connectionUse(im.connectMiddleware())
    .closeUse(im.closeMiddleware())
    .messageUse(im.messageRouteMiddleware(imMergeRoutes))
    .remoteEmitUse(im.remoteEmitMiddleware())
    .listen(config)

easySocket.on("chat message", function (data) {
    //触发执行remoteEmit中间件(如果有)
    easySocket.emit("chat message", data);
});
easySocket.on("user login", function (data) {
    //触发执行remoteEmit中间件(如果有)
    easySocket.emit("user login", data);
});

console.log('Now start WebSocket server on port ' + config.port + '...')
