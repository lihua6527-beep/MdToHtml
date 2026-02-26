import fs from 'fs';
import path from 'path';

// Manual path resolution to avoid importing app modules in standalone script
// Assuming this script is run from project root or scripts folder
const APP_ROOT = process.cwd();
const DATA_DIR = path.join(APP_ROOT, 'data');

console.log(`Starting data migration in: ${DATA_DIR}`);

if (!fs.existsSync(DATA_DIR)) {
    console.error('Data directory not found!');
    process.exit(1);
}

function migrate() {
    const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });

    // 1. Move contents of 'training_dataset' to root
    const trainingDatasetDir = path.join(DATA_DIR, 'training_dataset');
    if (fs.existsSync(trainingDatasetDir)) {
        console.log('Found training_dataset folder, migrating contents...');
        const trainingEntries = fs.readdirSync(trainingDatasetDir, { withFileTypes: true });
        
        for (const entry of trainingEntries) {
            if (entry.isDirectory()) {
                const srcPath = path.join(trainingDatasetDir, entry.name);
                const destPath = path.join(DATA_DIR, entry.name);

                if (fs.existsSync(destPath)) {
                    console.log(`Conflict: ${entry.name} already exists in root. Merging logic...`);
                    // If root exists, we need to decide which one to keep.
                    // Prioritize the one in training_dataset as it's the "new" one we just created?
                    // OR prioritize the one in root if it has more history?
                    // Given I just created training_dataset, it likely only has 1 entry.
                    // The root one might have legacy history.
                    // Let's assume we want to keep the "newest" structure.
                    
                    // Simple merge: Copy files from src to dest, overwriting if newer?
                    // Actually, let's just move files from src to dest.
                    const srcFiles = fs.readdirSync(srcPath);
                    for (const file of srcFiles) {
                         const sFile = path.join(srcPath, file);
                         const dFile = path.join(destPath, file);
                         // Overwrite
                         fs.copyFileSync(sFile, dFile);
                    }
                    // Remove src dir
                    fs.rmSync(srcPath, { recursive: true, force: true });
                } else {
                    fs.renameSync(srcPath, destPath);
                }
            }
        }
        // Remove empty training_dataset
        fs.rmdirSync(trainingDatasetDir);
        console.log('Removed training_dataset folder.');
    }

    // 2. Clean up legacy files in all folders
    const allDirs = fs.readdirSync(DATA_DIR, { withFileTypes: true });
    
    for (const dir of allDirs) {
        if (!dir.isDirectory()) continue;
        
        const dirPath = path.join(DATA_DIR, dir.name);
        console.log(`Processing ${dir.name}...`);

        // 2.1 Rename input.md -> initial.md
        const inputMd = path.join(dirPath, 'input.md');
        const initialMd = path.join(dirPath, 'initial.md');
        
        if (fs.existsSync(inputMd)) {
            if (!fs.existsSync(initialMd)) {
                fs.renameSync(inputMd, initialMd);
                console.log('  Renamed input.md -> initial.md');
            } else {
                // If both exist, delete input.md?
                fs.unlinkSync(inputMd);
                console.log('  Deleted input.md (initial.md already exists)');
            }
        }

        // 2.2 Convert history.json -> history.jsonl
        const historyJson = path.join(dirPath, 'history.json');
        const historyJsonl = path.join(dirPath, 'history.jsonl');

        if (fs.existsSync(historyJson)) {
            try {
                const content = fs.readFileSync(historyJson, 'utf8');
                const data = JSON.parse(content);
                
                // Assuming data is an array of objects
                if (Array.isArray(data)) {
                    const lines = data.map(item => JSON.stringify(item)).join('\n');
                    
                    if (fs.existsSync(historyJsonl)) {
                        // Append or Prepend? 
                        // If jsonl exists, it probably has newer data.
                        // We should probably append old history? Or is history.json older?
                        // Usually migration moves old to new. 
                        // Let's append with newline
                        fs.appendFileSync(historyJsonl, '\n' + lines);
                    } else {
                        fs.writeFileSync(historyJsonl, lines);
                    }
                    console.log(`  Converted history.json -> history.jsonl (${data.length} entries)`);
                }
                
                fs.unlinkSync(historyJson);
                console.log('  Deleted history.json');
            } catch (e) {
                console.error(`  Failed to process history.json in ${dir.name}:`, e);
            }
        }

        // 2.3 Remove forbidden files
        const allowedFiles = ['initial.md', 'history.jsonl'];
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            if (!allowedFiles.includes(file)) {
                const filePath = path.join(dirPath, file);
                fs.unlinkSync(filePath);
                console.log(`  Deleted forbidden file: ${file}`);
            }
        }
    }
}

migrate();
console.log('Migration complete.');
