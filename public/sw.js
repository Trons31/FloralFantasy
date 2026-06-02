self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Nueva notificación", {
      body: data.body ?? "",
      icon: data.icon ?? "/flowers/logo.png",
      badge: data.badge ?? "/flowers/logo.png",
      tag: data.tag ?? data.title ?? "fantasia-floral",
      data: {
        url: data.url ?? "/dashboard/todos-pedidos",
        ...(data.data ?? {}),
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard/todos-pedidos";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === new URL(url, self.location.origin).pathname) {
            return client.focus();
          }
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }

      return undefined;
    })
  );
});
