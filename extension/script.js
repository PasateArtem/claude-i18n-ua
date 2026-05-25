const PAGE_SOURCE = "claude-i18n-page";
const EXTENSION_SOURCE = "claude-i18n-extension";
const EXTENSION_REQUEST_TYPE = "extension-request";
const EXTENSION_RESPONSE_TYPE = "extension-response";

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const request = parseExtensionRequest(event.data);
  if (!request) {
    return;
  }

  try {
    const payload = await chrome.runtime.sendMessage({
      type: request.action,
      payload: request.payload,
    });

    postExtensionResponse(request.requestId, payload);
  } catch (error) {
    postExtensionResponse(request.requestId, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

function parseExtensionRequest(data) {
  if (!data || data.source !== PAGE_SOURCE || data.type !== EXTENSION_REQUEST_TYPE) {
    return null;
  }

  return {
    requestId: data.requestId,
    action: data.action,
    payload: data.payload,
  };
}

function postExtensionResponse(requestId, payload) {
  window.postMessage(
    {
      source: EXTENSION_SOURCE,
      type: EXTENSION_RESPONSE_TYPE,
      requestId,
      payload,
    },
    window.location.origin,
  );
}
