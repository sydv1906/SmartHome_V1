$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$wifiInterface = 'Wi-Fi'
$firmwareSecretsPaths = @(
  (Join-Path $repoRoot 'firmware\secrets.h'),
  (Join-Path $repoRoot 'firmware\esp32_smart_meter\secrets.h')
)
$firewallRuleName = 'SmartHome MQTT from hotspot only'
$mosquittoServiceName = 'mosquitto'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdministrator) {
  $scriptPath = $MyInvocation.MyCommand.Path
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
    '-NoExit',
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    "`"$scriptPath`""
  )
  exit
}

foreach ($path in $firmwareSecretsPaths) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing local firmware settings file: $path"
  }
}

$nestedSecrets = Get-Content -LiteralPath $firmwareSecretsPaths[1] -Raw
$ssidMatch = [regex]::Match($nestedSecrets, '(?m)^\s*const char\*\s+WIFI_SSID\s*=\s*"([^"]*)"\s*;')
if (-not $ssidMatch.Success -or [string]::IsNullOrWhiteSpace($ssidMatch.Groups[1].Value)) {
  throw 'Could not read WIFI_SSID from the local firmware settings file.'
}
$expectedSsid = $ssidMatch.Groups[1].Value
$brokerMatch = [regex]::Match($nestedSecrets, '(?m)^\s*const char\*\s+MQTT_BROKER\s*=\s*"([^"]*)"\s*;')
if (-not $brokerMatch.Success) {
  throw 'Could not read MQTT_BROKER from the local firmware settings file.'
}
$previousBrokerIp = $brokerMatch.Groups[1].Value

$network = Get-NetConnectionProfile -InterfaceAlias $wifiInterface -ErrorAction Stop |
  Select-Object -First 1
if (-not $network.Name.StartsWith($expectedSsid, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Connect this laptop to the ESP32 hotspot ($expectedSsid) before starting the demo. Current Wi-Fi: $($network.Name)"
}

$wifiAddress = Get-NetIPAddress -InterfaceAlias $wifiInterface -AddressFamily IPv4 -ErrorAction Stop |
  Where-Object { $_.IPAddress -notlike '169.254.*' } |
  Select-Object -First 1
if (-not $wifiAddress) {
  throw "No usable IPv4 address found on $wifiInterface."
}

$prefixLength = $wifiAddress.PrefixLength
$addressBytes = [Net.IPAddress]::Parse($wifiAddress.IPAddress).GetAddressBytes()
$networkBytes = New-Object byte[] 4
for ($index = 0; $index -lt 4; $index++) {
  $bitsRemaining = $prefixLength - ($index * 8)
  if ($bitsRemaining -ge 8) {
    $maskByte = 255
  } elseif ($bitsRemaining -le 0) {
    $maskByte = 0
  } else {
    $maskByte = (255 -shl (8 - $bitsRemaining)) -band 255
  }
  $networkBytes[$index] = $addressBytes[$index] -band $maskByte
}
$hotspotSubnet = "$([Net.IPAddress]::new($networkBytes).IPAddressToString)/$prefixLength"

$mqttRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction Stop
$addressFilter = $mqttRule | Get-NetFirewallAddressFilter -ErrorAction Stop
Set-NetFirewallAddressFilter -InputObject $addressFilter `
  -LocalAddress $wifiAddress.IPAddress `
  -RemoteAddress $hotspotSubnet

foreach ($path in $firmwareSecretsPaths) {
  $contents = Get-Content -LiteralPath $path -Raw
  $brokerLinePattern = '(?m)^(\s*const char\*\s+MQTT_BROKER\s*=\s*")[^"]*(";\s*)$'
  if (-not [regex]::IsMatch($contents, $brokerLinePattern)) {
    throw "Could not update MQTT_BROKER in local settings file: $path"
  }
  $contents = [regex]::Replace(
    $contents,
    $brokerLinePattern,
    [System.Text.RegularExpressions.MatchEvaluator]{
      param($match)
      $match.Groups[1].Value + $wifiAddress.IPAddress + $match.Groups[2].Value
    }
  )
  Set-Content -LiteralPath $path -Value $contents -Encoding ASCII
}

$backendEnvPath = Join-Path $repoRoot 'backend\.env'
if (-not (Test-Path -LiteralPath $backendEnvPath)) {
  throw 'backend/.env is missing. Restore your local Atlas and MQTT settings before starting the demo.'
}

$backendEnv = Get-Content -LiteralPath $backendEnvPath -Raw
foreach ($key in @('MONGO_URI', 'MQTT_USERNAME', 'MQTT_PASSWORD')) {
  if (-not [regex]::IsMatch($backendEnv, "(?m)^\s*$key\s*=\s*.+$")) {
    throw "Required setting $key is missing from backend/.env."
  }
}

$nodeCheck = @'
require('./backend/node_modules/dotenv').config({ path: 'backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Atlas connection: OK');
  } catch {
    console.error('Atlas connection failed. Check that this hotspot public IP is active in the Atlas IP access list.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
'@
& node -e $nodeCheck
if ($LASTEXITCODE -ne 0) {
  throw 'Atlas is not reachable; the app was not started.'
}

$service = Get-Service -Name $mosquittoServiceName -ErrorAction Stop
if ($service.Status -ne 'Running') {
  Start-Service -Name $mosquittoServiceName
  (Get-Service -Name $mosquittoServiceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(15))
}

$mqttCheck = @'
require('./backend/node_modules/dotenv').config({ path: 'backend/.env' });
const mqtt = require('./backend/node_modules/mqtt');
const client = mqtt.connect('mqtt://127.0.0.1:1883', {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  connectTimeout: 5000,
  reconnectPeriod: 0
});
const finish = (code, message) => {
  console.log(message);
  client.end(true);
  process.exit(code);
};
client.once('connect', () => finish(0, 'Authenticated MQTT connection: OK'));
client.once('error', () => finish(1, 'Authenticated MQTT connection failed. Check the local broker service.'));
setTimeout(() => finish(1, 'Authenticated MQTT connection timed out.'), 7000);
'@
& node -e $mqttCheck
if ($LASTEXITCODE -ne 0) {
  throw 'MQTT is not ready; the app was not started.'
}

foreach ($port in @(3000, 5000)) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if ($listener) {
    throw "Port $port is already in use. Close the old project server window, then rerun this script."
  }
}

$backendCommand = "Set-Location -LiteralPath '$repoRoot'; npm --prefix backend run dev"
$frontendCommand = "Set-Location -LiteralPath '$repoRoot'; npm --prefix frontend run dev"
Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand
)
Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand
)

Write-Host ''
Write-Host 'SmartHome demo startup initiated.'
Write-Host "Hotspot Wi-Fi: $($network.Name)"
Write-Host "MQTT broker IP updated in local firmware settings: $($wifiAddress.IPAddress)"
Write-Host "Hotspot firewall scope: $hotspotSubnet"
if ($previousBrokerIp -ne $wifiAddress.IPAddress) {
  Write-Warning 'The ESP32 may still have the previous broker IP in its firmware. Upload the sketch before expecting it to connect.'
} else {
  Write-Host 'The firmware broker IP already matched this laptop.'
}
Write-Host 'Wait for the backend window to confirm MongoDB and MQTT connections.'
Write-Host 'Then open http://localhost:3000 and confirm the live readings.'
Write-Host 'Upload the firmware if you changed the Wi-Fi password or the warning above says the broker IP changed.'
