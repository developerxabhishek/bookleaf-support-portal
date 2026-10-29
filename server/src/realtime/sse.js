
const connections = new Set();
const HEARTBEAT_MS = 25_000;

export function openEventStream(req, res, user) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Stops reverse proxies (nginx, Render) from buffering the stream.
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');

  const connection = { userId: user.id, role: user.role, res };
  connections.add(connection);

  // Comment lines keep idle connections from being closed by proxies.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    connections.delete(connection);
  });
}

/**
 * Sends an event to every matching open connection.
 * audience: { admins?: boolean, authorId?: string }  (authorId = the ticket author's user id)
 */
export function publish(event, audience) {
  const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const connection of connections) {
    const isAdminTarget = audience.admins && connection.role === 'admin';
    const isAuthorTarget = audience.authorId !== undefined && connection.userId === audience.authorId;
    if (isAdminTarget || isAuthorTarget) connection.res.write(frame);
  }
}
