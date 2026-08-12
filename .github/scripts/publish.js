const fs = require('fs');
const crypto = require('crypto');

const secret = process.env.SPM_DEV_SECRET;
const authToken = process.env.API_AUTH_TOKEN;
const changedFiles = process.env.CHANGED_FILES.split(' ');

async function publish() {
    for (const file of changedFiles) {
        // Ignore files that are not manifests
        if (!file || !file.endsWith('manifest.json')) continue;

        console.log(`\n📦 Processing: ${file}`);
        const rawPayload = fs.readFileSync(file, 'utf8');
        
        let manifest;
        try {
            manifest = JSON.parse(rawPayload);
        } catch (e) {
            console.error(`❌ Error: Invalid JSON in ${file}`);
            process.exit(1); // Fails the pipeline if the JSON is broken
        }

        // 1. Generate the HMAC SHA-256 (The integrity seal)
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(rawPayload);
        const signature = hmac.digest('hex');

        // 2. Clean up and build the route variables
        const domain = manifest.targetUrl.replace("*://", "").replace("/*", "");
        const themeName = manifest.theme.label.toLowerCase().replace(/\s+/g, '-');
        const url = `https://spm.hexacloud.net.br/spm/v1/api/publish/${domain}/${themeName}`;

        console.log(`🚀 Sending to Cloudflare Edge...`);

        // 3. Fire the request to the Cloudflare Worker
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-SPM-Integrity': signature
            },
            body: rawPayload
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Failed to publish ${themeName}:`, err);
            process.exit(1); // Turns the Action red and alerts of the error
        }

        const result = await response.json();
        console.log(`✅ Success! Manifest saved to R2 at: ${result.path}`);
    }
}

publish().catch(err => {
    console.error("🔥 Critical pipeline failure:", err);
    process.exit(1);
});