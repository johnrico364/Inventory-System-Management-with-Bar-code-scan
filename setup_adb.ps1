# ADB Setup Script for Windows
# Run this script as Administrator

Write-Host "ADB Setup Script" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green

# Check if ADB is already installed
try {
    $adbVersion = adb version 2>$null
    if ($adbVersion) {
        Write-Host "ADB is already installed!" -ForegroundColor Green
        Write-Host $adbVersion
        exit 0
    }
} catch {
    Write-Host "ADB not found, proceeding with setup..." -ForegroundColor Yellow
}

# Check if Android SDK is installed
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$platformToolsPath = "$sdkPath\platform-tools"

if (Test-Path $platformToolsPath) {
    Write-Host "Android SDK found at: $sdkPath" -ForegroundColor Green
    
    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$platformToolsPath*") {
        Write-Host "Adding platform-tools to system PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$platformToolsPath", "Machine")
        Write-Host "PATH updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Platform-tools already in PATH" -ForegroundColor Green
    }
} else {
    Write-Host "Android SDK not found. Please install Android Studio first." -ForegroundColor Red
    Write-Host "Download from: https://developer.android.com/studio" -ForegroundColor Yellow
    exit 1
}

# Test ADB installation
Write-Host "`nTesting ADB installation..." -ForegroundColor Yellow
try {
    $adbVersion = adb version
    Write-Host "ADB installed successfully!" -ForegroundColor Green
    Write-Host $adbVersion
} catch {
    Write-Host "ADB installation failed. Please restart your terminal and try again." -ForegroundColor Red
    exit 1
}

# Check for connected devices
Write-Host "`nChecking for connected devices..." -ForegroundColor Yellow
adb devices

Write-Host "`nSetup complete! You can now use ADB with your Flutter app." -ForegroundColor Green
Write-Host "To test with your Flutter app, run: cd 'D:\Inventory System\mobile' && flutter run" -ForegroundColor Cyan 