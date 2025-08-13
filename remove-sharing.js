// 批量移除所有HTML文件中的分享功能
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

// 移除分享配置的函数
function removeSharingConfig(content) {
    // 匹配分享配置的正则表达式
    const sharingRegex = /"sharing":\s*\{[^}]*\}/g;
    
    // 替换分享配置为空对象
    let updatedContent = content.replace(sharingRegex, '"sharing":{}');
    
    // 如果还有更复杂的嵌套情况，使用更精确的匹配
    const complexSharingRegex = /"sharing":\s*\{(?:[^{}]|\{[^{}]*\})*\}/g;
    updatedContent = updatedContent.replace(complexSharingRegex, '"sharing":{}');
    
    return updatedContent;
}

// 处理单个文件
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否包含分享配置
        if (content.includes('"sharing":{') && content.includes('facebook')) {
            const originalContent = content;
            content = removeSharingConfig(content);
            
            // 检查是否有变化
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ 已移除分享功能: ${filePath}`);
                return true;
            } else {
                console.log(`⚠️  未找到分享配置: ${filePath}`);
                return false;
            }
        } else {
            console.log(`⏭️  跳过 (无分享配置): ${filePath}`);
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
        console.log('\n🎉 分享功能已从所有页面中移除！');
        console.log('现在用户将不会看到Facebook、Twitter等分享按钮。');
    }
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { processFile, getAllHtmlFiles };
