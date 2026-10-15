/* Nido service worker: push notifications only.
 *
 * No caching on purpose: offline behaviour is decided by
 * TASK-OFF-VITTORIOGIORDANOYBQ-001, and the ADR-PUSH-VITTORIOGIORDANOYBQ-001
 * keeps this file tiny.
 */

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (error) {
    payload = {}
  }

  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Nido'
  const options = {
    body: typeof payload.body === 'string' ? payload.body : '',
    tag: typeof payload.tag === 'string' ? payload.tag : undefined,
    data: { url: typeof payload.url === 'string' && payload.url ? payload.url : '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(target)
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      }),
  )
})
