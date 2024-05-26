export default (req, res) => {
  const { roomName } = req.body;
  if (!global.rooms) global.rooms = {};
  if (!global.rooms[roomName]) {
    global.rooms[roomName] = { clients: [] };
  }
  global.rooms[roomName].clients.push({ id: Date.now(), messages: [] });
  res.sendStatus(200);
};
