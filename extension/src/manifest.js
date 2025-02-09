"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var manifest = {
    manifest_version: 3,
    name: "Network Request Capture",
    version: "1.0",
    description: "Capture network request/response bodies, headers for specific URLs",
    permissions: [
        "webRequest",
        "storage",
        "declarativeNetRequest"
    ],
    host_permissions: ["<all_urls>"],
    background: {
        service_worker: "background.js", // Changed from src/background.ts to background.js
        type: "module"
    },
    action: {
        default_popup: "popup.html",
        default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    },
    icons: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
    }
};
exports.default = manifest;
