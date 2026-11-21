# 只属于我们的城堡

这是一个静态 HTML / CSS / JavaScript 浏览器游戏。场景、人形角色和双人小狗都使用 Three.js 3D 渲染。小狗使用 2026-11-18 经确认的独立建模版本：沿用参考图的正面轮廓，脸颊、腹部和后背采用完整圆润的体积，脚掌补足前后厚度。角色特征包括：小白保留宽脸、不对称耳朵和不规则毛边，小鸡毛保留垂耳、收拢的脖颈、饱满肚子和红项圈。手臂和短脚与身体是同一张可变形表面，走路和牵手时不出现分离的球形关节；支持迈步、摆耳、眨眼、转身和跳跃。

## 游玩

- 方向键或 WASD 移动，空格跳跃。
- 靠近城堡入口或回忆点后，按 E 或点击屏幕提示。
- M 打开回忆手册，V 切换镜头远近，Esc 收起相册。
- 手机可使用屏幕方向按钮和跳跃按钮。
- 第 6 个不同回忆点后男主加入；第 10 个后解锁同时变身。20 个全部访问后出现 29 岁生日祝福，可以继续重游。
- 双人同行时保持角色间距，通过肩、肘、手掌关节对齐牵手；两人中任意一方靠近回忆点均可出现打卡提示。跳跃落地后自由手臂会恢复自然姿态。
- 路灯灯串和室内灯串连接到实体挂点，道路交汇使用不重叠的地面；台阶高度与人物脚底使用同一份台面数据。
- 关闭相册时计入首次访问。重复访问不会增加计数。
- 进度仅保存在当前浏览器的 localStorage，不上传到服务器。不同设备和浏览器不会自动同步。
- 右上角音符可开关音乐，音乐由浏览器合成，无需联网加载音频。

## 补齐回忆

编辑 `dist/memories.js`里 20 个条目的 `title`、`text` 和 `photos`。保留 `id` 不变。

```js
{
  id: 1,
  room: 0,
  position: [-24, 23],
  title: '我们第一次旅行',
  text: '在这里写下这一段回忆。\n换行也会保留。',
  photos: [
    { src: './assets/memories/01-a.jpg', caption: '一起看到的风景' },
    { src: './assets/memories/01-b.jpg', caption: '那天的我们' },
  ],
}
```

将照片放入 `dist/assets/memories/`。目前所有真实回忆标题、正文和照片数组均为空，画面上展示的是占位提示，没有编造个人故事。点击真实照片后可放大并左右翻阅。

## 本地打开

在仓库根目录运行 `python3 -m http.server 8080 --directory dist`，然后在浏览器中打开 `http://localhost:8080`。因为使用 JavaScript ES Modules，请通过 HTTP 服务访问。Three.js 已随文件打包，不依赖远程 CDN。

## 素材

- `dist/assets/dog-sprites.png`：使用内置图像工具从参考图提取的透明插图，现在仅用于变身解锁提示。游戏内的小狗为可活动的 3D 模型。
- 图像处理提示：`Background-extraction: extract only the two original dogs; preserve wobbly thick black contours, exact body colors, facial features, ears, red collar and proportions; white dog isolated in left half, brown dog isolated in right half; real transparent alpha; no scenery, no redesign, no text.`
- 其余场景与人形角色由程序构建。Three.js 的许可证位于 `dist/vendor/THREE-LICENSE.txt`。

## 验证

未编写单元测试。前两版已通过浏览器走完换装、车站、三级台阶、城堡内 20 处回忆、6 / 10 处剧情触发、变身和生日结局。本次接入 2026-11-18 经确认的独立建模版本，游戏使用的模型源文件与确认稿逐字节一致；在真实游戏场景中检查了原存档恢复、双人牵手、行走与转向、跳跃落地、双人同时变身切换，以及回忆 06 的相册打开和关闭，控制台未出现错误或警告。原有存档格式保留。真实个人照片尚未提供，待补齐素材后再确认每组照片的实际排版。
