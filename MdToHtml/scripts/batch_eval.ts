
import fs from 'fs';
import path from 'path';
import { RuleBasedScorer } from '../src/lib/scorer';
import { ScoreResponse, Issue } from '../src/types/model-interface';

// Configuration
const DATASET_DIR = path.join(__dirname, '../../dataset/golden_standard');
const REPORT_FILE = path.join(__dirname, '../../dataset/evaluation_report.csv');

// Ensure dataset directory exists
if (!fs.existsSync(DATASET_DIR)) {
  console.error(`Error: Dataset directory not found at ${DATASET_DIR}`);
  process.exit(1);
}

// CSV Header
const CSV_HEADER = 'Filename,TotalScore,Structure,Atomicity,Metadata,Syntax,Styling,IssuesCount,FirstIssueType,FirstIssueMessage\n';

async function main() {
  console.log('Starting batch evaluation...');
  console.log(`Input Directory: ${DATASET_DIR}`);
  
  const files = fs.readdirSync(DATASET_DIR).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    console.warn('No Markdown files found in dataset directory.');
    return;
  }

  let csvContent = CSV_HEADER;
  let totalFiles = 0;
  let perfectFiles = 0;
  let totalScoreSum = 0;

  for (const file of files) {
    const filePath = path.join(DATASET_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const result: ScoreResponse = RuleBasedScorer.evaluate(content);
      
      // Calculate stats
      totalFiles++;
      totalScoreSum += result.totalScore;
      if (result.totalScore === 100) perfectFiles++;

      // Format for CSV
      // Escape quotes in message
      const firstIssue = result.issues.length > 0 ? result.issues[0] : null;
      const firstIssueType = firstIssue ? firstIssue.type : '';
      const firstIssueMsg = firstIssue ? `"${firstIssue.message.replace(/"/g, '""')}"` : '';
      
      const row = [
        `"${file}"`,
        result.totalScore,
        result.dimensions.structure,
        result.dimensions.atomicity,
        result.dimensions.metadata,
        result.dimensions.syntax,
        result.dimensions.styling,
        result.issues.length,
        firstIssueType,
        firstIssueMsg
      ].join(',');

      csvContent += row + '\n';
      
      console.log(`[${result.totalScore}] ${file} - ${result.issues.length} issues`);

    } catch (e) {
      console.error(`Failed to process ${file}:`, e);
      csvContent += `"${file}",0,0,0,0,0,0,1,"CRITICAL_ERROR","${String(e).replace(/"/g, '""')}"\n`;
    }
  }

  // Write Report
  fs.writeFileSync(REPORT_FILE, csvContent, 'utf-8');
  
  console.log('\n--------------------------------------------------');
  console.log(`Evaluation Complete.`);
  console.log(`Total Files: ${totalFiles}`);
  console.log(`Perfect Files (100/100): ${perfectFiles}`);
  console.log(`Average Score: ${(totalScoreSum / totalFiles || 0).toFixed(1)}`);
  console.log(`Report saved to: ${REPORT_FILE}`);
  console.log('--------------------------------------------------');
}

main().catch(console.error);
