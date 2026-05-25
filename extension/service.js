const REMOTE_I18N_BASE_URL = "https://claude-i18n.vercel.app";
const VERSION_CACHE_KEY_PREFIX = "claude-i18n:version:";
const RESOURCE_CACHE_NAME = "claude-i18n-cache-v1";
const VERSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const RESOURCE_HASH_INDEX = {
  base: 0,
  statsig: 1,
};
const MESSAGE_HANDLERS = {
  "fetch-locales-manifest": fetchLocalesManifest,
  "get-i18n-resource": getI18nResource,
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  return true;
});

async function handleMessage(message) {
  if (!message || typeof message !== "object") {
    return {
      ok: false,
      error: "Invalid message payload",
    };
  }

  const handler = MESSAGE_HANDLERS[message.type];
  if (!handler) {
    return {
      ok: false,
      error: `Unknown message type: ${String(message.type)}`,
    };
  }

  return handler(message.payload);
}

async function fetchLocalesManifest() {
  const { response, data } = await fetchJsonNoStore(`${REMOTE_I18N_BASE_URL}/locales.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch locales manifest: ${response.status}`);
  }

  if (!data || !Array.isArray(data.locales)) {
    throw new Error("Remote locales manifest is invalid");
  }

  return {
    ok: true,
    version: typeof data.version === "string" ? data.version : "",
    locales: data.locales.filter(isString),
  };
}

async function getI18nResource(payload) {
  const request = normalizeI18nResourceRequest(payload);
  if (!request) {
    return {
      ok: false,
      error: "Invalid i18n resource request",
    };
  }

  const { locale, kind } = request;
  const versionInfo = await getVersionInfo(locale);
  const resourceHash = versionInfo.hash?.[RESOURCE_HASH_INDEX[kind]];
  if (typeof resourceHash !== "string" || resourceHash.length === 0) {
    return {
      ok: false,
      error: `Missing ${kind} hash for locale ${locale}`,
    };
  }

  const cacheKey = buildResourceCacheKey(locale, kind, resourceHash);
  const cache = await caches.open(RESOURCE_CACHE_NAME);
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return responseToPayload(cachedResponse);
  }

  const remoteUrl = buildRemoteI18nUrl(locale, kind);
  const { response: remoteResponse, body } = await fetchTextNoStore(remoteUrl);
  if (!remoteResponse.ok) {
    return {
      ok: false,
      error: `Failed to fetch ${remoteUrl}: ${remoteResponse.status}`,
      status: remoteResponse.status,
    };
  }

  const responseToCache = createCacheableResponse(remoteResponse, body);

  await cache.put(cacheKey, responseToCache.clone());
  await pruneOldCacheEntries(cache, locale, kind, resourceHash);

  return responseToPayload(responseToCache);
}

async function getVersionInfo(locale) {
  const storageKey = buildVersionStorageKey(locale);
  const stored = await chrome.storage.local.get(storageKey);
  const cached = stored[storageKey];
  const now = Date.now();

  if (isFreshVersionCache(cached, now)) {
    return cached;
  }

  try {
    const { response, data } = await fetchJsonNoStore(
      `${REMOTE_I18N_BASE_URL}/version/${encodeURIComponent(locale)}.json`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch version for ${locale}: ${response.status}`);
    }

    const next = normalizeVersionInfo(locale, data, now);

    await chrome.storage.local.set({
      [storageKey]: next,
    });

    return next;
  } catch (error) {
    if (cached && Array.isArray(cached.hash)) {
      return cached;
    }

    throw error;
  }
}

function isFreshVersionCache(value, now) {
  return (
    value &&
    Array.isArray(value.hash) &&
    typeof value.checkedAt === "number" &&
    now - value.checkedAt < VERSION_REFRESH_INTERVAL_MS
  );
}

function buildRemoteI18nUrl(locale, kind) {
  if (kind === "statsig") {
    return `${REMOTE_I18N_BASE_URL}/i18n/statsig/${encodeURIComponent(locale)}.json`;
  }

  return `${REMOTE_I18N_BASE_URL}/i18n/${encodeURIComponent(locale)}.json`;
}

function buildResourceCacheKey(locale, kind, hash) {
  return `https://cache.claude-i18n.local/${encodeURIComponent(locale)}/${kind}/${hash}.json`;
}

async function pruneOldCacheEntries(cache, locale, kind, currentHash) {
  const keys = await cache.keys();
  const prefix = `https://cache.claude-i18n.local/${encodeURIComponent(locale)}/${kind}/`;

  await Promise.all(
    keys.map((request) => {
      if (!request.url.startsWith(prefix) || request.url.endsWith(`/${currentHash}.json`)) {
        return Promise.resolve();
      }

      return cache.delete(request);
    }),
  );
}

async function responseToPayload(response) {
  const body = await response.text();
  return {
    ok: true,
    status: response.status,
    statusText: response.statusText,
    headers: headersToObject(response.headers),
    body,
  };
}

async function fetchJsonNoStore(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  return {
    response,
    data: await response.json(),
  };
}

async function fetchTextNoStore(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  return {
    response,
    body: await response.text(),
  };
}

function normalizeI18nResourceRequest(payload) {
  const locale = payload?.locale;
  const kind = payload?.kind;

  if (typeof locale !== "string" || (kind !== "base" && kind !== "statsig")) {
    return null;
  }

  return {
    locale,
    kind,
  };
}

function buildVersionStorageKey(locale) {
  return `${VERSION_CACHE_KEY_PREFIX}${locale}`;
}

function normalizeVersionInfo(locale, data, checkedAt) {
  return {
    locale,
    hash: Array.isArray(data.hash) ? data.hash : [],
    builtAt: typeof data.builtAt === "string" ? data.builtAt : "",
    checkedAt,
  };
}

function createCacheableResponse(response, body) {
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
    },
  });
}

function headersToObject(headers) {
  const output = {};
  for (const [key, value] of headers.entries()) {
    output[key] = value;
  }
  return output;
}

function isString(value) {
  return typeof value === "string";
}
