$base = "http://localhost:3000/api"
$json = "application/json"
$pass = "ganti-ini-123"

function Login($email) {
  $b = @{ email = $email; password = $pass } | ConvertTo-Json
  (Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType $json -Body $b).data.token
}
$ownerH   = @{ Authorization = "Bearer $(Login 'owner@demo.com')" }
$managerH = @{ Authorization = "Bearer $(Login 'manager@demo.com')" }

function Post($path, $obj, $h) {
  Invoke-RestMethod -Method Post -Uri "$base$path" -Headers $h -ContentType $json -Body ($obj | ConvertTo-Json -Depth 5)
}
function Try-Post($path, $obj, $h) {
  try { Post $path $obj $h | Out-Null; "tidak error (tidak diharapkan)" }
  catch { $_.Exception.Response.StatusCode.value__ }
}
function Try-Get($path, $h) {
  try { Invoke-RestMethod -Uri "$base$path" -Headers $h | Out-Null; "tidak error (tidak diharapkan)" }
  catch { $_.Exception.Response.StatusCode.value__ }
}
function Stock($productId) {
  (Invoke-RestMethod -Uri "$base/products/$productId" -Headers $ownerH).data.product.stock
}
