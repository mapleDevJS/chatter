import express from 'express';
import http from 'http';
import { Server as socketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new socketIOServer(server);
const port = 3000;

const publicFileResponse = (file) => (req, res) => {
    res.sendFile(`${__dirname}/public/${file}.html`);
};

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/', publicFileResponse('index'));
app.get('/javascript', publicFileResponse('javascript'));
app.get('/swift', publicFileResponse('swift'));
app.get('/css', publicFileResponse('css'));

const tech = io.of('/tech');
tech.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        tech.in(data.room).emit('message', `New user joined ${data.room} room!`);
    });
    socket.on('message', (data) => {
        console.log(`message: ${data.msg}`);
        tech.in(data.room).emit('message', data.msg);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        tech.emit('message', 'user disconnected');
    });
});
