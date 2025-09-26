# GitHub Markdown 文件提取器

一个用于从 GitHub 仓库中提取所有 Markdown 文件的 Node.js 脚本。

## 功能特性

- 🔗 支持多种 GitHub URL 格式
- 📁 递归查找所有 Markdown 文件（`.md` 和 `.markdown`）
- 📋 将所有文件平铺保存到一个目录中
- 🔄 自动处理重名文件（添加序号）
- 🧹 自动清理临时文件
- ⚡ 跳过不必要的目录（`.git`, `node_modules`）

## 安装

### 前提条件

- Node.js 14.0.0 或更高版本
- 安装了 Git

### 下载项目

```bash
git clone <this-repo-url>
cd getmarkdown
```

## 使用方法

### 基本用法

```bash
node extract-markdown.js <github-url>
```

### 示例

```bash
# 基本 GitHub 仓库链接
node extract-markdown.js https://github.com/microsoft/markitdown

# 包含路径的链接也支持
node extract-markdown.js https://github.com/microsoft/markitdown/tree/main
node extract-markdown.js https://github.com/microsoft/markitdown/blob/main/README.md
```

### 支持的 URL 格式

脚本会自动标准化以下 URL 格式：

- `https://github.com/user/repo`
- `https://github.com/user/repo.git`
- `https://github.com/user/repo/tree/branch`
- `https://github.com/user/repo/blob/branch/file.md`
- `https://github.com/user/repo/commit/hash`

## 工作流程

1. **克隆仓库** - 将 GitHub 仓库克隆到临时目录
2. **查找文件** - 递归搜索所有 Markdown 文件
3. **复制文件** - 将找到的文件平铺复制到输出目录
4. **清理临时文件** - 删除克隆的临时仓库

## 输出

脚本会创建一个名为 `<user>-<repo>_markdown_files` 的文件夹，包含所有提取的 Markdown 文件。

例如：

- 输入：`https://github.com/microsoft/markitdown`
- 输出文件夹：`microsoft-markitdown_markdown_files/`

### 重名文件处理

如果存在同名的 Markdown 文件（来自不同目录），脚本会自动重命名：

```
README.md          # 第一个文件
README_1.md        # 第二个同名文件
README_2.md        # 第三个同名文件
```

## 示例输出

```bash
$ node extract-markdown.js https://github.com/microsoft/markitdown

开始处理仓库: https://github.com/microsoft/markitdown
标准化后的URL: https://github.com/microsoft/markitdown
输出目录: microsoft-markitdown_markdown_files
正在克隆仓库: https://github.com/microsoft/markitdown
仓库克隆完成: temp_microsoft-markitdown
正在查找 Markdown 文件...
找到 8 个 Markdown 文件
正在复制 Markdown 文件...
复制文件: README.md -> README.md
复制文件: CODE_OF_CONDUCT.md -> CODE_OF_CONDUCT.md
复制文件: SECURITY.md -> SECURITY.md
复制文件: SUPPORT.md -> SUPPORT.md
...

✅ 完成！所有 Markdown 文件已保存到: /path/to/microsoft-markitdown_markdown_files
总共处理了 8 个文件
清理临时目录: temp_microsoft-markitdown
```

## 错误处理

脚本包含完善的错误处理：

- **无效 URL**：会提示 URL 格式错误
- **仓库不存在**：会显示克隆失败的错误信息
- **权限问题**：会显示相应的权限错误
- **网络问题**：会显示网络连接错误

## 注意事项

- 脚本需要网络连接来克隆仓库
- 大型仓库可能需要较长时间下载
- 确保有足够的磁盘空间（临时目录会在完成后自动清理）
- 私有仓库需要配置 Git 认证

## 技术细节

### 跳过的目录

为了提高效率，脚本会跳过以下目录：

- `.git` - Git 版本控制目录
- `node_modules` - Node.js 依赖目录

### 支持的文件扩展名

- `.md`
- `.markdown`

## 开发

### 项目结构

```
.
├── extract-markdown.js    # 主脚本文件
├── package.json          # 项目配置
└── README.md            # 说明文档
```

### 导出的函数

脚本也可以作为模块使用：

```javascript
const {
  getRepoNameFromUrl,
  normalizeGitHubUrl,
  findMarkdownFiles,
  copyMarkdownFiles,
} = require("./extract-markdown.js");
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
