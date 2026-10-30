// Calls one of the PHP endpoints in api/<endpoint>/index.php. Needs APP_ROOT from js/core/utils.js.
async function api(endpoint, action, data) {
  const res = await fetch(`${APP_ROOT}api/${encodeURIComponent(endpoint)}/index.php?action=${encodeURIComponent(action)}`, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.ok) {
    const err = new Error(json.error || 'server_error');
    err.code = json.error;
    err.status = res.status;
    err.detail = json.message || '';
    throw err;
  }
  return json;
}
