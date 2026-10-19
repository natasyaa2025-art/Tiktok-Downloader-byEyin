
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet() {
  return jsonResponse({
    service: "TikTok Downloader API",
    status: "backend_active",
    downloadProvider: "not_configured",
    message: "API unduhan belum dihubungkan."
  });
}

export async function onRequestPost({ request }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({
      success: false,
      message: "Data permintaan tidak valid."
    }, 400);
  }

  const { url, type } = body || {};

  if (typeof url !== "string" || url.length > 2048) {
    return jsonResponse({
      success: false,
      message: "Link tidak valid."
    }, 400);
  }

  if (!["video", "photo", "audio"].includes(type)) {
    return jsonResponse({
      success: false,
      message: "Pilih video, foto, atau audio."
    }, 400);
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return jsonResponse({
      success: false,
      message: "Format link tidak benar."
    }, 400);
  }

  const hosts = [
    "tiktok.com",
    "www.tiktok.com",
    "m.tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com"
  ];

  if (
    parsed.protocol !== "https:" ||
    !hosts.includes(parsed.hostname.toLowerCase())
  ) {
    return jsonResponse({
      success: false,
      message: "Masukkan link HTTPS dari TikTok."
    }, 400);
  }

  return jsonResponse({
    success: false,
    code: "PROVIDER_NOT_CONFIGURED",
    message:
      "Link sudah diperiksa, tetapi API downloader belum terhubung."
  }, 501);
}
