@echo off
setlocal enabledelayedexpansion

echo === Verifying legacy KYC routes ===
echo Searching for "/kyc/upload" in source files...

REM Search all .tsx and .ts files for legacy route
for /R %%f in (*.ts*) do (
    findstr /C:"/kyc/upload" "%%f" >nul
    if !errorlevel! equ 0 (
        echo Found in: %%f
    )
)

echo.
echo Searching for other KYC routes...
for /R %%f in (*.ts*) do (
    findstr /C:"/kyc/" "%%f" >nul
    if !errorlevel! equ 0 (
        echo Mentioned in: %%f
    )
)

echo.
echo === Done ===
echo You can now manually inspect any files listed above.
echo If no results appear, it's safe to delete unused routes like upload.tsx.
pause