# 水墨银河（Cosmic Ink）

一个基于 `React` + `Vite` + `three.js` / `@react-three/fiber` 的 3D 交互作品：

- 上传音频后，粒子形态会随音频频谱变化
- 支持摄像头手势识别（MediaPipe Hands），用于交互强度控制
- 支持中英文界面切换（默认中文，会记住你的选择）

## 运行环境

- Node.js（建议较新版本）
- 包管理器：`pnpm`

## 安装依赖

在本目录（`waves-xyl`）下执行：

```bash
pnpm install
```

## 本地开发

```bash
pnpm dev
```

默认端口为 `3000`。

## 构建与预览

构建：

```bash
pnpm build
```

本地预览构建产物：

```bash
pnpm preview
```

## 功能说明

### 音频输入

- 在页面内上传任意音频文件（`audio/*`）
- 播放中会持续读取频谱数据驱动效果

### 摄像头与手势

- 需要浏览器允许摄像头权限
- 未授权或设备不支持时会显示错误状态

### 语言

- 默认语言为中文
- 右上角可切换 `EN / 中文`
- 切换会写入 `localStorage`（键：`lang`），下次打开自动恢复

## 配置

### 环境变量

项目在 `vite` 构建时会把 `GEMINI_API_KEY` 注入到前端常量中（见 `waves-xyl/vite.config.ts`）。如果你不需要相关能力，可以不设置。

如需设置（PowerShell）：

```powershell
$env:GEMINI_API_KEY = "YOUR_KEY_HERE"; pnpm dev
```

## 常见问题

- 摄像头无法启动：检查浏览器权限、是否为 `https`/`localhost`、以及设备是否被其他应用占用
- 无法记住语言：可能是浏览器禁用了 `localStorage` 或处于隐私/无痕模式

