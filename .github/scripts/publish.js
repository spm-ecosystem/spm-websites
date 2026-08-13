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

        // Try reading content.css sibling file
        let cssContent = "";
        const cssFile = file.replace('manifest.json', 'content.css');
        if (fs.existsSync(cssFile)) {
            cssContent = fs.readFileSync(cssFile, 'utf8');
        }

        const domain = manifest.targetUrl.replace("*://", "").replace("/*", "");
        const themeName = manifest.theme.label.toLowerCase().replace(/\s+/g, '-');

        // Resolve version from Edge registry
        console.log(`🔍 Resolving latest version from edge for ${domain}/${themeName}...`);
        let resolvedVersion = "1.0.0";
        try {
            const listResponse = await fetch(`https://spm.hexacloud.net.br/spm/v1/api/themes/${domain}`);
            if (listResponse.ok) {
                const listData = await listResponse.json();
                const prefix = `themes/${domain}/${themeName}/`;
                const versions = new Set();
                for (const item of listData.themes || []) {
                    if (item.key.startsWith(prefix)) {
                        const parts = item.key.substring(prefix.length).split("/");
                        if (parts[0] && /^\d+\.\d+\.\d+$/.test(parts[0])) {
                            versions.add(parts[0]);
                        }
                    }
                }
                if (versions.size > 0) {
                    const sorted = Array.from(versions).sort((a, b) => {
                        const pa = a.split(".").map(Number);
                        const pb = b.split(".").map(Number);
                        for (let i = 0; i < 3; i++) {
                            if (pa[i] !== pb[i]) return pa[i] - pb[i];
                        }
                        return 0;
                    });
                    const latest = sorted[sorted.length - 1];
                    const parts = latest.split(".").map(Number);
                    parts[2] += 1;
                    resolvedVersion = parts.join(".");
                }
            }
        } catch (err) {
            console.warn(`⚠️ Warning: Failed to query edge registry, defaulting version to 1.0.0:`, err.message);
        }

        console.log(`🏷️ Next version resolved: ${resolvedVersion}`);
        manifest.version = resolvedVersion;

        const requestBody = JSON.stringify({
            manifest,
            css: cssContent
        });

        // 1. Generate the HMAC SHA-256 (The integrity seal)
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(requestBody);
        const signature = hmac.digest('hex');

        const url = `https://spm.hexacloud.net.br/spm/v1/api/publish/${domain}/${themeName}/${resolvedVersion}`;

        console.log(`🚀 Sending to Cloudflare Edge...`);

        // 3. Fire the request to the Cloudflare Worker
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-SPM-Integrity': signature
            },
            body: requestBody
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