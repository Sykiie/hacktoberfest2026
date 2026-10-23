export async function configureTestCommunity(baseUrl, enabledModules) {
  const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "locomi" }),
  });
  if (!loginResponse.ok) throw new Error("Could not sign in as the test owner.");

  const ownerCookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
  const createResponse = await fetch(`${baseUrl}/api/admin/community`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({ venueType: "Cafe", venueName: "Test Venue", enabledModules }),
  });
  if (!createResponse.ok) throw new Error("Could not create the test venue community.");
  return ownerCookie;
}
