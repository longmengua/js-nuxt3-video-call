export default (req, res) => {
  const { roomName } = req.query;
  if (!global.rooms) global.rooms = {};
  const client = global.rooms[roomName].clients[global.rooms[roomName].clients.length - 1];
  res.json(client.messages);
  client.messages = [];
};
