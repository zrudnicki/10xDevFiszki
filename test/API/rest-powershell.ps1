# PowerShell script to authenticate and make API call

# 1. First obtain the token
$authResponse = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54321/auth/v1/token?grant_type=password" `
  -Headers @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    "Content-Type" = "application/json"
  } `
  -Body '{ "email": "test1@test.pl", "password": "testtest"}'

# 2. Extract the access token
$accessToken = $authResponse.access_token

# 3. Print the token for verification (optional)
Write-Host "Using access token: $accessToken"

# 4. Make the API call with the extracted token
$requestBody = @{
    text = "Ten tekst musi mieć co najmniej 1000 znaków. Tutaj powinien być dłuższy tekst, który będzie służył jako podstawa do generowania fiszek. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3002/api/ai/generate-flashcards" `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $accessToken"
  } `
  -Body $requestBody

# 5. Output the response
$response | ConvertTo-Json -Depth 10 