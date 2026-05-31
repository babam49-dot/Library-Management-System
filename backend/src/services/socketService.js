/**
 * socketService.js
 * Central WebSocket broadcast hub.
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage (inside any route / controller):
 *   const { broadcast } = require('../services/socketService');
 *   broadcast('reservation:update', { memberId, reservationId, status });
 *
 * Rooms:
 *   member:<memberId>   – notifications for that specific member
 *   staff               – all staff/admin viewers
 *   global              – everyone (catalog stock changes, etc.)
 * ─────────────────────────────────────────────────────────────────────────────
 */

let _io = null;

/**
 * Called once from index.js after Socket.IO is attached to the HTTP server.
 * @param {import('socket.io').Server} io
 */
function init(io) {
  _io = io;

  io.on('connection', (socket) => {
    /**
     * Client may emit in two forms:
     *   socket.emit('join', 'member:5')           <- string room name
     *   socket.emit('join', { memberId: 5 })       <- object payload
     */
    socket.on('join', (payload) => {
      if (typeof payload === 'string') {
        // Direct room name, e.g. 'member:5' or 'staff'
        socket.join(payload);
        socket.join('global');
      } else if (payload && typeof payload === 'object') {
        const { memberId, role } = payload;
        if (memberId) socket.join(`member:${memberId}`);
        if (role === 'staff' || role === 'admin') socket.join('staff');
        socket.join('global');
      }
    });

    socket.on('disconnect', () => {});
  });
}

/**
 * Broadcast an event to a room or globally.
 * @param {string} event
 * @param {*} data
 * @param {string} [room='global']
 */
function broadcast(event, data, room = 'global') {
  if (!_io) return;
  _io.to(room).emit(event, data);
}

/**
 * Emit to a specific member's room.
 * @param {number|string} memberId
 * @param {string} event
 * @param {*} data
 */
function notifyMember(memberId, event, data) {
  broadcast(event, data, `member:${memberId}`);
}

/**
 * Emit to all staff/admin viewers.
 * @param {string} event
 * @param {*} data
 */
function notifyStaff(event, data) {
  broadcast(event, data, 'staff');
}

module.exports = { init, broadcast, notifyMember, notifyStaff };
