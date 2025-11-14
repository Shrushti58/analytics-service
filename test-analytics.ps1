# test-analytics.ps1
# Comprehensive test script for Analytics Service (ASCII-safe version)

Write-Host "=================================================="
Write-Host "ANALYTICS SERVICE - FULL TEST SUITE"
Write-Host "=================================================="
Write-Host "Starting test at: $(Get-Date)"
Write-Host ""

# Configuration
$BaseUrl = "http://localhost:3000"
$TestSiteId = "test-site-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Function: API Request Wrapper
function Invoke-AnalyticsAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Description = ""
    )
    
    $uri = "$BaseUrl$Endpoint"
    
    try {
        $startTime = Get-Date

        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Body $jsonBody `
                -Headers @{"Content-Type" = "application/json"} -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -ErrorAction Stop
        }
        
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        return @{
            Success = $true
            Data = $response
            ResponseTime = $responseTime
            Description = $Description
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Description = $Description
        }
    }
}

# Function: Display Test Results
function Write-TestResult {
    param(
        $Result,
        $SuccessMessage,
        $FailMessage
    )
    
    if ($Result.Success) {
        Write-Host "   PASS: $SuccessMessage"
        if ($Result.ResponseTime) {
            Write-Host "      Response Time: $([math]::Round($Result.ResponseTime, 2)) ms"
        }
        return $true
    }
    else {
        Write-Host "   FAIL: $FailMessage"
        Write-Host "      Error: $($Result.Error)"
        return $false
    }
}

# ------------------------------------------------------------
# TEST 1: BASIC HEALTH CHECK
# ------------------------------------------------------------
Write-Host "1. BASIC HEALTH CHECK"
$health = Invoke-AnalyticsAPI -Endpoint "/health" -Description "Health Check"
Write-TestResult -Result $health -SuccessMessage "Service is healthy" -FailMessage "Health check failed"

if ($health.Success) {
    Write-Host "      Redis: $($health.Data.databases.redis)"
    Write-Host "      MongoDB: $($health.Data.databases.mongodb)"
    Write-Host "      Queue Length: $($health.Data.queue.length)"
}

# ------------------------------------------------------------
# TEST 2: QUEUE STATISTICS
# ------------------------------------------------------------
Write-Host "`n2. QUEUE STATISTICS"
$queueStats = Invoke-AnalyticsAPI -Endpoint "/queue-stats" -Description "Queue Stats"
Write-TestResult -Result $queueStats -SuccessMessage "Queue stats retrieved" -FailMessage "Queue stats failed"

# ------------------------------------------------------------
# TEST 3: VALID EVENTS
# ------------------------------------------------------------
Write-Host "`n3. EVENT INGESTION (VALID EVENTS)"

$evt1 = @{
    site_id = $TestSiteId
    event_type = "page_view"
    path = "/home"
    user_id = "user-001"
    timestamp = "2025-11-12T10:00:00Z"
}
$result1 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $evt1
Write-TestResult -Result $result1 -SuccessMessage "Event with timestamp queued" -FailMessage "Failed to queue event"

$evt2 = @{
    site_id = $TestSiteId
    event_type = "page_view"
    path = "/about"
    user_id = "user-002"
}
$result2 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $evt2
Write-TestResult -Result $result2 -SuccessMessage "Event queued" -FailMessage "Failed to queue event"

$evt3 = @{
    site_id = $TestSiteId
    event_type = "click"
    path = "/button-submit"
    user_id = "user-003"
}
$result3 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $evt3
Write-TestResult -Result $result3 -SuccessMessage "Click event queued" -FailMessage "Failed to queue event"

# ------------------------------------------------------------
# TEST 4: INVALID EVENTS
# ------------------------------------------------------------
Write-Host "`n4. INVALID EVENTS"

$invalid1 = @{ event_type="page_view"; path="/home"; user_id="user-001" }
$r4 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $invalid1
if (-not $r4.Success) { Write-Host "   PASS: Missing site_id rejected" } else { Write-Host "   FAIL: Should reject missing site_id" }

$invalid2 = @{ site_id=$TestSiteId; event_type="invalid"; path="/home"; user_id="user-001" }
$r5 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $invalid2
if (-not $r5.Success) { Write-Host "   PASS: Invalid type rejected" } else { Write-Host "   FAIL: Should reject invalid type" }

$invalid3 = @{ site_id=$TestSiteId; event_type="page_view"; path="/home"; user_id="user-001"; timestamp="invalid" }
$r6 = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $invalid3
if (-not $r6.Success) { Write-Host "   PASS: Invalid timestamp rejected" } else { Write-Host "   FAIL: Should reject invalid timestamp" }

# ------------------------------------------------------------
# TEST 5: BULK EVENTS
# ------------------------------------------------------------
Write-Host "`n5. BULK EVENT INGESTION"
$successCount = 0
$failCount = 0

1..15 | ForEach-Object {
    $bulk = @{
        site_id = $TestSiteId
        event_type = "page_view"
        path = "/page-$($_ % 5)"
        user_id = "user-$($_ % 8)"
        timestamp = "2025-11-12T10:00:00Z"
    }

    $res = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $bulk

    if ($res.Success) {
        $successCount++
        Write-Host "." -NoNewline
    }
    else {
        $failCount++
        Write-Host "X" -NoNewline
    }

    Start-Sleep -Milliseconds 50
}

Write-Host ""
Write-Host "Bulk Results: $successCount succeeded, $failCount failed"

# ------------------------------------------------------------
# TEST 6: WAIT FOR BACKGROUND PROCESSING
# ------------------------------------------------------------
Write-Host "`n6. WAITING FOR PROCESSING (10 seconds)"
for ($i=10; $i -gt 0; $i--) {
    Write-Host "   $i..."
    Start-Sleep -Seconds 1
}

# ------------------------------------------------------------
# TEST 7: BASIC STATS
# ------------------------------------------------------------
Write-Host "`n7. FETCHING ANALYTICS"

$stats1 = Invoke-AnalyticsAPI -Endpoint "/stats?site_id=$TestSiteId&date=2025-11-12"
Write-TestResult -Result $stats1 -SuccessMessage "Stats loaded" -FailMessage "Stats failed"

if ($stats1.Success) {
    Write-Host "   Total Views: $($stats1.Data.total_views)"
    Write-Host "   Unique Users: $($stats1.Data.unique_users)"
}

$stats2 = Invoke-AnalyticsAPI -Endpoint "/stats?site_id=$TestSiteId"
Write-TestResult -Result $stats2 -SuccessMessage "Stats loaded (no date)" -FailMessage "Stats failed"

# ------------------------------------------------------------
# TEST 8: TOP PATHS
# ------------------------------------------------------------
Write-Host "`n8. TOP PATHS"
if ($stats1.Success -and $stats1.Data.top_paths) {
    foreach ($p in $stats1.Data.top_paths) {
        Write-Host "   $($p.path): $($p.views) views"
    }
}
else {
    Write-Host "   No top path data"
}

# ------------------------------------------------------------
# TEST 9: PERFORMANCE
# ------------------------------------------------------------
Write-Host "`n9. PERFORMANCE TEST"

$responseTimes = @()

1..3 | ForEach-Object {
    $perf = @{
        site_id = "perf-$TestSiteId"
        event_type = "page_view"
        path = "/perf"
        user_id = "user-perf"
    }

    $result = Invoke-AnalyticsAPI -Endpoint "/event" -Method "POST" -Body $perf
    if ($result.Success -and $result.ResponseTime) {
        $responseTimes += $result.ResponseTime
    }
}

if ($responseTimes.Count -gt 0) {
    $avg = ($responseTimes | Measure-Object -Average).Average
    $min = ($responseTimes | Measure-Object -Minimum).Minimum
    $max = ($responseTimes | Measure-Object -Maximum).Maximum

    Write-Host "   Avg: $([math]::Round($avg,2)) ms"
    Write-Host "   Min: $([math]::Round($min,2)) ms"
    Write-Host "   Max: $([math]::Round($max,2)) ms"
}

# ------------------------------------------------------------
# FINAL CHECKS
# ------------------------------------------------------------
Write-Host "`n10. FINAL SYSTEM CHECK"

$finalQueue = Invoke-AnalyticsAPI -Endpoint "/queue-stats"
if ($finalQueue.Success) {
    Write-Host "   Final Queue Length: $($finalQueue.Data.queue.length)"
    Write-Host "   Total Processed: $($finalQueue.Data.processing.total_processed)"
}

$finalHealth = Invoke-AnalyticsAPI -Endpoint "/health"
if ($finalHealth.Success) {
    Write-Host "   Final Health Status: $($finalHealth.Data.status)"
}

Write-Host ""
Write-Host "=================================================="
Write-Host "TEST SUMMARY"
Write-Host "=================================================="
Write-Host "Test Site ID: $TestSiteId"
Write-Host "Successful Events: $successCount"
Write-Host "Failed Events: $failCount"
Write-Host ""
Write-Host "Testing complete."

