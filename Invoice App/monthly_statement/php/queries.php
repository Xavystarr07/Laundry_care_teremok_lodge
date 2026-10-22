<?php
// ============================================================
//  php/queries.php — All SQL queries
//  Edit individual functions to change what data is fetched
// ============================================================

function getUnitStatement($pdo, $hotelName) {
    $stmt = $pdo->prepare('
        SELECT "HotelNumber", SUM("Total") AS "UnitTotal"
        FROM teremok_invoices
        WHERE period_id = (SELECT id FROM teremok_periods WHERE is_closed = FALSE ORDER BY id LIMIT 1) AND "HotelName" = :hotel
        GROUP BY "HotelNumber"
        ORDER BY "HotelNumber" ASC
    ');
    $stmt->execute([':hotel' => $hotelName]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'UnitTotal'));
    return ['rows' => $rows, 'total' => $total];
}

function getMonthlyStatement($pdo) {
    $stmt = $pdo->query('
        SELECT "InvoiceNumber", "DateReceived", "Total"
        FROM teremok_invoices
        WHERE period_id = (SELECT id FROM teremok_periods WHERE is_closed = FALSE ORDER BY id LIMIT 1)
        ORDER BY "DateReceived" ASC, "InvoiceNumber" ASC
    ');
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'Total'));
    return ['rows' => $rows, 'total' => $total];
}

function getWeeklyStatement($pdo, $hotelName, $startDate, $endDate) {
    $stmt = $pdo->prepare('
        SELECT "HotelNumber", SUM("Total") AS "UnitTotal"
        FROM teremok_invoices
        WHERE period_id = (SELECT id FROM teremok_periods WHERE is_closed = FALSE ORDER BY id LIMIT 1) AND "HotelName" = :hotel
          AND "DateReceived" BETWEEN :start AND :end
        GROUP BY "HotelNumber"
        ORDER BY "HotelNumber" ASC
    ');
    $stmt->execute([':hotel' => $hotelName, ':start' => $startDate, ':end' => $endDate]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'UnitTotal'));
    return ['rows' => $rows, 'total' => $total];
}

function getWeeklyAllStatement($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare('
        SELECT "HotelName", SUM("Total") AS "HotelTotal"
        FROM teremok_invoices
        WHERE "DateReceived" BETWEEN :start AND :end
        GROUP BY "HotelName"
        ORDER BY "HotelName" ASC
    ');
    $stmt->execute([':start' => $startDate, ':end' => $endDate]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'HotelTotal'));
    return ['rows' => $rows, 'total' => $total];
}
