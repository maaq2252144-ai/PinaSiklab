// Launcher (index.html): checks the demo database and offers to create it on the first visit.
const $ = (id) => document.getElementById(id);

function showError(text) {
  $('launcher-error').textContent = text;
  $('launcher-error').hidden = false;
}

function showState(ready) {
  $('launcher-checking').hidden = true;
  $('launcher-setup').hidden = ready;
  $('launcher-apps').hidden = !ready;
}

async function checkDatabase() {
  try {
    const r = await api('setup', 'status');
    showState(r.ready);
  } catch (e) {
    $('launcher-checking').hidden = true;
    showError('Something went wrong loading the demo data. Reload the page.');
  }
}

$('install-btn').addEventListener('click', async (ev) => {
  const btn = ev.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Setting up…';
  $('launcher-error').hidden = true;
  try {
    const r = await api('setup', 'install', {});
    showState(r.ready);
  } catch (e) {
    if (e.code === 'already_installed') showState(true);
    else showError(e.detail || 'Setup failed. Check that MySQL is running in the XAMPP Control Panel.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Set up demo database';
  }
});

checkDatabase();
