// Demo Controls: a stand-in for the City Admin and facility steps, which are not built.
const box = document.getElementById('demo');
const msg = document.getElementById('msg');
const say = (t) => { msg.textContent = t; msg.hidden = false; };
const ERR = { no_funding: 'Blocked: this city has no active funding source (FR50).', bad_status: 'That status change is not allowed.' };

async function draw() {
  const d = await api('payouts', 'state');
  const pending = d.payouts.filter((p) => p.status === 'pending' && !p.approved_at);
  const approved = d.payouts.filter((p) => p.status === 'pending' && p.approved_at);
  const closed = d.payouts.filter((p) => p.status !== 'pending');
  box.innerHTML = `<div class="stack">
    <section class="card"><h2>1. Balances</h2>
      ${d.balances.map((s) => `<div class="kv"><span>${esc(s.name)}</span><span>${esc(peso(s.balance))}${s.balance >= d.threshold ? ' · reached' : ''}</span></div>`).join('')}
      <button class="btn" data-a="generate">Generate payout list (${esc(peso(d.threshold))} and up)</button></section>
    <section class="card"><h2>2. City approves the list</h2>
      ${pending.length ? pending.map((p) => `<div class="kv"><span>${esc(p.name)}</span><span>${esc(peso(p.amount))}</span></div>`).join('') : '<p class="sub">Nothing waiting for approval.</p>'}
      <button class="btn" data-a="approve" ${pending.length ? '' : 'disabled'}>Approve list</button></section>
    <section class="card"><h2>3. City's payment channel reports back</h2>
      ${approved.length ? approved.map((p) => `<div class="spread"><span>${esc(p.name)} · ${esc(peso(p.amount))}</span><span class="chips">
        <button class="chip" data-a="mark" data-id="${p.id}" data-s="sent">${icon('check', 18)}Sent</button>
        <button class="chip" data-a="mark" data-id="${p.id}" data-s="failed">${icon('x', 18)}Failed</button></span></div>`).join('') : '<p class="sub">Nothing being sent.</p>'}
      ${closed.map((p) => `<div class="kv"><span>${esc(p.name)} · ${esc(p.ref)}</span><span>${esc(peso(p.amount))} · ${esc(p.status)}</span></div>`).join('')}</section>
    <section class="card"><h2>Irisan confirms a delivery</h2>
      ${d.manifests.length ? d.manifests.map((m) => `<div class="spread"><span>Manifest #${esc(m.id)} · ${kg(m.total_kg)}</span><button class="chip" data-a="confirm_manifest" data-id="${m.id}">Confirm</button></div>`).join('') : '<p class="sub">No manifests waiting. Create one in the station app.</p>'}</section>
    <section class="card"><h2>Settings</h2>
      <label class="check"><input type="checkbox" data-t="baseline_mode" ${d.baseline ? 'checked' : ''}><span>Baseline weeks: weigh and record, no pay</span></label>
      <label class="check"><input type="checkbox" data-t="funding_active" ${d.funding ? 'checked' : ''}><span>City funding source is active</span></label></section>
    <section class="card"><h2>Reset</h2><p class="sub small">Erases everything in the demo database and reloads the sample data.</p>
      <button class="btn warn" data-a="reset">Reset demo data</button></section>
  </div>`;
}

document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'reset' && !confirm('Erase the demo data and reload the samples?')) return;
  try {
    const r = await api('payouts', a, { id: b.dataset.id, status: b.dataset.s });
    if (a === 'generate') say(`${r.made} added to the list.`);
    else if (a === 'approve') say(`${r.approved} approved. Check the supplier app.`);
    else if (a === 'reset') {
      try { ['st_queue', 'st_today', 'st_cache'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* nothing stored */ }
      say('Demo data reloaded.');
    } else say('Done.');
  } catch (e) { say(ERR[e.code] || 'Something went wrong: ' + e.code); }
  draw();
});
document.addEventListener('change', async (ev) => {
  if (ev.target.dataset.t) {
    await api('payouts', 'toggle', { key: ev.target.dataset.t, on: ev.target.checked });
    say('Setting saved.');
  }
});
draw().catch((e) => say('Could not load: ' + e.message));
