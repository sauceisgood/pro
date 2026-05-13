const BACKEND_URL = process.env.BACKEND_URL; // ex: http://122.22.333.22:5000

export default async function handler(req, res) {
  const { method, headers, body } = req;

  // Monta a URL de destino preservando path e query string
  const targetUrl = `${BACKEND_URL}${req.url}`;

  try {
    const fetchOptions = {
      method,
      headers: {
        // Repassa os headers originais, mas remove o 'host' para não confundir o Flask
        ...headers,
        host: undefined,
        "x-forwarded-for": undefined, // opcional: esconde o IP do cliente também
      },
    };

    // Repassa o body para métodos que o suportam
    if (["POST", "PUT", "PATCH"].includes(method)) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Repassa status e headers da resposta do Flask
    res.status(response.status);
    response.headers.forEach((value, key) => {
      // Evita headers problemáticos
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Bad Gateway", detail: err.message });
  }
}
