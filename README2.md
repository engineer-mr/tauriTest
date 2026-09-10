# Tauri 项目迁移指南

将已有的 Tauri 配置迁移到另一个 React 项目的完整步骤。

---

## 一、可以直接复制的内容

| 文件 / 目录 | 说明 |
|---|---|
| `src-tauri/` | Rust 工程、Tauri 配置、应用图标，自包含 |
| `.github/workflows/build-tauri.yml` | GitHub Actions 自动打包流程 |

## 二、不能直接复制的内容

| 文件 | 原因 |
|---|---|
| `package.json` | 目标项目有自己的依赖和脚本，直接覆盖会导致原有依赖丢失。必须用 `yarn add` / `npm install` 合并 |

---

## 三、详细迁移步骤

### 第 1 步：复制 `src-tauri/`

```bash
cp -r /旧项目路径/src-tauri /新项目路径/
```

### 第 2 步：在新项目中安装 Tauri 依赖

```bash
cd /新项目路径
yarn add -D @tauri-apps/cli @tauri-apps/api
```

> 如果新项目用 npm，执行：
> ```bash
> npm install -D @tauri-apps/cli @tauri-apps/api
> ```

### 第 3 步：添加启动脚本

打开新项目的 `package.json`，在 `scripts` 中添加（保留原有的 `dev`、`build` 等脚本不变）：

```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

### 第 4 步：修改 `src-tauri/tauri.conf.json`（最关键）

根据新项目的实际情况修改以下字段：

| 字段 | 说明 | 示例值 |
|---|---|---|
| `productName` | 应用名称（安装包名、窗口标题） | `"my-new-app"` |
| `version` | 应用版本号 | `"0.1.0"` |
| `identifier` | 唯一包标识符（反向域名格式） | `"com.yourname.newapp"` |
| `beforeDevCommand` | 前端开发启动命令 | `"yarn dev"` 或 `"npm run dev"` |
| `devUrl` | 前端开发服务器地址 | Vite: `"http://localhost:5173"`，CRA: `"http://localhost:3000"` |
| `beforeBuildCommand` | 前端构建命令 | `"yarn build"` 或 `"npm run build"` |
| `frontendDist` | 前端构建输出目录（相对于 src-tauri） | Vite: `"../dist"`，CRA: `"../build"` |

完整示例：

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "my-new-app",
  "version": "0.1.0",
  "identifier": "com.yourname.newapp",
  "build": {
    "beforeDevCommand": "yarn dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "yarn build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "my-new-app",
        "width": 800,
        "height": 600
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### 第 5 步：复制并适配 GitHub Actions 工作流

```bash
mkdir -p /新项目路径/.github/workflows
cp /旧项目路径/.github/workflows/build-tauri.yml /新项目路径/.github/workflows/
```

**检查包管理器是否一致**：打开 `build-tauri.yml`，确认以下两处与新项目匹配：

- 如果新项目用 **yarn**：
  ```yaml
  cache: 'yarn'
  run: yarn install
  ```
- 如果新项目用 **npm**：
  ```yaml
  cache: 'npm'
  run: npm install
  ```

### 第 6 步（可选）：更换应用图标

如果新应用需要不同图标，准备一张 1024×1024 的 PNG，然后：

```bash
cd /新项目路径
yarn tauri icon path/to/new-icon.png
```

这会自动生成 macOS（`.icns`）、Windows（`.ico`）和各尺寸 PNG 图标。

---

## 四、验证迁移是否成功

### 本地开发

```bash
cd /新项目路径
yarn tauri:dev
```

- 应用窗口正常打开 → `devUrl` 和 `beforeDevCommand` 配置正确
- 窗口白屏 → 检查 `devUrl` 端口是否与前端 dev 服务器一致

### 本地打包

```bash
yarn tauri:build
```

- 成功生成安装包 → `frontendDist` 和 `beforeBuildCommand` 配置正确
- 报 `frontendDist does not exist` → 检查构建输出目录是 `dist` 还是 `build`

### GitHub Actions 打包

1. 提交代码并推送到 GitHub
2. 仓库 Actions 页面 → `build-tauri` → **Run workflow**
3. 构建成功后去 **Releases** 页面下载安装包

---

## 五、常见问题

| 现象 | 原因 | 解决方法 |
|---|---|---|
| `tauri:dev` 报 `cargo metadata` 找不到 | 本地没装 Rust | 执行 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`，装完重开终端 |
| 开发模式窗口白屏 | `devUrl` 端口不对 | 确认前端 dev 服务器实际端口，修改 `tauri.conf.json` |
| 构建报 `frontendDist does not exist` | 输出目录不匹配 | Vite 项目用 `../dist`，CRA 项目用 `../build` |
| GitHub Actions 报 `yarn: command not found` | 工作流包管理器与项目不一致 | 将 workflow 中 `yarn install` 改为 `npm install`，`cache: 'yarn'` 改为 `cache: 'npm'` |
| 打包报 `No matching IconType` | 缺少 `.icns` / `.ico` 图标 | 执行 `yarn tauri icon icon.png` 生成全套图标 |
| macOS 打开 app 提示"无法验证开发者" | 应用未签名 | 右键 app → 打开；或执行 `xattr -dr com.apple.quarantine /Applications/应用名.app` |

---

## 六、更简单的官方方式（推荐）

如果不想手动复制和修改配置，可以使用 Tauri 官方的一键初始化命令：

```bash
cd /新项目路径
yarn add -D @tauri-apps/cli @tauri-apps/api
yarn tauri init
```

该命令会交互式询问：
- 应用名称
- 窗口标题
- 前端开发命令
- 前端开发服务器 URL
- 前端构建命令
- 前端构建输出目录

自动生成正确的 `src-tauri/` 目录和 `tauri.conf.json`，比手动复制更不容易出错。初始化完成后，再将已调好的 `build-tauri.yml` 复制过去即可。

---

## 七、迁移速查表

| 操作 | 能否直接执行 | 注意事项 |
|---|---|---|
| 复制 `src-tauri/` | ✅ 可以 | 必须修改 `tauri.conf.json` 中的 devUrl、frontendDist 等 |
| 复制 `package.json` | ❌ 不行 | 会覆盖目标项目依赖，应用 `yarn add` 合并 |
| 复制 `build-tauri.yml` | ✅ 可以 | 确认包管理器（yarn/npm）与目标项目一致 |
| GitHub 打包流程 | ✅ 完全一样 | 推代码 → Actions → Run workflow → Releases 下载 |
| 本地开发 `tauri:dev` | ⚠️ 需要本地 Rust | 未安装 Rust 会报 `cargo metadata` 错误 |
