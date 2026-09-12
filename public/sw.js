// Service Worker for EgyCPM Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "EgyCPM Store 🚗⚡";
    const options = {
      body: data.body || "إشعار جديد من متجر CPM 2",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      image: data.image || undefined,
      tag: data.tag || "egycpm-push",
      data: {
        url: data.url || "/",
      },
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: data.requireInteraction || false,
      actions: [
        {
          action: "open",
          title: "مشاهدة العرض ↗",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Fallback for raw text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("EgyCPM Store 🚗", {
        body: text,
        icon: "/favicon.ico",
        data: { url: "/" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if (client.url !== targetUrl && "navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
