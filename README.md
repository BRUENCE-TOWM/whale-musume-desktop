# 鲸鱼娘桌宠 · Whale Musume Desktop

把鲸鱼娘放在 Windows 桌面上，点一下听歌，闲下来摸摸头、投喂或玩小游戏。

<img src="public/icon.png" alt="鲸鱼娘" width="220">

基于 [Sutera-Diffusus/dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume) v2.1.0 制作的独立桌面适配，无需安装 DeepSeek Harness，也不需要 API Key。

## 获取源码

本仓库仅提供源码，不提供预编译安装包。可以点击 GitHub 的 **Code → Download ZIP**，或[下载源码 ZIP](https://github.com/BRUENCE-TOWM/whale-musume-desktop/archive/refs/heads/main.zip)。运行步骤见下方“从源码运行”。

把自己的歌曲放到源码根目录，右键桌宠 → **音乐与桌面设置** → **刷新歌曲**。仓库不包含个人歌曲、养成记录或缓存，没有设置开机自启。目标平台为 Windows x64，也可以按下方命令自行打包。

## 音乐操作

| 操作 | 效果 |
| --- | --- |
| 第一次左键点击鲸鱼娘 | 播放所选歌曲 |
| 播放中再次点击 | 暂停 |
| 暂停后再次点击 | 从暂停位置继续 |
| 一首歌播放完毕 | 自动停止，不循环 |
| 播完后再次点击 | 从头播放 |
| 鼠标移入、移出或拖动 | 不切换音乐状态 |

右键菜单可立即暂停。设置支持切换歌曲、音量及点击音乐开关。支持 MP3、WAV、OGG、M4A、FLAC、AAC 文件识别，实际可播放性取决于编码。

## 互动与桌面功能

- 透明置顶窗口，透明像素区域可点击穿透，不占任务栏。
- 拖拽移动、惯性、记住位置、调整大小、切换显示器。
- 摸头、戳肚子或尾巴、投喂、夸夸、三连击庆祝。
- 好感度、等级、签到、每日任务、成就墙、成长日记。
- 戳泡泡和接点心小游戏，按 Esc 或点退出游戏关闭。
- 托盘菜单支持显示、隐藏、设置、暂停音乐和退出。

左键点击会同时保留原来的互动反应；关闭“点击音乐”即可只互动。

## 数据与可选功能

设置和养成记录保存在歌曲目录下的 `data/`。备份该目录可保留记录；不要把它提交到 Git。没有上传歌曲或养成数据的逻辑。

天气在填写城市后通过 Open-Meteo 查询。余额设置沿用上游的可选本机代理 `127.0.0.1:3020`，默认关闭。独立版未接入 DSH 工作状态、MiMo TTS、付费 AI 聊天或真实账户余额，不会自动读取账号密钥。

## 从源码运行

要求：Windows x64、Node.js 22.12+（已在 Node.js 24 上验证）。

```powershell
git clone https://github.com/BRUENCE-TOWM/whale-musume-desktop.git
cd whale-musume-desktop
npm ci
npm run build
npm start
```

开发模式默认从仓库根目录找歌曲。可通过 `$env:WHALE_HOME='D:\MyMusic'` 指定其他目录。Electron 首次启动或打包时会下载运行包。

如果 Electron 下载失败，可在当前终端设置 `$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'` 后运行 `node node_modules/electron/install.js`，安装器仍会验证随包提供的校验值。

```powershell
npm test
npm run test:upstream
npm run test:smoke
npm run package
```

成品在 `dist/whale-musume-desktop-1.1.1-win32-x64/`。集成测试自动生成静音 WAV，使用临时设置目录，不需要个人歌曲，也不会修改日常养成记录。需要可用的桌面会话。

## 源码结构

`main.cjs` 管理桌面窗口、托盘与本地音频读取；`renderer.jsx` 负责独立设置和鼠标穿透；`music.cjs` 管理点击播放状态；`preload.cjs` 提供有限的桌面接口。

`vendor/dsh-whale-musume/` 保留上游源码和许可证，`build.cjs` 从它生成桌面适配代码，无需额外克隆其他仓库。生成目录 `upstream/` 和构建产物不提交。

## 来源与许可

上游项目：[Sutera-Diffusus/dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume)，v2.1.0，提交 `41a21d289af2bc268cbc83ebc50ba10158007026`（2026-09-14）。感谢原作者的角色素材、台词、交互、养成及小游戏实现。

[MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 是调研参考项目，其记账业务代码没有合并到本仓库。

代码使用 [MIT License](LICENSE)，第三方署名见 [NOTICE.md](NOTICE.md)。这是非官方同人桌宠，与 DeepSeek 官方无隶属关系；上游角色素材来源和使用范围以原作者要求为准。
