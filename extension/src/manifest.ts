const manifest = {
  manifest_version: 3,
  name: "Network Request Capture",
  version: "1.0",
  description: "Capture and analyze network requests",
  permissions: [
    "webRequest",
    "storage"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  background: {
    service_worker: "background.js",
    type: "module"
  },
  action: {
    default_popup: "popup.html"
  }
};
