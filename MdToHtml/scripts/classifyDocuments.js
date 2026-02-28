const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Input directory
const inputDir = path.join(__dirname, '..', 'input');

// Document type classification rules
const typeRules = {
  project: [
    '项目', '系统', '平台', '工具', '框架', '引擎', '架构', '设计', '开发', '实现', '构建', '部署'
  ],
  paper: [
    '论文', '研究', '综述', '实验', '方法', '算法', '模型', '理论', '分析', '评估', '性能', '对比'
  ],
  knowledge: [
    '知识', '分享', '教程', '指南', '总结', '梳理', '解析', '理解', '学习', '技巧', '最佳实践'
  ],
  other: []
};

// Function to classify document type based on content
function classifyDocument(content, filename) {
  const text = content.toLowerCase();
  
  // Check filename for clues
  const filenameLower = filename.toLowerCase();
  
  // Check project keywords
  if (typeRules.project.some(keyword => text.includes(keyword) || filenameLower.includes(keyword))) {
    return 'project';
  }
  
  // Check paper keywords
  if (typeRules.paper.some(keyword => text.includes(keyword) || filenameLower.includes(keyword))) {
    return 'paper';
  }
  
  // Check knowledge keywords
  if (typeRules.knowledge.some(keyword => text.includes(keyword) || filenameLower.includes(keyword))) {
    return 'knowledge';
  }
  
  // Default to project if no clear classification
  return 'project';
}

// Function to safely parse frontmatter and handle duplicates
function safeParseFrontmatter(content) {
  try {
    return matter(content);
  } catch (error) {
    console.warn('Error parsing frontmatter, using empty data:', error.message);
    return { data: {}, content: content };
  }
}

// Process all markdown files in input directory
function processFiles() {
  console.log('Processing files in:', inputDir);
  
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error('Error reading input directory:', err);
      return;
    }
    
    const mdFiles = files.filter(file => file.endsWith('.md'));
    console.log('Found', mdFiles.length, 'markdown files');
    
    mdFiles.forEach(file => {
      const filePath = path.join(inputDir, file);
      
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          console.error('Error reading file', file, ':', err);
          return;
        }
        
        const type = classifyDocument(content, file);
        const { data, content: body } = safeParseFrontmatter(content);
        
        // Add type to frontmatter if not present
        if (!data.type) {
          data.type = type;
          
          // Reconstruct the file with updated frontmatter
          try {
            const updatedContent = matter.stringify(body, data);
            
            fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
              if (err) {
                console.error('Error writing file', file, ':', err);
              } else {
                console.log(`Updated ${file} with type: ${type}`);
              }
            });
          } catch (error) {
            console.error('Error stringifying frontmatter for', file, ':', error.message);
          }
        } else {
          console.log(`${file} already has type: ${data.type}`);
        }
      });
    });
  });
}

// Run the script
processFiles();
