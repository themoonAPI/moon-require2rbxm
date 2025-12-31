document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bg-music');
  audio.volume = 0.15;
  audio.play().catch(() => {});

  const assetInput = document.getElementById('assetId');
  const convertBtn = document.getElementById('convertBtn');
  const status = document.getElementById('status');

  convertBtn.addEventListener('click', async () => {
    let assetId = assetInput.value.trim();
    if (!assetId || isNaN(assetId)) {
      status.textContent = "Invalid Asset ID";
      return;
    }

    status.textContent = "Fetching asset...";

    try {
      // Use v1 endpoint (old method that sometimes bypasses protection)
      let url = `https://assetdelivery.roblox.com/v1/asset?id=${assetId}`;
      let res = await fetch(url);
      if (!res.ok) {
        // Fallback v2
        url = `https://assetdelivery.roblox.com/v2/asset/?id=${assetId}`;
        res = await fetch(url);
        if (!res.ok) throw new Error("Not found");
      }

      let rbxmText = await res.text();

      // Parse XML to confirm it's a model with MainModule
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rbxmText, "text/xml");

      const mainModule = xmlDoc.querySelector("Item[referent='RBXMainModule'] External null");
      if (!mainModule) {
        status.textContent = "No MainModule found — not a server-side require";
        return;
      }

      // Build clean .rbxm blob
      const blob = new Blob([rbxmText], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${assetId}_leaked.rbxm`;
      a.click();

      URL.revokeObjectURL(downloadUrl);

      status.textContent = `Success — ${assetId}_leaked.rbxm downloaded. Open in Studio.`;
    } catch (err) {
      status.textContent = "Failed (patched/protected asset or invalid ID)";
    }
  });
});
