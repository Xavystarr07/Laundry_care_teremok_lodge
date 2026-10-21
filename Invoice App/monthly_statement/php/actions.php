<?php
// ============================================================
//  php/actions.php — Handles form POST & session state
//  Add new actions here if you add new statement types
// ============================================================

function handlePostActions() {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") return;

    $action = $_POST['action'] ?? '';

    if ($action === "weeklyStatement" || $action === "weeklyAll") {
        $_SESSION['startDate'] = $_POST['startDate'] ?? '';
        $_SESSION['endDate']   = $_POST['endDate']   ?? '';
        if (isset($_POST['hotelName'])) {
            $_SESSION['hotelName'] = $_POST['hotelName'];
        }
        $_SESSION['action'] = $action;

    } elseif ($action === "viewStatement" && isset($_POST['hotelName'])) {
        $_SESSION['hotelName'] = $_POST['hotelName'];
        $_SESSION['action']    = $action;

    } elseif ($action === "monthlyStatement") {
        unset($_SESSION['hotelName']);
        $_SESSION['action'] = $action;
    }

    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
}
