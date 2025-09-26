#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * 从 GitHub URL 提取仓库名称
 * @param {string} url - GitHub 仓库 URL
 * @returns {string} 仓库名称
 */
function getRepoNameFromUrl(url) {
  // 处理不同格式的 GitHub URL
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /github\.com\/([^\/]+)\/([^\/]+?)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }

  throw new Error("无效的 GitHub URL 格式");
}

/**
 * 标准化 GitHub URL，移除多余的路径部分
 * @param {string} url - 原始 GitHub URL
 * @returns {string} 标准化的 GitHub URL
 */
function normalizeGitHubUrl(url) {
  // 移除末尾的斜杠
  url = url.replace(/\/$/, "");

  // 处理包含 /tree/, /blob/, /commit/ 等路径的 URL
  const match = url.match(/^(https?:\/\/github\.com\/[^\/]+\/[^\/]+)/);
  if (match) {
    return match[1];
  }

  return url;
}

/**
 * 克隆 GitHub 仓库
 * @param {string} url - GitHub 仓库 URL
 * @param {string} targetDir - 目标目录
 */
function cloneRepository(url, targetDir) {
  console.log(`正在克隆仓库: ${url}`);
  try {
    // 如果目标目录已存在，先删除
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    execSync(`git clone ${url} ${targetDir}`, { stdio: "inherit" });
    console.log(`仓库克隆完成: ${targetDir}`);
  } catch (error) {
    throw new Error(`克隆仓库失败: ${error.message}`);
  }
}

/**
 * 递归查找所有 Markdown 文件
 * @param {string} dir - 搜索目录
 * @param {string[]} markdownFiles - 存储找到的 Markdown 文件路径
 */
function findMarkdownFiles(dir, markdownFiles = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过 .git 目录和 node_modules 目录
      if (file !== ".git" && file !== "node_modules") {
        findMarkdownFiles(filePath, markdownFiles);
      }
    } else if (stat.isFile()) {
      // 检查是否为 Markdown 文件
      const ext = path.extname(file).toLowerCase();
      if (ext === ".md" || ext === ".markdown") {
        markdownFiles.push(filePath);
      }
    }
  }

  return markdownFiles;
}

/**
 * 复制 Markdown 文件到新目录
 * @param {string[]} markdownFiles - Markdown 文件路径数组
 * @param {string} outputDir - 输出目录
 */
function copyMarkdownFiles(markdownFiles, outputDir) {
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileNameMap = new Map(); // 用于处理重名文件

  markdownFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    let outputFileName = fileName;

    // 处理重名文件
    if (fileNameMap.has(fileName)) {
      const count = fileNameMap.get(fileName) + 1;
      fileNameMap.set(fileName, count);
      const nameWithoutExt = path.parse(fileName).name;
      const ext = path.parse(fileName).ext;
      outputFileName = `${nameWithoutExt}_${count}${ext}`;
    } else {
      fileNameMap.set(fileName, 0);
    }

    const outputPath = path.join(outputDir, outputFileName);

    try {
      fs.copyFileSync(filePath, outputPath);
      console.log(`复制文件: ${fileName} -> ${outputFileName}`);
    } catch (error) {
      console.error(`复制文件失败 ${filePath}: ${error.message}`);
    }
  });
}

/**
 * 清理临时目录
 * @param {string} tempDir - 临时目录路径
 */
function cleanupTempDir(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`清理临时目录: ${tempDir}`);
    }
  } catch (error) {
    console.error(`清理临时目录失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("使用方法: node extract-markdown.js <github-url>");
    console.error(
      "示例: node extract-markdown.js https://github.com/microsoft/markitdown"
    );
    process.exit(1);
  }

  const githubUrl = args[0];

  try {
    // 标准化 GitHub URL
    const normalizedUrl = normalizeGitHubUrl(githubUrl);

    // 获取仓库名称
    const repoName = getRepoNameFromUrl(normalizedUrl);
    const tempDir = `temp_${repoName}`;
    const outputDir = `${repoName}_markdown_files`;

    console.log(`开始处理仓库: ${githubUrl}`);
    console.log(`标准化后的URL: ${normalizedUrl}`);
    console.log(`输出目录: ${outputDir}`);

    // 步骤1: 克隆仓库
    cloneRepository(normalizedUrl, tempDir);

    // 步骤2: 查找所有 Markdown 文件
    console.log("正在查找 Markdown 文件...");
    const markdownFiles = findMarkdownFiles(tempDir);
    console.log(`找到 ${markdownFiles.length} 个 Markdown 文件`);

    if (markdownFiles.length === 0) {
      console.log("该仓库中没有找到 Markdown 文件");
    } else {
      // 步骤3: 复制 Markdown 文件到输出目录
      console.log("正在复制 Markdown 文件...");
      copyMarkdownFiles(markdownFiles, outputDir);

      console.log(
        `\n✅ 完成！所有 Markdown 文件已保存到: ${path.resolve(outputDir)}`
      );
      console.log(`总共处理了 ${markdownFiles.length} 个文件`);
    }

    // 步骤4: 清理临时目录
    cleanupTempDir(tempDir);
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  getRepoNameFromUrl,
  normalizeGitHubUrl,
  findMarkdownFiles,
  copyMarkdownFiles,
};
