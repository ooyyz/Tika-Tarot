# Tika Tarot

蓝金霜色的本地塔罗抽牌器。首版 v0.1.0 已可运行，无需服务器、安装依赖或联网。

## 打开与使用

双击项目内的 `index.html`。Windows 使用 Edge 或 Chrome，Mac 使用 Safari 或 Chrome。请保持 `index.html`、`styles/` 和 `scripts/` 的相对位置不变。

1. 写下问题（可留空），选择单张或三张牌阵，按需开启逆位。
2. 点击「洗牌并开始」，从 22 张牌中选择。
3. 选满后逐张翻牌，或点击「全部翻开」。最后一张翻开时自动保存。
4. 在解读下方写笔记，通过「记录」查看历史。「牌册」可以浏览所有牌及正逆位含义。

记录保存在当前浏览器中，并非自动写入项目文件夹。更换浏览器、移动目录或清理浏览数据前，请先导出 JSON 备份；导入会跳过相同记录，发生 ID 冲突时另存。无法使用浏览器存储时，应用保留本次会话的数据并提供导出。未完成牌局不会在刷新后恢复。

下载位置由浏览器决定；私人备份建议保存到 `outputs/private/`，该目录已被 Git 忽略。

## 文件与验收

- `docs/DESIGN.md`：产品、视觉与交互依据。
- `outputs/ACCEPTANCE.md`：测试结果、已验证环境和仍待覆盖的项目。
- `outputs/card-atlas.png`、`outputs/card-atlas.svg`：牌背与全部 22 张牌的图形总览。
- `Tika-Tarot-v0.1.0.zip`：约 28 KB 的最小运行包，Windows 和 Mac 通用，解压后双击 `index.html`。
- `outputs/Tika-Tarot-v0.1.0.zip`：不含私人记录的运行交付包；解压后打开其中的 `index.html`。
- `work/`：临时开发文件，不入库。

开发侧逻辑检查可在已安装 Node.js 的环境运行 `node --test tests/core.test.cjs`。使用应用本身不需要 Node.js。

远程仓库：`git@github.com:ooyyz/Tika-Tarot.git`。版本提交与推送按用户明确指令执行。
