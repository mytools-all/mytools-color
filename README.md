# 颜色助手

首次运行测试先执行 npm install --ignore-scripts，安装固定的开发测试依赖；这些依赖不进入运行包。

版本 0.1.1：屏幕取色统一使用宿主 screen.pickcolor：先授权，再在 3 秒倒计时内将光标移到目标像素，按 Esc 可取消。WebView 的 EyeDropper 可能一直不响应，因此主流程不再调用它；当前取色不提供放大镜。

本地运行 npm test、npm pack 后，在宿主“插件中心 → 开发者 → 安装插件包（.zip / .tgz）”安装生成的包，关闭并重开插件。新增 screen.pickcolor 权限，首次使用仍由宿主询问，插件不自动授予权限。

颜色助手：HEX / RGB / HSL 互转、色板与对比度检查。

源码版本：0.1.1；适用于 MyTools，不能作为独立网页调用宿主能力。

## 安装

在 MyTools 插件管理的 npm 安装入口输入 `@mytools-all/mytools-color@0.1.1`。也可以下载本仓库，在开发者页面选择“安装本地目录”。

## 开发

直接编辑本目录的 HTML、JavaScript 和样式，无需依赖宿主源码或其他插件仓库。修改后重新安装本地目录。运行 `npm test` 检查包内契约和逻辑。插件 API 规范见 [mytools](https://github.com/mytools-all/mytools/tree/main/docs)。

## 权限

声明的宿主能力：clipboard.write、storage.get、storage.set、screen.pickcolor。目录和危险操作仍需用户授权。

## 许可

项目代码使用 MIT；随附的第三方代码遵循各自随附的许可证。
