@echo off
echo ===================================================
echo     Stopping AeroSense Services (Port 8000 & 3000)
echo ===================================================
echo.

powershell -NoProfile -Command ^
  "$ports = @(8000, 3000);" ^
  "$pids = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "if ($pids) {" ^
  "    foreach ($pid in $pids) {" ^
  "        try {" ^
  "            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue;" ^
  "            Write-Host ('Stopped process PID: ' + $pid);" ^
  "        } catch {}" ^
  "    }" ^
  "} else {" ^
  "    Write-Host 'No running AeroSense services found on ports 8000 or 3000.';" ^
  "}"

echo.
echo ===================================================
echo   AeroSense services stopped successfully.
echo ===================================================
echo.
pause
