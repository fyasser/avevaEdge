@echo off
echo Starting AvevaEdge Dashboard...
echo.
echo Step 1: Starting backend server...
start cmd /k "cd %~dp0backend && node server.js"
echo.
echo Step 2: Waiting for backend to initialize...
timeout /t 5 /nobreak > nul
echo.
echo Step 3: Starting frontend application...
start cmd /k "cd %~dp0frontend && npm start"
echo.
echo The AvevaEdge Dashboard will open in your browser shortly.
echo Please do not close this window while using the application.
echo.
echo Press any key to exit this startup helper.
pause > nul
