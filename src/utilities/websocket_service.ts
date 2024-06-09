import { Server, Socket } from "socket.io";

interface IDictionary {
    [key: string]: Socket
};

const client_scokets: IDictionary = {};

export default (wss: Server) => {
    wss.on('connection', (socket: Socket) => {
        console.log(`a user connected ID:${socket.id}`);

        socket.on("NOTIFY_SUBSCRIBE", async (user_id) => {

            if (user_id in client_scokets) {
                socket.emit("userExists", `${user_id} username is taken! Try some other username.`)
                console.log(`User with ID(${user_id}) already exists.`);
            } else {
                socket.data.userId = user_id;
                client_scokets[user_id] = socket;
                console.log(`user id: ${user_id} subscribed on socketId:${socket.id}`);
                socket.emit("userSet", { username: user_id });
                // socket.emit("NOTIFIED", { message: data, user: user_id });
            }

            for (let [key, value] of Object.entries(client_scokets)) {
                console.log(`${key}: ${value.id}`);
            }
        });

        socket.on("msg", function (data) {
            //Send message to everyone
            // for (let key in client_scokets) {
            //     client_scokets[key].emit("newmsg", data)
            // }
            wss.sockets.emit("NOTIFIED", data);
        });

        socket.on("disconnect", function () {
            console.log(`user disconnected ID:${socket.id}`);

            delete client_scokets[socket.data.userId];
            for (let [key, value] of Object.entries(client_scokets)) {
                console.log(`${key}: ${value.id}`);
            }
        });

    });
};

export { client_scokets };




