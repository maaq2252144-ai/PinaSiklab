<?php
require_once __DIR__ . '/includes/db.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install'])) {
    try {
        install_demo_data();
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}
$ready = db_ready();
$title = 'WasteLedger PH Prototype';
$root = '';
require __DIR__ . '/includes/head.php';
?>
<main style="max-width:520px;margin:0 auto;padding:32px 16px;display:flex;flex-direction:column;gap:16px;width:100%">
  <img src="assets/img/placeholder-logo.svg" alt="Logo placeholder" width="96" height="96">
  <h1>WasteLedger PH Prototype</h1>
  <p class="sub">Sample data only. No real SMS or money moves.</p>
  <?php if ($error !== ''): ?>
    <p class="error" role="alert"><?= htmlspecialchars($error) ?></p>
  <?php endif; ?>
  <?php if (!$ready): ?>
    <div class="note warn">
      <p><b>The database is not set up yet.</b> Start MySQL in the XAMPP Control Panel, then press the button.</p>
    </div>
    <form method="post"><button class="btn big" name="install" value="1">Set up demo database</button></form>
  <?php else: ?>
    <a class="btn big" href="supplier/">Farmer and vendor app</a>
    <a class="btn big" href="station/">Station staff app</a>
    <a class="btn outline" href="demo/">Demo Controls</a>
  <?php endif; ?>
</main>
</body>
</html>
