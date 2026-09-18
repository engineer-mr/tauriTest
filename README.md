# github 打包步骤

![alt text](image.png)

# 下载地址

![alt text](image-1.png)
![alt text](image-2.png)

## Android 打包

项目使用 Tauri 2，可以直接通过 GitHub Actions 打包 Android。将代码推送到 GitHub 后，在仓库的 `Actions` 页面选择 `Build Android`，点击 `Run workflow`。也可以推送一个 `v` 开头的 tag 自动触发，例如：

```bash
git tag v0.1.0
git push origin v0.1.0
```

构建完成后，在对应的 workflow run 页面下载 `android-packages` artifact。里面包含 APK（可直接安装测试）和 AAB（用于 Google Play）。

首次构建会自动生成 Tauri Android 工程、安装 Android SDK/NDK 和 Rust Android targets，不需要将 `src-tauri/gen/android` 提交到仓库。

### 本地 Android 构建

本地构建需要 Rust、JDK 17、Android SDK/NDK 和 Android Studio。安装完成后执行：

```bash
npm run tauri:android:init
npm run tauri:android:build
```

当前 Android 包使用默认调试/未签名发布配置，适合先验证安装和运行。正式发布到 Google Play 前，还需要配置 Android signing key，并将 `com.tauritest.app` 替换为自己的正式应用标识。
