$ErrorActionPreference = "Stop"
$rootPath = Resolve-Path "$PSScriptRoot/../.."
$allowed = @("MdToHtml", "start.bat", "README.md", ".cursorrules", "input", "output")
$items = Get-ChildItem -Path $rootPath -Force
$unexpected = $items | Where-Object { $allowed -notcontains $_.Name }
if ($unexpected -and $unexpected.Count -gt 0) {
    Write-Error "Unexpected items in root directory ($rootPath): $($unexpected.Name -join ', ')"
    exit 1
}
Write-Host "Root directory validation passed: Only contains allowed items."
exit 0
