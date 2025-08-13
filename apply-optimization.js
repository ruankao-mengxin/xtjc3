// 批量应用优化脚本到所有HTML文件
const fs = require('fs');
const path = require('path');

// 要添加的优化脚本标签
const optimizationScript = `
    <!-- GitBook 通用优化脚本 -->
    <script src="gitbook-optimizer.js"></script>`;

// 获取所有HTML文件
function getAllHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...getAllHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// 检查文件是否已经包含优化脚本
function hasOptimizationScript(content) {
    return content.includes('gitbook-optimizer.js');
}

// 添加优化脚本到HTML文件
function addOptimizationToFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 如果已经包含优化脚本，跳过
        if (hasOptimizationScript(content)) {
            console.log(`跳过 ${filePath} - 已包含优化脚本`);
            return false;
        }
        
        // 在 </body> 标签前添加优化脚本
        const bodyCloseIndex = content.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
            const beforeBody = content.substring(0, bodyCloseIndex);
            const afterBody = content.substring(bodyCloseIndex);
            
            content = beforeBody + optimizationScript + '\n    ' + afterBody;
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 已优化: ${filePath}`);
            return true;
        } else {
            console.log(`⚠️  未找到 </body> 标签: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
        return false;
    }
}

// 主函数
function main() {
    const currentDir = process.cwd();
    console.log(`正在处理目录: ${currentDir}`);
    
    const htmlFiles = getAllHtmlFiles(currentDir);
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const file of htmlFiles) {
        const relativePath = path.relative(currentDir, file);
        
        if (addOptimizationToFile(file)) {
            processedCount++;
        } else {
            skippedCount++;
        }
    }
    
    console.log('\n处理完成:');
    console.log(`✅ 已处理: ${processedCount} 个文件`);
    console.log(`⏭️  已跳过: ${skippedCount} 个文件`);
    console.log(`📁 总计: ${htmlFiles.length} 个文件`);
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { addOptimizationToFile, getAllHtmlFiles };
