async function encryptApiToken(apiToken) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiToken);

  // Generate a random key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  // Export the key
  const exportedKey = await crypto.subtle.exportKey("raw", key);

  // Combine IV, encrypted data, and exported key
  const combined = new Uint8Array(
    iv.length + encryptedData.byteLength + exportedKey.byteLength
  );
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  combined.set(
    new Uint8Array(exportedKey),
    iv.length + encryptedData.byteLength
  );

  // Convert to Base64 for easy storage and transmission
  return btoa(String.fromCharCode.apply(null, combined));
}
