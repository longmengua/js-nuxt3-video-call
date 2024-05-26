export default (req, res) => {
  const { roomName } = req.body;
  if (!global.rooms) global.rooms = {};
  if (!global.rooms[roomName]) {
    global.rooms[roomName] = { clients: [] };
    res.json({ status: 'created' });
  } else if (global.rooms[roomName].clients.length < 2) {
    res.json({ status: 'joined' });
  } else {
    res.json({ status: 'full' });
  }
};
