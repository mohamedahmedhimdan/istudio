/**
 * Proxies Pexels search so the API key stays on the server.
 * Netlify: Site settings → Environment variables → PEXELS_API_KEY = your key
 */
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method" }) };
  }

  const key =
    process.env.PEXELS_API_KEY ||
    process.env.ISTUDIO_PEXELS_KEY ||
    "yY04Ov63MhHduBaPya91TrSNIIvjmSfsbJ1GtdVdkJadohpMwd9JP76V";

  const q = event.queryStringParameters?.q || "interior architecture";
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&orientation=portrait`;

  try {
    const res = await fetch(url, { headers: { Authorization: key } });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { statusCode: 502, headers, body: JSON.stringify({ error: "bad_upstream", photos: [] }) };
    }
    return { statusCode: res.ok ? 200 : res.status, headers, body: JSON.stringify(data) };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(e.message || e), photos: [] })
    };
  }
};
