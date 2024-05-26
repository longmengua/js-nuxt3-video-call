export default (req, res) => {
  const { candidate, roomName } = req.body;
  if (!global.rooms) global.rooms = {};
  global.rooms[roomName].clients.forEach(client => client.messages.push({ type: 'candidate', data: candidate }));
  res.sendStatus(200);
};
