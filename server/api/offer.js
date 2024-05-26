export default (req, res) => {
  const { offer, roomName } = req.body;
  if (!global.rooms) global.rooms = {};
  global.rooms[roomName].clients[0].messages.push({ type: 'offer', data: offer });
  res.sendStatus(200);
};
