const axios = require("axios").default;

axios.defaults.baseURL = `https://localhost:${window.ST_PROXY_PORT}/cogs.10pearls.com:443`;
(async () => {
  try {
    alert("starting request");
    const response = await axios.get(`/`, {
      headers: { Origin: "https://www.google.com" },
    });
    alert(response.data);
  } catch (e) {
    alert(`error: ${JSON.stringify(e)}`);
  }
})();
