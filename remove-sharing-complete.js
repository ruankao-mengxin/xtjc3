// 完全移除所有HTML文件中的分享功能（包括脚本和CSS）
const fs = require('fs');
const path = require('path');

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

// 完全移除分享相关内容
function removeAllSharingContent(content) {
    let updatedContent = content;
    
    // 1. 移除分享配置
    const sharingConfigRegex = /"sharing":\s*\{[^}]*\}/g;
    updatedContent = updatedContent.replace(sharingConfigRegex, '"sharing":{}');
    
    // 2. 移除分享插件脚本
    const sharingScriptRegex = /<script[^>]*gitbook-plugin-sharing[^>]*><\/script>/g;
    updatedContent = updatedContent.replace(sharingScriptRegex, '');
    
    // 3. 移除分享插件CSS
    const sharingCssRegex = /<link[^>]*gitbook-plugin-sharing[^>]*>/g;
    updatedContent = updatedContent.replace(sharingCssRegex, '');
    
    // 4. 移除分享按钮HTML结构
    const sharingButtonsRegex = /<div[^>]*class="[^"]*sharing[^"]*"[^>]*>[\s\S]*?<\/div>/g;
    updatedContent = updatedContent.replace(sharingButtonsRegex, '');
    
    // 5. 移除分享相关的script标签（更精确的匹配）
    const scriptLines = updatedContent.split('\n');
    const filteredLines = scriptLines.filter(line => {
        return !line.includes('gitbook-plugin-sharing') && 
               !line.includes('sharing/buttons.js') &&
               !line.includes('sharing.js');
    });
    updatedContent = filteredLines.join('\n');
    
    // 6. 清理多余的空行
    updatedContent = updatedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return updatedContent;
}

// 处理单个文件
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否包含分享相关内容
        if (content.includes('sharing') || content.includes('gitbook-plugin-sharing')) {
            const originalContent = content;
            content = removeAllSharingContent(content);
            
            // 检查是否有变化
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ 已完全移除分享功能: ${path.basename(filePath)}`);
                return true;
            } else {
                console.log(`⚠️  未找到分享内容: ${path.basename(filePath)}`);
                return false;
            }
        } else {
            console.log(`⏭️  跳过 (无分享内容): ${path.basename(filePath)}`);
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
    console.log(`正在完全清理分享功能，处理目录: ${currentDir}`);
    
    const htmlFiles = getAllHtmlFiles(currentDir);
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const file of htmlFiles) {
        if (processFile(file)) {
            processedCount++;
        } else {
            skippedCount++;
        }
    }
    
    console.log('\n处理完成:');
    console.log(`✅ 已处理: ${processedCount} 个文件`);
    console.log(`⏭️  已跳过: ${skippedCount} 个文件`);
    console.log(`📁 总计: ${htmlFiles.length} 个文件`);
    
    if (processedCount > 0) {
        console.log('\n🎉 分享功能已完全从所有页面中移除！');
        console.log('移除内容包括:');
        console.log('  - 分享配置对象');
        console.log('  - 分享插件脚本');
        console.log('  - 分享插件CSS');
        console.log('  - 分享按钮HTML');
        console.log('现在页面将完全没有任何分享相关的内容。');
    }
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { processFile, getAllHtmlFiles };
