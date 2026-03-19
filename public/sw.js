self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {
    title: 'Actualización de HotelOps Pro',
    body: 'Tienes una nueva tarea o alerta pendiente.'
  };

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ver Detalle' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'close') return;

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});
