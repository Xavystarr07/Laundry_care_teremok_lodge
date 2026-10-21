<?php
// Returns ['type'=>...] once, right after a save (used to show the Undo toast)
function undoAvailable(): ?array {
    $ls = $_SESSION['last_save'] ?? null;
    if (!$ls || !empty($ls['shown']) || time() - $ls['time'] > 30) return null;
    $_SESSION['last_save']['shown'] = true;
    return ['type' => $ls['type']];
}