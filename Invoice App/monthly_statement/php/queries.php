<?php
// ============================================================
//  php/queries.php — All SQL queries
//  Edit individual functions to change what data is fetched
// ============================================================

function getUnitStatement($pdo, $hotelName) {
    $stmt = $pdo->prepare('
        SELECT "HotelNumber", SUM("Total") AS "UnitTotal"
        FROM invoices
        WHERE "HotelName" = :hotel
        GROUP BY "HotelNumber"
        ORDER BY CAST("HotelNumber" AS INTEGER) ASC
    ');
    $stmt->execute([':hotel' => $hotelName]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'UnitTotal'));
    return ['rows' => $rows, 'total' => $total];
}

function getMonthlyStatement($pdo) {
    $stmt = $pdo->query('
        SELECT "HotelName", SUM("Total") AS "HotelTotal"
        FROM invoices
        GROUP BY "HotelName"
        ORDER BY "HotelName" ASC
    ');
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'HotelTotal'));
    return ['rows' => $rows, 'total' => $total];
}

function getWeeklyStatement($pdo, $hotelName, $startDate, $endDate) {
    $stmt = $pdo->prepare('
        SELECT "HotelNumber", SUM("Total") AS "UnitTotal"
        FROM invoices
        WHERE "HotelName" = :hotel
          AND "DateReceived" BETWEEN :start AND :end
        GROUP BY "HotelNumber"
        ORDER BY CAST("HotelNumber" AS INTEGER) ASC
    ');
    $stmt->execute([':hotel' => $hotelName, ':start' => $startDate, ':end' => $endDate]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'UnitTotal'));
    return ['rows' => $rows, 'total' => $total];
}

function getWeeklyAllStatement($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare('
        SELECT "HotelName", SUM("Total") AS "HotelTotal"
        FROM invoices
        WHERE "DateReceived" BETWEEN :start AND :end
        GROUP BY "HotelName"
        ORDER BY "HotelName" ASC
    ');
    $stmt->execute([':start' => $startDate, ':end' => $endDate]);
    $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($rows, 'HotelTotal'));
    return ['rows' => $rows, 'total' => $total];
}
