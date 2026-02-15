const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { execSync } = require('child_process');

// Configuration
const INPUT_DIR = path.join(__dirname, '../../input');
const OUTPUT_DIR = path.join(__dirname, '../out');

function log(message, type = 'INFO') {
    console.log(`[${type}] ${message}`);
}

function runBuild() {
    log('Starting build process...', 'BUILD');
    try {
        execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        log('Build completed successfully.', 'BUILD');
    } catch (error) {
        log('Build failed.', 'ERROR');
        process.exit(1);
    }
}

function verifyStaticFiles() {
    log('Verifying static output...', 'TEST');
    
    if (!fs.existsSync(INPUT_DIR)) {
        log(`Input directory not found: ${INPUT_DIR}`, 'ERROR');
        process.exit(1);
    }

    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.md'));
    let errors = 0;

    files.forEach(file => {
        const slug = file.replace('.md', '');
        // Next.js export with trailingSlash: true creates folder/index.html
        const expectedPath = path.join(OUTPUT_DIR, slug, 'index.html');
        
        log(`Checking ${slug}...`, 'CHECK');

        if (!fs.existsSync(expectedPath)) {
            log(`Missing output file for ${slug}: ${expectedPath}`, 'FAIL');
            errors++;
            return;
        }

        const content = fs.readFileSync(expectedPath, 'utf8');
        const $ = cheerio.load(content);
        
        // Check if the content is rendered (looking for the renderer div or specific content)
        // Adjust selector based on your CHDRenderer output
        const hasContent = $('body').text().length > 0;
        
        // We can also check for specific error messages we want to avoid
        const hasError = $('body').text().includes('Application Error') || $('body').text().includes('Minified React error');

        if (!hasContent) {
            log(`Empty content for ${slug}`, 'FAIL');
            errors++;
        } else if (hasError) {
            log(`Runtime error detected in static output for ${slug}`, 'FAIL');
            errors++;
        } else {
            log(`Verified ${slug}`, 'PASS');
        }
    });

    // Also verify the encoded path behavior if applicable
    // Since we are checking file system, we expect the folder name to be the decoded slug (Windows/FS behavior)
    // If Next.js generated encoded folder names, we would need to check that.
    // Based on previous ls output, Next.js generates decoded folders for Chinese routes usually.
    
    if (errors > 0) {
        log(`Verification failed with ${errors} errors.`, 'ERROR');
        process.exit(1);
    } else {
        log('All static pages verified successfully.', 'SUCCESS');
    }
}

// Main execution
if (require.main === module) {
    // Optional: skip build if just verifying
    if (!process.argv.includes('--no-build')) {
        runBuild();
    }
    verifyStaticFiles();
}
