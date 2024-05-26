export default (req, res) => {
  const { answer, roomName } = req.body;
  if (!global.rooms) global.rooms = {};
  global.rooms[roomName].clients[1].messages.push({ type: 'answer', data: answer });
  res.sendStatus(200);
};
