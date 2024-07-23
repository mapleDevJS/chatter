import express, { Application, Request, Response } from 'express';
import http, { Server } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import expressRateLimit from 'express-rate-limit';

const app: Application = express();
const server: Server = http.createServer(app);
const io: SocketIOServer = new SocketIOServer(server);
const port: number = 3000;

const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const rateLimitMaxRequest = 100; // limit each IP to 100 requests per window

const apiLimiter = expressRateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMaxRequest,
    message: 'Too many requests from this IP, please try again after an hour'
});

app.use(apiLimiter);

const filesMap = new Map<string, string>([
    ['/', 'index'],
    ['/javascript', 'javascript'],
    ['/swift', 'swift'],
    ['/css', 'css']
]);

// Defining types for data that comes with socket events
type JoinEvent = { room: string };
type MessageEvent = { msg: string, room: string };

const publicFileResponse = (file: string) => (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/public/${file}.html`);
};

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

filesMap.forEach((value, key) => {
    app.get(key, publicFileResponse(value));
});

const tech = io.of('/tech');
tech.on('connection', (socket: Socket) => {
    socket.on('join', (data: JoinEvent) => {
        socket.join(data.room);
        tech.in(data.room).emit('message', `New user joined ${data.room} room!`);
    });
    socket.on('message', (data: MessageEvent) => {
        console.log(`message: ${data.msg}`);
        tech.in(data.room).emit('message', data.msg);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        tech.emit('message', 'user disconnected');
    });
});
