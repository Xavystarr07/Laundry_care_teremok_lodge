<?php
session_start();

// ── Load shared DB connection ─────────────────────────────────────────────────
require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO(
        "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    $_SESSION['popup'] = [
        'type' => 'error',
        'msg'  => 'Database connection failed: ' . $e->getMessage(),
        'tip'  => '💡 Check config.php credentials.'
    ];
    header('Location: ../invoice_generator.php');
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['save_invoice'])) {

    // ── Invoice number ────────────────────────────────────────────────────────
    $raw           = trim($_POST['invoice_number'] ?? '');
    $digitsOnly    = preg_replace('/\D/', '', $raw);
    $invoiceNumber = intval($digitsOnly);

    if ($digitsOnly === '' || strlen($digitsOnly) < 1 || $invoiceNumber < 1 || $invoiceNumber > 50000) {
        $_SESSION['popup'] = [
            'type' => 'error',
            'msg'  => 'Invoice number must be between 1 and 50000.',
            'tip'  => '💡 Enter a valid 1–5 digit invoice number (e.g. 12345).'
        ];
        header('Location: ../invoice_generator.php');
        exit;
    }

    $hotelName    = trim($_POST['hotel']         ?? '');
    $hotelNumber  = trim($_POST['unit-number']   ?? '');
    $dateReceived = trim($_POST['date_received'] ?? '');
    $grandTotal   = floatval($_POST['grandTotal'] ?? 0);

    // ── Check for duplicate ───────────────────────────────────────────────────
    $check = $pdo->prepare('SELECT COUNT(*) FROM invoices WHERE "InvoiceNumber" = :num');
    $check->execute([':num' => $invoiceNumber]);
    if ($check->fetchColumn() > 0) {
        $_SESSION['popup'] = [
            'type' => 'dupe',
            'msg'  => "Invoice #$invoiceNumber already exists in the database.",
            'tip'  => '💡 Please use a different invoice number.'
        ];
        $_SESSION['restore_invoice'] = $invoiceNumber;
        header('Location: ../invoice_generator.php');
        exit;
    }

    // ── Missing fields ────────────────────────────────────────────────────────
    $missing = [];
    if (empty($hotelName))    $missing[] = "Hotel Name";
    if (empty($hotelNumber))  $missing[] = "Unit Number";
    if (empty($dateReceived)) $missing[] = "Date Received";
    if ($grandTotal <= 0)     $missing[] = "Grand Total";

    if (!empty($missing)) {
        $_SESSION['popup'] = [
            'type' => 'error',
            'msg'  => 'Missing: ' . implode(', ', $missing),
            'tip'  => '💡 Fill in all fields before saving.'
        ];
        header('Location: ../invoice_generator.php');
        exit;
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    try {
        $stmt = $pdo->prepare('
            INSERT INTO invoices ("InvoiceNumber", "HotelName", "HotelNumber", "DateReceived", "Total")
            VALUES (:inv, :hotel, :unit, :date, :total)
            RETURNING id
        ');
        $stmt->execute([
            ':inv'   => $invoiceNumber,
            ':hotel' => $hotelName,
            ':unit'  => $hotelNumber,
            ':date'  => $dateReceived,
            ':total' => $grandTotal,
        ]);
        $_SESSION['last_save'] = ['type' => 'regular', 'ids' => [(int)$stmt->fetchColumn()], 'time' => time()];

        $_SESSION['popup'] = [
            'type' => 'success',
            'msg'  => "Invoice #$invoiceNumber saved successfully! 🎊",
            'tip'  => '✅ Ready for a new invoice.'
        ];
    } catch (Exception $e) {
        $_SESSION['popup'] = [
            'type' => 'error',
            'msg'  => 'Database error: ' . $e->getMessage(),
            'tip'  => '💡 Contact your system administrator.'
        ];
    }

    header('Location: ../invoice_generator.php');
    exit;
}
