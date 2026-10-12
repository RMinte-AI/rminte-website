# TianshanOS root 运维指南

本指南依据 TianshanOS 0.6.2 编写。后续版本中未变化的功能和操作，仍可参考本指南。若界面、提示或操作结果不同，请查阅所用版本的说明。

本指南面向使用 root 账户的用户。第一部分包含日常功能，第二部分介绍终端、远程指令与自动化。root 操作可能影响设备和远程主机；执行前确认目标和正在运行的任务。安全管理请参阅单独的安全指南。

按设备页面显示的功能操作。部分选项需要指定硬件或配置才会出现。电脑上将指针停在图标按钮上，可查看按钮名称。

## 第一部分：日常功能

## 1. 开始使用

### 进入 WebUI

1. 在浏览器中打开管理员提供的设备网页地址（WebUI）。
2. 点击页面右上角的“登录”。
3. 输入 `root` 和设备提供的 root 密码。
4. 点击“登录”。登录成功后，右上角会显示当前用户名。

使用默认密码登录后，页面会显示“安全提醒”。输入当前密码，再输入两次新密码，点击“立即修改”。两次新密码必须一致。点击“稍后修改”可关闭提醒。

使用完毕后，点击右上角的“退出登录”。再次操作设备时需要重新登录。

### 切换语言

点击页面顶部的语言按钮，在菜单中选择中文或 English。页面内容和按钮名称会立即切换到所选语言。

### 页面导航

root 可使用以下入口：

- “系统”：查看设备状态，控制模组、风扇和 LED，并进入 OTA 升级。
- “网络”：查看以太网和 DHCP 状态，设置 WiFi 和 NAT 网络转发。
- “文件”：管理 SD 卡和 SPIFFS 中的文件。
- “终端”：执行设备命令并查看系统日志。
- “指令”：管理和运行远程 SSH 指令。
- “自动化”：配置数据源、规则和动作模板。
- “安全”：进入单独的安全管理页面，详细操作请查看安全指南。

## 2. 系统状态与常用操作

点击顶部导航中的“系统”进入系统页面。

### 查看资源与服务状态

“带外管理芯片资源监控”显示管理芯片的 CPU、DRAM 和 PSRAM 使用情况。这些读数不代表 AGX 或 LPMU 的资源使用率。

- 点击“详情”，查看内存总量、已用和空闲空间等信息。
- “服务”按钮显示运行中的服务数和服务总数。点击后可查看各项服务的状态和启动阶段。
- 服务状态异常时，先刷新。需要重启的服务按下方“重启单项服务”操作。

### 查看系统与电源信息

“系统总览”显示芯片、固件版本、ESP-IDF 版本和运行时间。日常使用主要核对固件版本；ESP-IDF 是设备所用系统框架的版本。

卡片右侧显示输入电压、内部电压、电流、功率和保护状态。

保护状态旁的开关用于启用或停用低电压保护。启用后，设备会按保存的电压和等待时间，在低电压时关机、供电恢复后重新启动。

### 查看网络与时间

“网络与时间”显示以太网、WiFi、IP 地址、当前时间、同步状态、时间源和时区。

- 点击“同步时间”，将浏览器当前时间同步到设备。
- 点击“时区”，选择预设时区或填写页面支持的时区设置，然后保存。
- 点击“OTA 升级”，进入固件升级页面。

### 高级操作

#### 重启 TianshanOS

重启会暂时中断 WebUI 和设备管理功能。先完成正在进行的操作，再点击“重启”并确认。等待设备恢复，然后重新打开 WebUI。

#### 重启单项服务

重启服务会暂时中断该服务提供的功能。在“服务状态”中找到异常服务，点击该行的“重启”。操作完成后重新查看服务状态。

#### 调整关机设置

这些设置决定设备在低电压时何时关机，以及供电恢复后何时重新启动。请按设备的供电要求填写电压和等待时间。

点击“关机设置”，可以调整以下内容：

- “低电压阈值”：低于该电压后开始关机倒计时。
- “恢复电压阈值”：高于该电压后开始恢复流程。
- “关机倒计时”：检测到低电压后等待多久执行关机。
- “恢复保持时间”：电压恢复后等待多久确认供电稳定。
- “风扇停止延迟”：关机后等待多久关闭风扇。

保存后，页面会应用新的保护设置。

#### 切换顶部 USB 连接目标

切换 USB 目标可能使当前连接的外设暂时断开。确认目标设备和正在进行的工作后再操作。

设备提供 USB 切换功能时，页面会显示“USB”按钮。每点击一次，顶部 USB 接口按 ESP、AGX、LPMU 的顺序切换到下一个目标。查看按钮上的目标名称和页面提示，确认切换结果。

## 3. 设备面板

“设备面板”位于“系统”页面，包含模组电源控制、快捷操作和数据组件。

### 控制 AGX 和 LPMU

关闭模组前，先保存其中的工作并完成正常关机流程。强制断电可能造成未保存的数据丢失。

- “AGX 电源”显示电源控制状态。点击按钮可上电或断电；操作后等待页面确认。
- “LPMU 电源”显示“在线”“离线”或“未知”。在线表示网络能够连通，离线表示网络无法连通。这些状态不能单独证明模组已开机或关机。
- 点击 LPMU 按钮会触发一次与物理电源按钮相同的操作。随后等待检测和页面提示；结果未知时，先检查模组和网络，不要连续点击。

### 使用快捷操作

快捷操作卡片由 root 用户配置。显示卡片和允许手动运行是两项设置；看得到卡片，不代表可以启动任务。

1. 查看卡片名称、状态和可用按钮，确认目标任务。
2. 点击可执行的卡片，等待本次操作的状态更新。处理中不要再次启动。
3. 后台任务可能提供日志、核验状态或停止按钮。查看日志可了解任务输出。点击停止后，检查任务是否已停止。
4. 状态未知或启动被阻止时，先使用页面提供的核验功能，或检查规则、远程指令和主机连接，方法见第 11、12 章。

无法启动时，按提示处理，不要连续点击：

- 规则已停用，或不允许手动触发：在“自动化”检查规则设置（见第 12 章），不要把看到卡片当作运行许可。
- 任务正在执行、启动、核验或停止：等待状态更新。
- 关联服务已在运行：无需再启动。需要重启服务时，先停止并确认结果。
- 服务是否停止尚未确认：先核验状态。无法确认时，在“安全”检查主机连接（见第 11 章）。
- 规则尚未加载，或等待重启移除：在“自动化”核对规则版本和待重启提示（见第 12 章）。
- 自动化暂不接受启动请求：在“自动化”检查引擎和配置状态。按提示处理；重启前检查正在运行的任务。

重新启动服务前，先确认它已停止。页面接受启动或停止请求后，任务可能仍在处理中；等待最终状态。完成一次点击后，等待几秒再启动其他操作。

长按卡片，出现排序提示后拖动，可以调整显示顺序。

没有可用卡片时，先分清页面提示：

- “快捷操作正在加载”：等待配置加载完成；长时间没有变化时，可点击“前往自动化”，并在“终端”的“系统日志”查看原因。
- “快捷操作暂不可用”：点击“前往自动化”，检查状态；在“终端”打开“系统日志”查找原因。恢复配置后再使用卡片，不要反复点击启动。
- 没有已配置的快捷操作：可点击“前往自动化”，新建规则或检查已有规则的“显示在面板”设置。

导入规则包后，卡片可能仍运行旧任务，直到设备重启。新导入或待移除的规则也可能无法启动。任务刚被调整时，先核对规则列表中的当前运行版本，再执行。

不要为了恢复卡片，自行重启正在提供服务的设备。

### 管理数据组件

数据组件用于在“设备面板”中持续显示设备数据。

1. 点击“组件管理”。
2. 选择刷新间隔，或关闭自动刷新。
3. 添加预设组件，或选择页面提供的组件样式和数据来源。
4. 根据需要编辑名称、显示方式和单位，然后保存。

已有组件可以编辑、删除和调整顺序。也可以直接点击组件卡片进入编辑界面。长按组件后拖动，可以改变它在面板中的位置。

## 4. 风扇管理

“风扇控制”位于“系统”页面。卡片显示设备提供的风扇。设置曲线前，核对风扇编号。

### 查看风扇状态

顶部显示“有效温度”和“当前输出”。卡片上的大百分比是设备确认已设置的调速值，不是实测转速。RPM 表示测得的每分钟转数，没有有效读数时不显示。大百分比显示 `--`，表示当前输出尚未确认。

拖动手动滑块时，滑块旁显示准备设置的值，大百分比仍显示当前输出。松开滑块后，查看提示和更新后的读数。“请求设置”与当前输出不同，说明不能只凭请求值判断调速已经生效。

智能模式会显示运行状态，例如“智能模式”“按曲线运行”“保护介入”或“温度失效”。页面还提供“安全参考”“45 秒预测”和“升温速度”。

出现“温度失效”时，检查温度来源是否仍在更新。设备会采用温度失效时的保护调速。点击“TTI”可查看智能热控说明。

点击区域顶部的刷新按钮，重新获取状态。出现“未能完成风扇调节”或输出未确认时，检查设备状态后再决定是否重试。

### 选择运行模式

| 模式 | 作用 |
| --- | --- |
| “关闭” | 停止风扇。 |
| “手动” | 用滑块设置固定的调速百分比，范围为 0-100%。 |
| “曲线” | 按已设置的温度与调速百分比对应关系运行。 |
| “智能” | 以基础曲线为参考，根据温度趋势和过去的调速情况调整散热；需要保护时采用保护调速。 |

关闭风扇或设置过低的手动值会降低散热能力。执行前确认设备负载和温度，并持续观察。只有在手动模式且当前输出已确认时，滑块才可调节。

### 设置风扇曲线

点击“风扇控制”区域顶部的“曲线”，打开“风扇曲线管理”。卡片内的“曲线”只切换运行模式。

1. 在“风扇”中选择要调整的编号，并与系统页卡片核对。
2. 在“温度变量绑定”中点击“添加变量”，选择温度来源并填写权重。
3. 点击“绑定”。绑定的温度来源由曲线、智能模式的风扇共用，修改会影响使用该来源的风扇。
4. 在“曲线节点”中添加或编辑节点。每条曲线至少需要 2 个节点，最多支持 10 个。
5. 设置“最小转速”和“最大转速”。这里填写的是调速百分比，最小值不能高于最大值。
6. 设置“温度回差”和“最小调节间隔”。回差范围为 0-20°C，可减少温度小幅波动造成的频繁调速。间隔范围为 500-30000 ms，1000 ms 等于 1 秒。
7. 点击“保存曲线”。成功后，设置被保存，所选风扇切换到曲线模式。若希望继续使用智能热控，返回风扇卡片点击“智能”。

保存失败时，先查看具体提示并检查当前状态，再决定是否重试。解除温度绑定后，也应检查有效温度和风扇状态。

### 导入和导出曲线

- 点击“导入配置”，选择曲线 JSON 文件。JSON 是保存曲线数据的文件格式。检查载入的节点、限制和风扇编号，再点击“保存曲线”使其生效。
- 点击“导出配置”，浏览器会下载当前曲线，并尝试将副本保存到 SD 卡的 `/sdcard/config` 目录。分别检查浏览器下载结果和页面提示的 SD 卡保存结果。

### 使用测试温度

测试温度会临时替代正常温度来源，并影响曲线或智能调速。测试期间持续观察风扇和设备状态。

1. 在“测试温度”中输入 0-100°C。
2. 点击“测试”，观察当前输出、状态和风扇响应。
3. 测试结束后点击“清除测试”，恢复正常温度来源，并确认有效温度已恢复。

## 5. LED 管理

“LED 控制”位于“系统”页面，只显示设备提供的 LED。不同 LED 可用的功能不同。

### 常用控制

- 使用卡片底部的灯泡按钮开启或关闭 LED。
- 拖动“亮度”滑块调整亮度，或选择颜色和预设色。
- 点击动画按钮进入“LED 设置”，在“程序动画”中选择动画并使用对应的播放或停止按钮。
- 点击卡片右下角的保存图标，保存当前 LED 配置。
- 点击“全部关闭”关闭所有 LED，并查看页面报告的结果。部分关闭失败时，检查对应设备。

### LED 矩阵高级功能

矩阵设备的卡片提供相应功能图标，打开后可在“LED 设置”中切换分组：

- “程序动画”：选择和运行动画。
- “图像/QR码”：从 SD 卡选择图像，或输入内容生成 QR 码。
- “文本显示”：填写文字，并设置字体、对齐、滚动、前景色和背景。
- “后处理滤镜”：选择滤镜及参数，再应用或停止。
- “色彩校正”：调整显示效果，并按页面按钮重置、导入或导出设置。

操作后检查灯光或矩阵画面。只使用页面提供的功能。设置失败时，按提示检查文件、输入和设备状态。

## 6. 网络管理

点击顶部导航中的“网络”进入“网络设置”。修改网络模式、热点或 NAT 设置可能断开 WebUI。保存前，确认能用新的网络地址重新连接设备。

### 查看网络状态

页面顶部显示以太网、WiFi 客户端和 WiFi 热点的连接状态。进入对应面板，可以查看 IP 地址、子网掩码、网关、DNS、MAC 地址、SSID、信号和接入设备数量等信息。

以太网面板用于查看当前链路和地址信息，不提供地址修改入口。

### 选择 WiFi 模式

| 模式 | 作用 |
| --- | --- |
| “关闭” | 关闭 WiFi。 |
| “站点 (STA)” | 让设备连接现有 WiFi 网络。 |
| “热点 (AP)” | 让设备提供 WiFi 热点。 |
| “STA+AP” | 同时连接现有 WiFi，并保留设备热点。 |

选择模式后等待页面刷新状态。切换模式期间，当前无线连接可能暂时断开。

### 连接 WiFi

1. 将 WiFi 模式设置为“站点 (STA)”或“STA+AP”。
2. 在“站点连接”中点击“扫描”。
3. 从列表中选择网络。列表会显示 SSID、信号强度、信道和认证方式。
4. 输入密码并确认。开放网络可以将密码留空。
5. 等待状态变为“已连接”，并确认页面显示新的 IP 地址。

点击“断开”可以结束当前 WiFi 客户端连接。

### 配置 WiFi 热点

1. 将 WiFi 模式设置为“热点 (AP)”或“STA+AP”。
2. 在“热点”区域点击“配置”。
3. 填写 SSID。密码留空会创建开放热点；设置密码时至少输入 8 位字符。
4. 选择信道，并根据需要启用“隐藏 SSID”。
5. 点击“应用”，等待热点状态更新。

点击“设备”可以查看当前连接到热点的设备。

### 设置主机名

在“网络服务”的“主机名”区域输入新名称，然后点击“设置”。主机名更新后，页面会显示当前名称。

### 查看 DHCP 客户端

DHCP 会自动为接入设备分配网络地址。点击“客户端”，选择“WiFi AP”或“Ethernet”，查看当前分配记录。点击刷新按钮可以重新加载列表。

### 高级网络操作

#### 设置 NAT 网关

NAT 用于在设备的网络接口之间转发网络流量。启用或停用 NAT 后，点击“保存”保留当前设置。操作完成后检查 WiFi 和 Ethernet 状态。

#### 通过 LPMU 接入上层网络

此操作通过已配置的 LPMU 主机接入网络。先确认能连接 LPMU、网络线缆已接好，再准备该主机 SSH 账号的 sudo 密码。这个密码用于允许账号修改系统设置，可能与 WebUI 登录密码不同。

1. 在“接入上层网络”区域点击“通过 LPMU 接入”。
2. 在弹窗中输入“LPMU sudo 密码”，再点击接入按钮。密码仅用于本次操作，不保存；下次执行需要重新输入。
3. 等待处理结束，不要重复启动。
4. 结果窗口显示互联网连接正常和网络配置已完成时，才表示接入成功。
5. 失败或结果未确认时，先阅读具体原因；需要更多信息时展开“执行日志”。密码错误时核对密码，找不到互联网连接时检查网络接线与上层网络。

状态获取失败不等于脚本已经停止。先点击页面提供的“刷新状态”确认当前执行情况，再决定是否重新接入。

## 7. 文件管理

点击顶部导航中的“文件”进入“文件管理”。

SD 卡是可插拔存储，SPIFFS 是设备内部文件存储。点击“SD 卡”或“SPIFFS”切换位置。页面上方显示当前文件夹路径；点击路径中的文件夹名称，可以返回上一级或更早的目录。

### 浏览和管理文件

- 点击文件夹名称进入该目录。
- 点击文件右侧的下载按钮，将文件保存到浏览器的下载位置。
- 点击重命名按钮，输入新名称并确认。
- 点击“新建文件夹”，输入文件夹名称并创建。
- 点击刷新按钮重新加载当前目录和存储状态。

### 上传文件

文件只能上传到 SD 卡，不能上传到 SPIFFS。先确认 SD 卡已挂载。

1. 点击“SD 卡”，进入要上传文件的目录。
2. 点击“上传文件”。
3. 点击上传区域选择一个或多个文件，或将文件拖入该区域。
4. 检查上传列表，移除不需要的文件。
5. 点击“上传”，等待每个文件显示完成状态。

上传 `.tscfg` 配置包后，页面会显示配置包的验证和应用步骤。但当前文件上传入口不会应用包中的设置；上传或验证成功，不代表设置已经生效。

规则配置包请从“自动化”页面导入，步骤见第 12 章。不要用普通文件上传代替规则导入。其他配置包的来源和签名说明见安全指南。

### 批量操作

勾选文件或文件夹后，页面会显示批量工具栏。

- “批量下载”下载选中的文件。文件夹不会加入下载内容。
- “批量删除”删除选中的文件和文件夹。
- “取消选择”清除当前选择。

### 删除文件或文件夹

删除操作无法从 WebUI 撤销。删除文件夹时，其中的全部内容也会被删除。确认名称和路径后，再点击“删除”或“批量删除”并确认。

### 挂载和卸载 SD 卡

卸载后，SD 卡中的文件会暂时无法访问。先确认上传、下载等文件操作已结束，再点击“卸载 SD”。

设备用 SD 卡保存自动化配置时，拔卡或换卡可能导致重启后无法加载配置。先确认配置和正在运行的任务允许卸载。页面要求保留 SD 卡时，不要卸载或拔出。

SD 卡未挂载时，页面会显示“挂载 SD”。点击该按钮，等待存储状态变为“已挂载”，随后重新进入 SD 卡目录。

## 8. OTA 更新

在“系统”页面的“网络与时间”区域点击“OTA 升级”，进入“固件升级”。

更新过程中设备会重启，WebUI 会暂时断开。开始前应保存正在进行的工作，并保持设备供电稳定。升级进度尚未完成时不要关闭设备。

### 从 OTA 服务器检查更新

1. 查看页面显示的“当前版本”。
2. 在“OTA 服务器”中输入管理员或发行方提供的服务器地址。
3. 点击“保存”，随后点击“检查更新”。
4. 页面会显示“发现新版本”“已是最新版本”“服务器版本较旧”或错误信息。
5. 确认目标版本后，点击“立即升级”或页面显示的升级按钮。
6. 等待下载、安装和重启完成。需要中止时，使用页面显示的中止按钮；只在按钮可用的阶段操作。
7. 设备重新上线后，重新连接 WebUI，并核对“当前版本”。

升级同时包含 WebUI 时，固件和 WebUI 会依次更新。升级到 0.6.2 时，请使用发行方提供的配套主固件和 WebUI 资源，两者应来自同一发布版本。升级后仍显示旧界面时，尝试强制刷新浏览器，再核对版本和页面。

### 手动升级

展开“手动升级”后，可以选择以下方式：

- “从 URL 升级”：填写固件 URL，根据发布说明勾选“同时升级 www”，然后点击“升级”。www 指设备网页界面的资源文件。
- “从 SD 卡升级”：填写固件文件路径，例如 `/sdcard/firmware.bin`。勾选“同时升级 www”时，确保同目录中也有该版本的 `www.bin`。

从 URL 升级时，“跳过证书校验”用于跳过 HTTPS 服务器证书验证。勾选后，设备无法通过该证书确认下载服务器的身份。日常升级请保持未勾选；遇到证书错误时，请先联系管理员检查服务器地址和证书。

### 分区管理与回滚

“分区管理”显示当前运行分区和其他可用分区。

- “标记有效”会确认当前运行版本，并取消该版本的自动回滚保护。确认当前版本运行正常后再执行。
- “回滚到此版本”会选择另一可启动版本，并通过重启切换。回滚会中断当前服务，执行前应确认目标版本和相关数据兼容。

操作完成并重启后，重新打开 WebUI，核对当前版本和设备状态。

0.6.2 改变了自动化配置的保存方式。回退旧固件前，请确认旧固件能否读取这些配置，必要时联系设备提供方，并准备备份和恢复方法。

回滚只切换固件，不会把配置恢复成旧格式。回退后，原有规则不一定能继续使用。

## 9. 安全管理入口

点击顶部导航中的“安全”进入安全管理页面。SSH 密钥、远程主机、主机指纹、HTTPS 证书、配置包和账户管理的操作请查看《TianshanOS 安全指南》。本指南不重复这些内容。

### 遇到失败或结果未确认

填写表单时，字段旁可能出现红色标记和错误说明。先按说明修正该字段，再保存。标记消失不代表已经保存成功；还要检查保存提示和列表。

先看哪项操作失败，再阅读原因和下一步。提示没有说明原因时，不要猜测。

如果提示提供“详情”，点击后可查看更多信息。点击“收起”可隐藏详情。页面提供 × 时，可点击它关闭提示。需要进一步检查时，保留提示和详情，在“终端”打开“系统日志”检查。

出现“结果未确认”时，先刷新并检查设备、文件或任务状态。超时或断开连接不代表操作没有执行；不要立即重复断电、删除、启动任务或升级。仍无法确认时，在“终端”打开“系统日志”查看原因。

批量操作后，分别检查成功、失败和未确认的项目。下载文件后，在浏览器下载列表中确认文件已保存。

## 第二部分：root 专属功能

## 10. 终端与系统日志

“终端”只对 root 显示。它可以直接执行设备控制台命令，也可以查看设备日志。命令可能立即改变设备状态，输入前应确认命令来源、参数和影响。

### 连接并使用终端

1. 点击顶部导航中的“终端”。
2. 等待页面显示“已连接到设备”和 `tianshan>` 提示符。
3. 输入 `help`，查看当前固件提供的命令。
4. 输入命令并按 Enter。等待输出结束并重新出现提示符。

页面显示“未连接到设备”时，输入不会执行。连接断开后页面会提示重新连接；恢复连接后再提交命令，避免重复执行。

终端提供以下键盘操作：

| 操作 | 作用 |
| --- | --- |
| Ctrl+C | 清除当前输入，并请求中断命令；能否停止取决于命令是否支持中断。 |
| Ctrl+L | 清屏。 |
| ↑ / ↓ | 查看本次页面会话中的命令历史。 |
| ← / → | 在当前输入中移动光标。 |

页面顶部的“清屏”只清除当前显示，不会撤销已经执行的命令。“断开”会结束当前终端连接。

### 进入远程 SSH Shell

SSH Shell 会把后续键盘输入发送到远程主机。连接前应确认目标地址、用户和认证方式，并完成安全指南中的 SSH 准备工作。

1. 输入 `ssh --help`，查看 SSH 命令说明。
2. 按以下格式填写实际主机地址和用户名：`ssh --host <主机地址> --user <用户名> --shell`。尖括号及其中的文字都需要替换。需要指定端口时，在 --shell 前添加 `--port <端口>`。
3. 等待终端显示远程连接成功，再输入远程命令。
4. 按 Ctrl+\ 退出 SSH Shell，返回 tianshan> 提示符。

不要在屏幕共享、录屏或可被他人查看的终端中输入明文凭据。

### 查看系统日志

点击终端页顶部的“系统日志”打开日志窗口。

- “级别”控制最低显示级别。选择 ERROR、WARN+、INFO+ 或 DEBUG+ 可以缩小日志范围。
- “TAG”按日志来源筛选。
- “搜索”按关键词筛选当前日志。
- “自动滚动”开启时，页面会跟随最新日志。
- 刷新按钮会重新读取历史日志。
- 清除按钮只清除当前窗口中的日志显示。

筛选后没有内容时，可以先清空 TAG 和关键词，再调整级别。关闭日志窗口不会停止设备服务。

## 11. 管理和运行远程指令

“指令”用于保存可重复使用的 SSH 命令，并在选定的远程主机上运行。远程主机及其认证信息在“安全”页面管理；具体操作请查看安全指南。

### 连接前核对主机指纹

指纹用于核对你连接的是哪台主机。以下步骤适用于网页“安全”中的 SSH 主机测试，不是终端 SSH Shell 的确认流程。提示主机指纹未登记或发生变化时，不要反复执行指令。进入“安全”，找到目标 SSH 主机，点击“测试”。

首次连接时，确认框会显示主机地址和指纹。通过可信渠道向主机管理员核对，确认一致后才点击“信任并连接”。

指纹变化时，确认框会显示已保存的指纹和当前指纹，默认选中“取消”。重装系统可能改变指纹，也可能是连接到了其他主机或有人冒充主机。

核对地址，并通过可信渠道确认变化原因。不能确认时，点击“取消”。不要删除旧指纹来跳过核对。确认新指纹可信后，才点击“更新主机密钥”。

### 选择主机并查看指令

1. 点击顶部导航中的“指令”。
2. 在“选择主机”中选择页面显示的主机。
3. 在“命令列表”中查看该主机已有的指令。

“孤儿命令”表示指令引用的主机已经不存在。这类指令无法执行。可以删除它，或通过导入时的主机绑定功能重新关联到有效主机。

### 新建或编辑指令

保存的指令会在远程主机上执行。创建前应先在目标主机上人工确认命令及权限，避免把删除、关机、重启或覆盖文件等操作配置成容易误触的指令。

1. 选择主机后点击“新建指令”。编辑现有指令时，点击该指令的编辑按钮。
2. 填写“指令 ID”。ID 必须唯一，只能使用字母、数字、下划线和连字符，且不能以下划线或连字符开头或结尾。
3. 填写“指令名称”和“SSH 命令”。多行命令每行填写一条。
4. 根据需要填写描述，并选择图标或 SD 卡中的图像。
5. 检查运行方式和输出匹配选项，然后点击“保存”。

名称帮助你辨认指令，ID 用于让自动化找到它。编辑现有指令时，ID 不能修改。要使用新 ID，请新建指令，并更新使用它的动作模板和数据源。

### 执行并查看结果

1. 点击指令卡片上的执行按钮。
2. 在“执行结果”中观察输出和状态。
3. 页面显示“取消”时，可以请求中断当前执行会话。随后查看状态和输出，确认是否已停止；已完成的远程操作不会撤销。
4. 点击“清除”移除当前结果显示。

“清除”不会撤销远程主机已经完成的操作。执行结果中的成功、失败、提取内容和最终状态取决于指令的匹配设置。

### 配置结果匹配

结果匹配用于把远程输出转换为容易判断的状态。

- “期望匹配”：输出包含指定文本时标记成功。
- “失败匹配”：输出包含指定文本时标记失败。
- “提取正则”：使用一个 `(.*)` 捕获组保存输出中的目标内容。
- “命中即停止”：匹配成功后终止仍在持续运行的命令。
- “超时 (秒)”：等待匹配结果的时间，以秒为单位。该设置仅在配置成功或失败匹配模式，或启用“命中即停止”时生效。
- “变量名”：保存状态和提取结果，供自动化页面选择。

成功和失败文本应选择稳定、明确的输出。过于宽泛的文字可能造成误判。保存后先执行一次并检查“匹配结果”，再把变量用于规则。

### 使用后台执行和服务模式

nohup 表示命令在远程主机后台继续运行，SSH 断开后仍可继续。后台任务不会因为关闭 WebUI 自动停止。

启用“后台运行 (nohup)”后，可以使用：

- “查看日志”：读取后台任务的当前日志。
- “实时跟踪”：持续刷新日志。
- “停止跟踪”：停止页面刷新，不停止远程任务。
- “检查进程”：查看后台任务是否仍在运行。
- “停止进程”：请求结束对应后台任务，随后检查进程状态。

“查看日志”或“检查进程”失败时，先阅读原因并检查主机连接。读取失败不等于日志没有内容，也不代表进程已经退出。恢复连接后再检查；不要因为检查失败而重新启动任务。

“服务模式”用于持续观察后台任务是否进入可用状态。启用后，必须填写“就绪匹配”和“变量名”；失败匹配和等待设置可按需要调整：

- “就绪匹配”：日志出现这些文字时标记为就绪，可用 `|` 分隔多个模式。
- “失败匹配”：日志出现这些文字时标记为失败。
- “就绪超时 (秒)”：等待就绪状态的最长时间，以秒为单位。
- “检测间隔 (毫秒)”：检查日志的间隔，1000 毫秒等于 1 秒。
- “变量名”：保存 checking、ready、timeout 等状态。

停止跟踪只结束页面的日志刷新，不停止远程进程。“停止进程”用于请求结束后台任务；操作后检查进程状态。服务模式任务还可能显示启动中、核验中、停止中或结果未确认。请求被接受后继续等待最终状态；状态未知时先核验，确认已停止后再启动。

### 导入和导出指令

- 点击指令的导出按钮，可以导出该指令，并按页面选项包含依赖的主机配置。
- 点击“导入指令”，选择 `.tscfg` 配置包，预览内容，并按需覆盖已有配置或绑定到页面显示的主机。

导入可能覆盖同 ID 配置，也可能包含远程主机信息。按安全指南检查包的来源和签名。页面要求重启时，先结束终端和自动化任务，再安排重启。

### 删除指令前检查哪些规则使用它

删除指令不会撤销远程主机已经完成的操作，也无法从指令页面撤销。删除前检查数据源、动作模板和规则是否仍需使用它。

- 服务还在运行或状态未知：点击指令的刷新图标，核验状态。需要停止时，停止服务并确认结果。正在启动、停止或核验，请等待完成。删除按钮不会停止远程任务。
- 服务已停止，仍无法删除：检查哪些导入规则还在使用这条指令。先调整这些规则，再删除。停止服务或自动化引擎，不会让规则停止使用这条指令。更换指令使用的主机或替换主机配置，也可能被阻止。
- 规则只读或等待重启：按第 12 章处理。不要删除 SD 文件来绕过保护。确认调整后的规则和连接正常，再清理不再需要的配置。

## 12. 自动化管理

“自动化”把数据和操作连接成可重复执行的流程。先建立数据源和动作模板，再用规则决定何时执行。

```text
自动执行：数据源 → 变量 → 规则判断 → 执行动作
手动执行：系统页快捷操作 → 执行动作
```

数据源读取数据，变量保存值，规则判断条件，动作模板定义任务。规则是否显示在设备面板、是否允许手动触发分别设置；自动规则也可以显示在面板中。

### 查看和控制自动化引擎

页面顶部显示引擎状态、规则数、变量数、数据源数、触发次数和运行时长。

| 操作 | 影响 |
| --- | --- |
| “启动” | 启动已停止的引擎，开始处理已启用规则。 |
| “暂停” | 暂停后续自动判断，已有动作可能继续。需要恢复时先停止，再启动。 |
| “停止” | 尝试停止规则判断、数据读取和后续动作安排，保留配置。等待确认；超时不表示已停止。 |
| “重载” | 重新读取已保存配置；原本运行的引擎加载后恢复运行。先保存编辑内容。有待重启规则时会被阻止，不能用它代替设备重启。 |

操作前检查是否影响散热、告警或其他持续任务。停止引擎不能代替停止远程后台进程；远程任务需要在“指令”或对应服务卡片中停止并确认。

### 完成一条最小自动化流程

1. 创建数据源，用测试功能确认连接及需要读取的字段。
2. 启用数据源，点击该行的“查看变量”图标，检查数值和更新时间。
3. 创建动作模板，检查参数后点击“测试”。测试会立即执行动作，先确认设备和远程主机允许本次操作。
4. 创建规则，暂时关闭“立即启用”，设置条件、冷却时间、动作顺序、延迟和重复方式。
5. 按需要设置“显示在面板”和“允许手动触发”。
6. 保存后再启用，观察变量、触发次数及实际结果。

### 管理数据源

点击“数据源”区域的“添加”，选择类型：

| 类型 | 用途 |
| --- | --- |
| “REST API” | 定期读取一个 HTTP 地址返回的数据。 |
| “WebSocket” | 接收持续连接推送的数据。 |
| “Socket.IO” | 接收 Socket.IO 服务的事件数据。 |
| “指令变量” | 读取已配置远程指令的结果。 |

1. 填写唯一 ID、显示标签和该类型要求的连接信息。
2. 使用测试功能确认连接。网络地址、认证和字段以数据提供方的信息为准。
3. 对前三种类型，从测试结果选择需要的数据字段。Socket.IO 事件名称留空时，测试可尝试发现事件。
4. 对“指令变量”，选择主机及已经配置变量名的指令，再设置检测间隔。
5. 保存、启用，然后用该行的“查看变量”检查结果。

数据源行提供启用开关、查看变量、导出和删除。停用或删除前，检查哪些规则还在使用它，以免影响任务。

导入和导出使用配置包。导入前预览 ID、类型及覆盖内容，按安全指南检查来源和信任要求。

### 查看变量

点击数据源行的眼睛图标“查看变量”，在弹窗中查看名称、类型、值和更新时间。远程指令也可从其变量入口查看结果。

- 确认名称和数据源正确，值与类型适合规则比较。
- 检查更新时间是否符合预期。窗口中的时间用于判断数据是否仍在更新。
- 没有数据时，检查数据源是否启用，再测试连接和字段选择；远程指令变量还需检查对应指令的执行结果。

### 创建和测试动作模板

点击“动作模板”区域的“添加”，选择任务类型：

| 类型 | 作用 |
| --- | --- |
| “CLI 命令” | 执行设备本地控制台命令。 |
| “SSH 命令” | 执行“指令”页已保存的远程指令。 |
| “LED 控制” | 控制 LED 的颜色、动画或矩阵内容。 |
| “日志记录” | 按指定级别写入日志。 |
| “设置变量” | 为自动化变量赋值。 |
| “Webhook” | 页面保留此选项，但当前动作执行功能尚未实现，不能用于发送请求。 |

填写唯一 ID、名称和当前类型要求的参数，可设置执行延迟与“异步执行”。异步操作在后台继续，提交后还需通过日志、变量或目标设备检查最终结果。

- CLI：填写命令行，可按需要设置结果变量和超时。
- SSH：选择已配置主机和指令，并核对预览。
- LED：选择设备和支持的功能，填写颜色、动画、亮度、文本、图像、QR 码或滤镜参数。
- 日志：选择级别并填写消息，可引用变量。
- 设置变量：填写变量名和值。
- Webhook：当前暂不可用，请选择其他已支持的动作。含 Webhook 的规则包也不能导入。

“测试”会执行动作。涉及断电、重启、远程命令或外部请求时，先确认影响，再测试。

编辑后保存，再检查参数。保存失败，请保留草稿并按提示修正。导入可能覆盖已有模板；删除前检查哪些规则还在使用它。关联服务尚未确认停止，请先核验；需要停止时，停止后再确认。

### 按提示处理动作模板删除

看到“无法删除动作模板”时，先阅读阻止原因，本次模板没有被删除：

1. 提示规则还在使用模板：点击“查看规则”。先从这些规则中移除模板，或删除不再需要且允许删除的规则，再删除模板。停用规则或停止引擎，不会从规则里移除模板。
2. 提示服务尚未停止：点击“查看指令”。核验状态，停止服务并确认结果，再回来删除。
3. 提示配置正在更新或加载：等待完成。提示需要恢复或无法检查使用关系：在“终端”打开“系统日志”，查看原因并恢复配置。不要反复点击删除。

只读导入规则不能直接编辑。请配置提供方调整规则包，移除不再需要的模板。

保存规则时，若提示某个模板已不存在，本次保存没有成功。重新选择已有模板，核对后再保存。

### 创建规则

1. 点击“规则列表”区域的“添加”，填写唯一规则 ID、名称和图标。
2. 选择“条件逻辑”：AND 表示所有条件都满足；OR 表示任一条件满足。
3. 设置“冷却时间”，限制自动触发的频率。页面单位为 ms，1000 ms 等于 1 秒。
4. 添加条件，选择变量、比较方式和值。支持等于、不等于、大于、大于等于、小于、小于等于、值变化和包含；比较值的类型应与变量相符。
5. 添加动作模板，并设置顺序所需的延迟、重复和动作条件。
6. 决定是否开启“显示在面板”及“允许手动触发”。前者控制系统页是否出现卡片，后者控制能否手动运行。
7. 检查后保存，再启用。初次配置可先关闭“立即启用”。

保存、启用或停用后，若提示“备用副本未同步”，本次操作已经成功，但备用副本还未同步。这不是保存失败，也不表示必须重启。不要移除或更换 SD 卡。刷新规则列表，确认内容和启用状态；不要重复创建规则。提示持续出现时，在“终端”打开“系统日志”检查存储问题。

比较值要符合所选类型。数字填写具体数值，不要填写无穷大或 NaN（无效数字）。文本、布尔值（真或假）和空值按对应类型填写。不要把整段 JSON 对象或数组作为比较值。页面报错时，检查变量、比较方式和值，修正后再保存。

### 配置动作重复和执行条件

| 方式 | 含义 |
| --- | --- |
| “单次” | 每次触发执行一次。 |
| “条件持续时重复” | 按单个动作的条件重复，每轮最多 100 次。 |
| “指定次数” | 按设置次数和间隔重复；每次执行前仍检查动作条件。 |

动作条件与规则触发条件分别设置。“条件持续时重复”未设置动作条件时，会重复到每轮上限；规则以后仍可能再次触发。

停用规则会阻止新的触发，已经开始的一轮动作可能继续。要停止安排后续动作，点击引擎“停止”并等待确认。已发出的动作和远程进程仍需检查；完成的操作不会撤销。

### 创建快捷操作

“仅手动触发”“显示在面板”“允许手动触发”分别决定是否只手动运行、是否显示卡片、是否允许用户执行。

1. 填写规则 ID、名称和图标，开启“仅手动触发”。这种规则不需要自动触发条件。
2. 添加动作模板，检查延迟、重复及动作条件。
3. 开启“显示在面板”和“允许手动触发”，保存并启用规则。
4. 返回“系统”的设备面板，确认卡片名称和状态，再执行一次并检查结果。

自动规则也可显示在面板；显示卡片不会把它改成仅手动运行。停用规则仍可能显示卡片，但不能启动。面向 admin 提供操作时，名称应让用户知道会发生什么，并提供适用的日志或停止方式。

### 导入规则配置包

规则配置包请从“自动化”导入，不要用安全页“仅验证”或文件上传代替。此入口会检查签发方是否可信、包是否属于本设备，以及规则需要的配置是否齐全。其他配置包不能套用这个验证结果。

导入前准备好以下内容：

- SD 卡已挂载且可写。规则包保存在卡中；导入后保留这张卡，不要在待重启时拔出或换卡。
- 设备已安装有效证书、匹配的私钥和 CA 链，时间已确认。CA 链用于核验证书来源，安装方法见安全指南。
- 部署管理员已指定可信签发方。root 登录或安装 HTTPS 证书不等于完成这项设置；缺少时请部署管理员处理。
- 规则使用的动作模板、指令和主机已经准备好。导入不会自动补齐这些配置。缺少哪项，先补齐哪项。规则已启用时，还要核对所用配置的启用状态。

重启会中断 WebUI 和设备管理服务。先检查规则是否已启用、是否会自动执行。确认重启后可以运行，再导入；暂不运行时，请配置提供方提供禁用版本。重启 TianshanOS 不会结束远程主机上的后台进程。

1. 在“规则列表”点击导入图标，打开“导入规则配置”，选择 `.tscfg` 文件。页面会开始验证并显示预览。
2. 等待“来源、目标设备和规则内容已验证。”；核对名称、规则 ID 和“规则摘要”。在“查看规则内容”中检查条件、动作、目标和启用状态，不要只看文件名。
3. 已有同 ID 配置，先阅读“覆盖影响”。确定要替换已保存版本，才勾选“覆盖已存在的配置”。预览后文件、凭证或配置有变化，请重新选择文件并验证。
4. 点击“确认导入”，等待结果。显示“已保存，重启后生效；当前运行版本未改变。”时，表示保存已确认，不表示新版已经运行。若提示当前运行版本已是这一版，则不需要为这次重复导入再次重启。
5. 需要重启时，保存其他工作、检查自动化和远程任务，再从“系统”页重启 TianshanOS。保留原 SD 卡并等待 WebUI 恢复。
6. 回到“自动化”，确认规则的待重启提示已消失。检查启用状态、所需变量和日志。规则允许手动执行且能安全检查时，再执行一次并检查目标设备或远程主机的结果。不能手动执行的规则，观察正常触发后的日志和结果。不能只看保存成功提示。

导入的规则包为只读，不能直接编辑、启停或删除。要调整规则，请配置提供方重新签发本设备的规则包，再按本节导入。要停用规则，请取得禁用版本，并按提示重启；重启前旧版仍可能运行。

引擎“停止”可以停止安排后续动作，但不会修改规则或撤销已完成的操作。远程后台任务仍需单独停止并确认。

修改或导入后，检查引擎、规则和任务结果。按提示重载或重启，再确认任务正常。只读和待重启规则的限制见下表。

### 分清已保存版本与正在运行的版本

| 页面提示或状态 | 如何处理 |
| --- | --- |
| “已保存，待重启” | 新配置已保存，但尚未切换。普通编辑、启停和删除暂不可用；先安排设备重启。 |
| 更新前已有运行版本 | 重启前仍可能执行旧规则。手动按钮提示“执行正在使用的旧版本”；执行前确认旧任务的影响。导出按钮导出正在使用的版本，不是待重启的新包。 |
| 新规则尚未加载 | 不能手动执行。重启后检查启用状态和手动权限。 |
| “已保存删除，待重启移除” | 重启后才会从运行列表移除。不能再手动或自动触发新一轮；已发出的动作和远程任务仍需检查。重启后确认规则已移除。 |
| 只读规则 | 即使待重启提示已消失，也不能普通编辑、启停或删除。按上一节取得并导入调整后的包。 |

不是所有保存都需要重启。可编辑规则新建、修改或启停成功后，当前规则就会更新。请检查操作结果和规则状态。

有规则等待重启时，“重载”不可用。停止再启动引擎也不能切换这些版本；需要重启设备。

### 导入未完成时怎么办

#### 验证未通过

| 提示内容 | 下一步 |
| --- | --- |
| 签发信任根未指定、签名者不可信或无签发权限 | 请部署管理员或配置提供方核对签发来源和证书权限；不要用安全页“仅验证”代替或关闭检查。 |
| 此包属于另一台设备 | 请提供方用本设备证书重新导出，不要改包内设备名称。更换本设备证书前，安排匹配的新包。 |
| 设备时间尚未确认 | 在“系统”的“网络与时间”确认时间并同步，再重新验证。 |
| 配置正在加载 | 等待完成，再重新验证。 |
| 配置加载失败 | 查看系统日志，处理原因并恢复配置，再重新验证。 |
| 规则需要的配置缺失 | 补齐页面指出的动作模板、指令或主机，再重新验证。 |
| 规则需要的配置已禁用 | 核对是否应启用这些配置。确认允许执行后，启用并重新验证。 |
| 绑定服务仍在运行或状态未确认 | 在“指令”页核验服务，按需停止并确认结果；启动、停止或核验未结束时先等待，再重新选择文件验证。 |
| 不支持包中的动作 | 请配置提供方调整。当前规则包导入不支持 Webhook；模板选择器有此选项不代表可以导入。 |
| 预览后文件、凭证或配置发生变化 | 重新选择文件并验证，重新核对覆盖影响后再确认。 |

#### 保存未完成

| 提示内容 | 下一步 |
| --- | --- |
| SD 卡不可用 | 检查卡是否插好、已挂载且可写，再重新验证。 |
| 配置来源只读 | 恢复可写来源。不要删除文件来绕过保护。 |
| 未能可靠保存 | 检查存储状态，解决问题后重新验证。 |
| 保存结果尚未确认 | 刷新列表，核对规则和待重启状态；仍无法确认时查系统日志。保留原文件，不要重复导入。 |

条件变量暂时没有采样值，不一定是缺少配置；请检查它何时更新。页面提示旧存储对象尚待清理时，保留 SD 卡，重启后核对。

### 维护规则和配置

- 手动执行要求规则已启用且允许手动触发，并且没有正在执行的同一规则。它不等待自动条件，也不受自动触发冷却时间限制；动作条件、延迟和重复仍生效。
- 停用规则不会撤销已完成的动作；删除也不能从页面撤销。
- 编辑前检查哪些规则使用了这些数据源、模板和指令。关联服务还在运行、状态未知或操作未结束，请先核验或停止服务。规则仍在使用某项配置时，还需调整规则；停止服务不等于解除这种使用关系。
- 导入规则按本章的专用流程处理；其他配置包仍按安全指南核对，不能套用规则包的验证结果。
- 保存失败时查看提示并保留草稿；保存已成功但列表刷新失败时，先刷新核对，不要直接重复创建。

# TianshanOS Root Operations Guide

This guide is based on TianshanOS 0.6.2. It can still be used with later versions where features and steps remain unchanged. If controls, messages, or results differ, check the guidance for your installed version.

This guide covers routine functions in Part I and terminal access, remote commands, and Automation in Part II. Root operations can affect the device and remote hosts; check the target and active tasks before proceeding. See the separate Security Guide for security management.

Use the controls shown on your device. Some need specific hardware or configuration. On a computer, hover over an icon button to see its name.

## Part I: Routine Functions

## 1. Getting Started

### Open the WebUI

1. Open the device’s web interface (WebUI) using the address provided by your administrator.
2. Select “Login” in the upper-right corner.
3. Enter `root` and the root password supplied with the device.
4. Select “Login.” After a successful login, the current username appears in the upper-right corner.

Logging in with the default password opens a “Security Reminder.” Enter the current password, then enter the new password twice and select “Change Now.” Both new-password entries must match. Select “Later” to close the reminder.

When you have finished, select “Logout” in the upper-right corner. You will need to sign in again to use the device.

### Switch Languages

Select the language button at the top of the page, then choose Chinese or English. Page content and control labels switch immediately.

### Page Navigation

Root users can access these pages:

- “System”: View device status, control modules, fans, and LEDs, and open OTA Update.
- “Network”: Check Ethernet status and DHCP clients, configure WiFi, and manage NAT forwarding.
- “Files”: Manage files on the SD Card and SPIFFS.
- “Terminal”: Run device commands and view system logs.
- “Commands”: Manage and run remote SSH commands.
- “Automation”: Configure sources, rules, and templates.
- “Security”: Open the separate security management page. See the Security Guide for instructions.

## 2. System Status and Routine Operations

Select “System” in the top navigation.

### View Resource and Service Status

“Management Chip Resources” shows CPU, DRAM, and PSRAM usage on the management chip. These readings do not show resource usage on AGX or LPMU.

- Select “Details” to view total, used, and free memory and other memory information.
- “Services” shows the number of running services and the total. Select it to view each service’s state and startup stage.
- If a service reports a problem, refresh its status. To restart it, follow “Restart One Service” below.

### View System and Power Information

“System Overview” shows the chip, firmware version, ESP-IDF version, and uptime. For routine use, check the firmware version. ESP-IDF is the version of the system framework used by the device.

The right side of the card shows input voltage, internal voltage, current, power, and protection status.

The switch beside the protection status enables or disables low-voltage protection. When enabled, the device uses the saved voltages and delays to shut down at low voltage and restart after power recovers.

### View Network and Time

“Network & Time” shows Ethernet, WiFi, IP address, current time, sync status, time source, and timezone.

- Select “Sync Time” to copy the browser's current time to the device.
- Select “Timezone,” choose a preset or enter a supported timezone setting, then save.
- Select “OTA Update” to open the firmware update page.

### Advanced Operations

#### Reboot TianshanOS

A reboot temporarily interrupts the WebUI and device management. Finish active operations, then select “Reboot” and confirm. Wait for the device to recover, then reopen the WebUI.

#### Restart One Service

Restarting a service temporarily interrupts the function it provides. Open “Service Status,” find the affected service, and select “Reboot” on that row. Check its status again when the operation finishes.

#### Change Shutdown Settings

These settings control when the device shuts down after a voltage drop and when it starts again after power recovers. Use values that match your device’s power requirements.

Select “Shutdown Settings” to change:

- “Low Voltage Threshold”: Starts the shutdown countdown below this voltage.
- “Recovery voltage threshold”: Starts recovery above this voltage.
- “Shutdown Countdown”: Sets the delay before shutdown after low voltage is detected.
- “Recovery hold time”: Sets the wait time used to confirm stable power recovery.
- “Fan Stop Delay”: Sets the delay before fans stop after shutdown.

Save the form to apply the updated protection settings.

#### Switch the Top USB Target

Switching the USB target may temporarily disconnect an attached device. Confirm the target and finish active work before continuing.

Devices that support USB switching show a “USB” button. Each click switches the top USB port to the next target: ESP, AGX, then LPMU. Check the target shown on the button and the page message to confirm the result.

## 3. Device Panel

The “Device Panel” is on the “System” page. It contains module power controls, Quick Actions, and data widgets.

### Control AGX and LPMU

Save work on the module and complete its normal shutdown process before removing power. Forced power-off can cause loss of unsaved data.

- “AGX Power” shows the power-control state. Select it to switch power on or off, then wait for confirmation.
- “LPMU Power” shows “Online,” “Offline,” or “Unknown.” These states come from a network check. Online means the module is reachable; offline means it is not. Neither state alone confirms whether the module is powered on or off.
- Selecting the LPMU button triggers the same action as pressing its physical power button. Wait for the check and the displayed result. If the result is unknown, check the module and network before pressing the button again.

### Use Quick Actions

A root user configures Quick Action cards. Card visibility and manual execution are separate settings. Seeing a card does not mean you can start its task.

1. Check the card’s name, state, and available controls to identify the task.
2. Select an available card and wait for its state to update. Do not start it again while it is processing.
3. Background tasks may provide log, status-verification, or stop controls. Read the log to see task output. After selecting stop, check that the task has stopped.
4. If the state is unknown or starting is blocked, use the available verification control, or check the rule, remote command, and host connection as described in Chapters 11 and 12.

If starting is blocked, follow the reason shown. Do not keep selecting start:

- Rule disabled or manual triggering not allowed: Check the rule settings on “Automation” (Chapter 12). A visible card is not permission to run it.
- Task executing, starting, verifying, or stopping: Wait for the state to update.
- Linked service already running: Do not start it again. To restart it, stop it first and confirm the result.
- Service not confirmed stopped: Verify its state. If it remains unclear, check the host connection on “Security” (Chapter 11).
- Rule not loaded or awaiting removal after restart: Check the rule version and pending-restart message on “Automation” (Chapter 12).
- Automation not accepting start requests: Check the engine and configuration state on “Automation.” Follow the message; check active tasks before restarting the device.

Confirm that a service has stopped before restarting it. An accepted start or stop request may still be in progress; wait for the final state. After triggering one action, wait a few seconds before starting another.

Press and hold a card until the reorder indicator appears, then drag it to change the display order.

If no cards are available, check which message the page shows:

- “Loading quick actions”: Wait for configuration to finish loading. If the message persists, select “Go to Automation” and check System Logs in Terminal.
- “Quick actions unavailable”: Select “Go to Automation” to check status. Open “System Logs” on Terminal to find the cause. Restore configuration before using the cards; do not keep selecting start.
- No configured Quick Actions: Select “Go to Automation” to create a rule or check an existing rule’s “Show on panel” setting.

After importing a rule package, a card may still run the old task until the device restarts. Newly imported rules or rules awaiting removal may not start. If a task was recently changed, check the running version in the rule list before using it.

Do not restart a device providing active services just to restore a card.

### Manage Data Widgets

Data widgets continuously display device data in the “Device Panel.”

1. Select “Widget Manager.”
2. Choose a refresh interval or disable automatic refresh.
3. Add a preset widget, or choose a component style and data source offered by the page.
4. Edit its label, display style, and unit as needed, then save.

Existing widgets can be edited, deleted, and reordered. You can also select a widget card to edit it. Press and hold a widget, then drag it to a new position.

## 4. Fan Management

“Fan Control” is on the “System” page. Fan cards show the fans provided by your device. Check the fan number before changing a curve.

### View Fan Status

The status bar shows “Effective Temp” and “Current output.” The large percentage is the control setting confirmed by the device, not the measured speed. RPM is the measured speed in revolutions per minute and is hidden without a valid reading. A large `--` means the current output is unconfirmed.

While you drag the manual slider, the value beside it shows the proposed setting. The large percentage continues to show the current output. Release the slider, then check the message and updated reading to confirm the change. If a requested setting differs from the current output, do not assume it has already taken effect.

Smart mode shows its operating state, such as “Smart Mode,” “Following curve,” protection, or an invalid temperature. It also provides a safety reference, a 45-second forecast, and the rate of temperature change.

If the temperature becomes invalid, check that its source is still updating. The device switches to protective control for temperature loss. Select “TTI” for an explanation of Smart thermal control.

Use the refresh button in the section header to fetch the current state. If adjustment fails or the output is unconfirmed, check the device before deciding whether to retry.

### Select an Operating Mode

| Mode | Purpose |
| --- | --- |
| “Off” | Stops the fan. |
| “Manual” | Uses a fixed control percentage set with the 0-100% slider. |
| “Curve” | Follows the configured temperature-to-control-percentage curve. |
| “Smart” | Uses the base curve, temperature trends, and past adjustments to control cooling. Uses protective control when needed. |

Stopping a fan or setting a low manual value reduces cooling. Check the load and temperature first, and keep monitoring them. The slider is available only in Manual mode when the current output is confirmed.

### Configure a Fan Curve

Select “Curve” in the Fan Control section header to open “Fan Curve Management.” The “Curve” button inside a card only changes the operating mode.

1. Under “Fan,” choose the number to adjust and check it against the System page.
2. Under “Temperature variable binding,” add temperature variables and assign weights.
3. Select “Bind.” The temperature source is shared by fans in Curve and Smart modes, so changing it affects the fans using that source.
4. Add or edit “Curve nodes.” Each curve needs at least 2 nodes and supports up to 10.
5. Set “Minimum speed” and “Maximum speed” as control percentages. The minimum must not exceed the maximum.
6. Set “Temperature hysteresis” and “Minimum interval.” Hysteresis accepts 0-20°C and reduces frequent adjustments caused by small temperature changes. The interval accepts 500-30000 ms; 1000 ms is 1 second.
7. Select “Save curve.” After a successful save, the selected fan switches to Curve mode. To use Smart thermal control, return to the card and select “Smart.”

If saving fails, read the message and check the current state before retrying. After unbinding temperature variables, check the effective temperature and fan state as well.

### Import and Export a Curve

- Select “Import Config” and choose a curve JSON file. JSON is the file format used to store curve data. Review the nodes, limits, and fan number, then select “Save curve” to apply them.
- Select “Export Config” to download the current curve. The page also attempts to save a copy under `/sdcard/config` on the SD card. Check the browser download and the reported SD-card result separately.

### Use a Test Temperature

A test temperature temporarily replaces the normal source and affects Curve or Smart control. Monitor the fan and device throughout the test.

1. Enter 0-100°C under “Test Temp.”
2. Select “Test” and observe the current output, state, and fan response.
3. Select “Clear Test” when finished. Check that the effective temperature has returned to its normal source.

## 5. LED Management

“LED Control” is on the “System” page and shows the LEDs provided by the device. Available features vary by LED.

### Routine Controls

- Use the light-bulb button at the bottom of a card to turn the LED on or off.
- Move the “Brightness” slider, or choose a color or preset.
- Use the animation button to open “LED Settings.” Select an animation under “Programmatic Animation,” then use its play or stop control.
- Select the save icon at the bottom right of the card to save the current LED configuration.
- Select “All Off” to turn off all LEDs and check the reported result. If some fail, check those devices.

### Advanced LED Matrix Features

Matrix cards provide icons for the available features. Open one, then switch between these groups in “LED Settings”:

- “Programmatic Animation”: Select and run an animation.
- “Image/QR Code”: Choose an image from the SD card or enter content for a QR code.
- “Text Display”: Set text, font, alignment, scrolling, foreground, and background.
- “Post-processing Filter”: Choose a filter and parameters, then apply or stop it.
- “Color Correction”: Adjust the display and use the available reset, import, or export controls.

Check the actual light or matrix display after applying a change. Use only the features shown. If a setting fails, follow the message to check the file, input, or device state.

## 6. Network Management

Select “Network” in the top navigation to open “Network Settings.” Changing the network mode, hotspot, or NAT settings may interrupt the current WebUI connection. Before saving, make sure you can reconnect through the new network address.

### View Network Status

The top of the page shows the state of Ethernet, the WiFi client, and the WiFi AP. Open the related panel to view IP address, subnet mask, gateway, DNS, MAC address, SSID, signal, and connected-device counts when available.

The Ethernet panel displays the current link and address information. It does not provide address editing controls.

### Select a WiFi Mode

| Mode | Purpose |
| --- | --- |
| “Off” | Turns WiFi off. |
| “Station (STA)” | Connects the device to an existing WiFi network. |
| “Access Point (AP)” | Makes the device provide a WiFi hotspot. |
| “STA+AP” | Connects to an existing WiFi network while keeping the device hotspot available. |

After choosing a mode, wait for the page to refresh the state. The current wireless connection may be interrupted during the switch.

### Connect to WiFi

1. Set the WiFi mode to “Station (STA)” or “STA+AP.”
2. Under “Station,” select “Scan.”
3. Choose a network from the list. The list shows SSID, signal strength, channel, and authentication type.
4. Enter the password and confirm. Leave the password blank for an open network.
5. Wait for the state to change to “Connected,” then confirm the new IP address.

Select “Disconnect” to end the current WiFi client connection.

### Configure the WiFi AP

1. Set the WiFi mode to “Access Point (AP)” or “STA+AP.”
2. Under “Hotspot,” select “Config.”
3. Enter the SSID. A blank password creates an open hotspot; a protected hotspot requires at least 8 characters.
4. Select a channel and enable “Hide SSID” if needed.
5. Select “Apply” and wait for the hotspot state to update.

Select “Devices” to view clients currently connected to the hotspot.

### Set the Hostname

Enter a new name in the “Hostname” section under “Network Services,” then select “Set.” The page shows the current hostname after it updates.

### View DHCP Clients

DHCP automatically assigns network addresses to connected devices. Select “Clients,” choose “WiFi AP” or “Ethernet,” and view the current leases. Use the refresh button to reload the list.

### Advanced Network Operations

#### Configure the NAT Gateway

NAT forwards network traffic between the device's network interfaces. Enable or disable NAT, then select “Save” to retain the setting. Check the WiFi and Ethernet status afterward.

#### Access the Upstream Network via LPMU

This operation uses the configured LPMU host to set up network access. Before starting, confirm that LPMU is reachable and the network cables are connected. Obtain the sudo password for the SSH account on that host. This password authorizes system changes and may differ from the WebUI password.

1. Under “Upstream Network Access,” select “Access via LPMU.”
2. Enter the LPMU sudo password and select the access button. The password is used only for this run and is not saved; enter it again for a later run.
3. Wait for the operation to finish. Do not start it again while processing.
4. Access is confirmed only when the result reports both an internet connection and completed network configuration.
5. If it fails or the result is unconfirmed, read the reason first. Expand “Execution Log” for more detail. Check the password for a password error, or the cabling and upstream network if no internet connection is found.

A failed status request does not mean the script has stopped. Use the available “Refresh Status” control to check the current run before deciding whether to try again.

## 7. File Management

Select “Files” in the top navigation to open “File Manager.”

The SD Card is removable storage, and SPIFFS is internal device file storage. Select “SD Card” or “SPIFFS” to switch locations. The path at the top shows your current folder. Select a folder name in the path to go back to it.

### Browse and Manage Files

- Select a folder name to open it.
- Select the download button beside a file to save it to the browser's download location.
- Select the rename button, enter a new name, and confirm.
- Select “New Folder,” enter a folder name, and create it.
- Select the refresh button to reload the current directory and storage state.

### Upload Files

Files can only be uploaded to the SD Card, not SPIFFS. Confirm that the SD Card is mounted first.

1. Select “SD Card” and open the folder where you want to upload the files.
2. Select “Upload Files.”
3. Select one or more files, or drag files into the upload area.
4. Review the upload list and remove unwanted files.
5. Select “Upload” and wait for each file to show completion.

Uploading a `.tscfg` package opens verification and application steps. However, this file-upload page does not yet apply the package's settings. Successful upload or verification does not mean the settings are in effect.

Import rule packages on Automation, as described in Chapter 12. Ordinary file upload is not a substitute for rule import. See the Security Guide for source and signature guidance for other packages.

### Batch Operations

After selecting files or folders, the batch toolbar appears.

- “Batch Download” downloads selected files. Folders are not included.
- “Batch Delete” deletes selected files and folders.
- “Clear Selection” clears the current selection.

### Delete a File or Folder

Deletion cannot be undone in the WebUI. Deleting a folder also deletes all of its contents. Confirm the name and path before selecting “Delete” or “Batch Delete” and approving the prompt.

### Mount and Unmount the SD Card

Unmounting makes SD files temporarily unavailable. Finish uploads, downloads, and other file operations, then select “Unmount SD.”

Removing or replacing a card that stores Automation configuration may prevent it from loading after restart. Confirm that configuration and running tasks allow unmounting. Do not unmount or remove the card when the page tells you to keep it installed.

When the SD Card is not mounted, the page shows “Mount SD.” Select it, wait for the state to change to “Mounted,” then open the SD Card directory again.

## 8. OTA Updates

On the “System” page, select “OTA Update” in the “Network & Time” section to open “Firmware Upgrade.”

The device reboots during an update, temporarily disconnecting the WebUI. Save active work and keep device power stable before starting. Do not power off the device while update progress is incomplete.

### Check for Updates from an OTA Server

1. Review the “Current Version.”
2. Enter the OTA server address supplied by an administrator or publisher.
3. Select “Save,” then select “Check Update.”
4. The page reports “Update Available,” “Already up to date,” an older server version, or an error.
5. Confirm the target version, then select “Upgrade Now” or the upgrade control shown by the page.
6. Wait for download, installation, and reboot to finish. To cancel, use the “Abort” button when it is available. Not every stage supports cancellation.
7. Reconnect to the WebUI after the device comes back online and verify “Current Version.”

When “Also upgrade www” is enabled, the firmware and WebUI are updated in sequence. For 0.6.2, use the matched main firmware and WebUI resources supplied by the publisher, both from the same release. If the old interface remains after upgrading, force-refresh the browser and check the version and page again.

### Manual Upgrade

Expand “Manual Upgrade” and choose one of these methods:

- “Upgrade from URL”: Enter the firmware URL, set “Also upgrade www” according to the release instructions, then select “Upgrade.” Here, www refers to the device’s web-interface resources.
- “Upgrade from SD Card”: Enter a firmware path such as `/sdcard/firmware.bin`. If “Also upgrade www” is enabled, ensure that `www.bin` from the same release is in that directory.

For an upgrade from a URL, “Skip certificate check” skips verification of the HTTPS server certificate. This removes the certificate check used to confirm the download server’s identity. Leave it unchecked for routine updates. If you see a certificate error, ask your administrator to check the server address and certificate.

### Partition Management and Rollback

“Partition Management” shows the running partition and other available partitions.

- “Mark Valid” confirms the running version and disables automatic rollback protection for that version. Use it after confirming that the current version operates correctly.
- “Rollback to This Version” selects another bootable version and switches through a reboot. Rollback interrupts current services. Confirm the target version and data compatibility first.

After the operation and reboot complete, reopen the WebUI and verify the current version and device state.

Version 0.6.2 changes how Automation configurations are saved. Before returning to older firmware, check whether it can read these configurations, consulting the device provider if needed, and prepare a backup and recovery method.

Rollback changes the firmware, not the configuration format. Existing rules may no longer work after a downgrade.

## 9. Security Management Entry

Select “Security” in the top navigation to open security management. Use the TianshanOS Security Guide for SSH keys, remote hosts, known-host fingerprints, HTTPS certificates, configuration packages, and account management. These procedures are not repeated here.

### Failed or Unconfirmed Operations

Forms may mark a field in red and show an error beside it. Correct that field as instructed, then save. A cleared error mark does not confirm a successful save; check the save message and list too.

Check which operation failed, then read the reason and next step. If the message gives no reason, do not guess.

If “Details” is available, select it to see more information. Select “Hide” to hide the details. If a × button is shown, select it to dismiss the message. For further checks, keep a record of the message and details, then open “System Logs” on Terminal to investigate.

If the result is unconfirmed, refresh and check the device, file, or task state. A timeout or lost connection does not mean the operation failed to run. Do not immediately repeat power, delete, task-start, or upgrade operations. If the result remains unclear, open “System Logs” on Terminal to investigate.

For batch actions, check successful, failed, and unconfirmed items separately. Confirm downloaded files in the browser’s download list.

## Part II: Root-only Functions

## 10. Terminal and System Logs

“Terminal” is shown only to root. It can run device console commands directly and display device logs. A command may change device state immediately. Confirm its source, parameters, and impact before entering it.

### Connect to and Use Terminal

1. Select “Terminal” in the top navigation.
2. Wait for “Connected to device” and the `tianshan>` prompt.
3. Enter `help` to view the commands provided by the current firmware.
4. Enter a command and press Enter. Wait for its output to finish and the prompt to return.

Input is not executed while the page shows “Not connected to device.” After a disconnect, wait for the reconnection message before submitting a command again to avoid duplicate execution.

Terminal supports these keyboard controls:

| Control | Purpose |
| --- | --- |
| Ctrl+C | Clear the current input and request an interrupt. The command must support interruption for it to stop. |
| Ctrl+L | Clear the screen. |
| ↑ / ↓ | Browse command history from the current page session. |
| ← / → | Move the cursor within the current input. |

“Clear” at the top of the page only clears the display. It does not undo commands that have already run. “Disconnect” ends the current Terminal connection.

### Open a Remote SSH Shell

An SSH Shell sends subsequent keyboard input to a remote host. Confirm the target address, user, and authentication method, and complete the SSH preparation described in the Security Guide before connecting.

1. Enter `ssh --help` to view the SSH command options.
2. Enter `ssh --host <host> --user <user> --shell`, replacing each placeholder, including its angle brackets, with the actual value. To specify a port, add `--port <port>` before --shell.
3. Wait for the remote connection confirmation before entering remote commands.
4. Press Ctrl+\ to leave the SSH Shell and return to the tianshan> prompt.

Do not enter plaintext credentials while the terminal is being shared, recorded, or viewed by another person.

### View System Logs

Select “System Logs” at the top of Terminal to open the log window.

- “Level” sets the minimum displayed level. Use ERROR, WARN+, INFO+, or DEBUG+ to narrow the output.
- “TAG” filters by log source.
- “Search” filters the current logs by keyword.
- “Auto Scroll” follows new log entries when enabled.
- The refresh button reloads historical logs.
- The clear button clears only the logs currently shown in the window.

If filtering produces no output, clear TAG and Search first, then change Level. Closing the log window does not stop device services.

## 11. Manage and Run Remote Commands

“Commands” stores reusable SSH commands and runs them on a selected remote host. Remote hosts and their authentication information are managed on the “Security” page. See the Security Guide for those procedures.

### Check the Host Fingerprint Before Connecting

A fingerprint helps identify the host you are connecting to. These steps apply to SSH host tests on the web “Security” page, not to the Terminal SSH Shell confirmation flow. If the message says that the fingerprint is unregistered or has changed, do not keep executing the command. Open “Security,” find the target SSH host, and select “Test.”

For a first connection, the confirmation dialog shows the host address and fingerprint. Check them with the host administrator through a trusted channel. Select “Trust & connect” only after confirming a match.

If the fingerprint has changed, the dialog shows both the stored and current fingerprints, with “Cancel” selected by default. Reinstalling the host can change its fingerprint, but a change may also mean that you have reached another host or an impersonator.

Check the address and confirm the reason through a trusted channel. Select “Cancel” if you cannot confirm it. Do not delete the old fingerprint to skip this check. Select “Update Host Key” only after confirming that the new fingerprint is trusted.

### Select a Host and View Commands

1. Select “Commands” in the top navigation.
2. Choose a host currently shown under “Select Host.”
3. Review its saved items under “Command List.”

“Orphan Commands” reference hosts that no longer exist and cannot be executed. Delete an orphan command, or use the host binding option during import to associate it with a valid host.

### Create or Edit a Command

A saved command runs on a remote host. Verify the command and required permissions on that host before saving it. Take extra care with commands that delete data, shut down or restart a host, or overwrite files.

1. Select a host, then select “New Command.” Use the edit button on an existing command to change it.
2. Enter a unique “Command ID.” It may contain letters, numbers, underscores, and hyphens, and cannot begin or end with an underscore or hyphen.
3. Enter “Command Name” and “Command.” Put each command on a separate line when using multiple lines.
4. Add a description and choose an icon or an image from the SD Card if needed.
5. Review the run mode and output-matching options, then select “Save.”

The name helps you recognize a command; Automation uses its ID to find it. You cannot change an existing command's ID. To use a new ID, create a command and update the templates and sources that use it.

### Execute a Command and Review the Result

1. Select the execute control on a command card.
2. Watch the output and status under “Execution Result.”
3. When “Cancel” is shown, use it to request interruption of the current session. Check the state and output to confirm whether it stopped. Completed remote operations are not undone.
4. Select “Clear” to remove the current result display.

“Clear” does not undo work already completed on the remote host. Success, failure, extracted content, and final status depend on the command's matching settings.

### Configure Result Matching

Result matching converts remote output into a status that is easier to use.

- “Expected match”: Marks the result successful when the output contains the configured text.
- “Fail Match”: Marks the result failed when the output contains the configured text.
- “Extract regex”: Uses one `(.*)` capture group to save selected output.
- “Stop on match”: Ends a continuing command after a successful match.
- “Timeout (s)”: Sets how long to wait for a match, in seconds. It applies only when a success or failure pattern is set, or “Stop on match” is enabled.
- “Variable Name”: Saves status and extracted output for use on the Automation page.

Choose stable, specific success and failure text. Broad text can produce incorrect matches. Execute the command once and review “Match Results” before using its variables in a rule.

### Use Background Execution and Service Mode

nohup means a command continues to run in the remote host's background after the SSH connection closes. Closing the WebUI does not stop a background task.

After enabling “Run in background (nohup),” you can use:

- “View Log”: Read the current background-task log.
- “Tail Log”: Continuously refresh the log.
- “Stop Tail”: Stop refreshing the page without stopping the remote task.
- “Check Process”: Check whether the background task is still running.
- “Stop Process”: Request termination of the background task, then check its state.

If “View Log” or “Check Process” fails, read the reason and check the host connection. A failed read does not mean the log is empty or the process has exited. Check again after restoring the connection; do not restart a task because its status check failed.

“Service Mode” watches a background task until it becomes available. Provide “Ready match” and “Variable Name.” Adjust the optional failure pattern and timing settings as needed:
- “Ready match”: Marks the service ready when the configured text appears. Use `|` to separate multiple patterns.
- “Fail Match”: Marks the service failed when the configured text appears.
- “Ready timeout (s)”: Sets the longest wait for the ready state, in seconds.
- “Check interval (ms)”: Sets how often the log is checked, in milliseconds; 1000 ms is 1 second.
- “Variable Name”: Stores states such as checking, ready, and timeout.

“Stop Tail” only stops log updates in the page. “Stop Process” requests termination of the background task; check the process state afterward. Service-mode tasks may be starting, being verified, stopping, or unconfirmed. An accepted request is not a final result. If the state is unknown, verify it; confirm the task has stopped before starting it again.

### Import and Export Commands

- Use the export button on a command to export it and, when selected, include its dependent host configuration.
- Select “Import Command,” choose a `.tscfg` configuration package, preview its contents, and choose whether to overwrite an existing configuration or bind it to a host currently shown on the page.

Import can replace configuration with the same ID and may include remote-host information. Follow the Security Guide to check the source and signature. If a restart is required, finish Terminal and Automation tasks before restarting.

### Check Which Rules Use a Command Before Deleting It

Deleting a command does not undo completed operations on the remote host and cannot be undone from the Commands page. First check whether sources, templates, or rules still need it.

- Service running or state unknown: Select the command's refresh icon to verify its state. Stop it if needed and confirm the result. Wait for any start, stop, or verification to finish. The delete button does not stop the remote task.
- Service stopped but deletion blocked: Check which imported rules still use the command. Update those rules first. Stopping a service or the Automation engine leaves the command in those rules. Changing the command's host or replacing host configuration may also be blocked.
- Rule read-only or awaiting restart: Follow Chapter 12. Do not delete SD files to bypass protection. Check the revised rules and connections before removing unneeded configuration.

## 12. Automation Management

“Automation” connects data and operations into repeatable workflows. Create data sources and action templates, then use rules to decide when to run them.

```text
Automatic: Data source → Variable → Rule evaluation → Actions
Manual: System-page Quick Action → Actions
```

Sources read data, variables hold values, rules evaluate conditions, and templates define tasks. Showing a rule on the panel and allowing manual execution are separate settings. Automatic rules can also appear on the panel.

### View and Control the Automation Engine

The top of the page shows the engine state, rule, variable, and source counts, trigger count, and runtime.

| Control | Effect |
| --- | --- |
| “Start” | Starts a stopped engine and begins processing enabled rules. |
| “Pause” | Pauses further automatic evaluation. Existing actions may continue. To resume through the page, stop the engine, then start it. |
| “Stop” | Attempts to stop rule checks, data reading, and scheduling later actions, while keeping configuration. Wait for confirmation; a timeout does not mean the engine has stopped. |
| “Reload” | Reads saved configuration again; an engine that was running resumes after loading. Save edits first. Blocked while rules await restart; it cannot replace a device restart. |

Check whether cooling, alerts, or other ongoing tasks depend on Automation. Stopping the engine does not stop a remote background process. Stop remote tasks from Commands or the relevant service card and confirm the result.

### Build a Minimal Automation Workflow

1. Create a source and use its test to check the connection and selected fields.
2. Enable it, then use the row’s “View Variables” icon to check values and update times.
3. Create a template, review its parameters, and select “Test.” Testing runs the action immediately; confirm that the device and host can accept it.
4. Create a rule with “Enable immediately” off. Set conditions, cooldown, action order, delays, and repetition.
5. Set “Show on panel” and “Allow manual trigger” as needed.
6. Save, then enable the rule. Check variables, trigger counts, and actual results.

### Manage Data Sources

Select “Add” under “Data Sources” and choose a type:

| Type | Purpose |
| --- | --- |
| “REST API” | Periodically reads data from an HTTP address. |
| “WebSocket” | Receives data pushed over a persistent connection. |
| “Socket.IO” | Receives events from a Socket.IO service. |
| “Command Variable” | Reads the results of a configured remote command. |

1. Enter a unique ID, display label, and the required connection information.
2. Use the test to check the connection. Obtain addresses, authentication details, and field information from the data provider.
3. For the first three types, select fields from the test response. Leaving a Socket.IO event name blank lets the test attempt event discovery.
4. For a Command Variable, select the host and a command with a configured variable name, then set the polling interval.
5. Save and enable the source. Use its “View Variables” control to check the result.

Source rows provide an enable switch, variable viewer, export, and delete controls. Check which rules use a source before disabling or deleting it, so you do not disrupt their tasks.

Import and export use configuration packages. Preview IDs, types, and replacements before import, and follow the Security Guide for source and trust requirements.

### View Variables

Select the eye-shaped “View Variables” icon on a source row. The window shows names, types, values, and update times. Remote-command variables can also be viewed from the command’s variable control.

- Confirm the names and source, and check that values and types suit the rule’s comparisons.
- Check whether update times match the expected data frequency.
- If no data is available, check that the source is enabled, then test the connection and fields. For command variables, check the command’s execution result too.

### Create and Test Action Templates

Select “Add” under “Action Templates” and choose a task type:

| Type | Purpose |
| --- | --- |
| “CLI Command” | Runs a local device-console command. |
| “SSH Command” | Runs a remote command saved on the Commands page. |
| “LED Control” | Controls LED colors, effects, or matrix content. |
| “Log” | Writes a message at the selected level. |
| “Set Variable” | Assigns a value to an Automation variable. |
| “Webhook” | The option remains visible, but action execution is not implemented. It cannot currently send a request. |

Enter a unique ID, a name, and the type-specific parameters. Set a delay or “Async Execution” if needed. An asynchronous action continues in the background; check its final result through logs, variables, or the target device.

- CLI: Enter the command, with an optional result variable and timeout.
- SSH: Choose a configured host and command, and check the preview.
- LED: Choose a device and supported color, effect, brightness, text, image, QR-code, or filter operation.
- Log: Choose a level and message; the message can reference variables.
- Set Variable: Enter the variable name and value.
- Webhook: Currently unavailable. Choose a supported action instead. Rule packages containing Webhook actions cannot be imported either.

“Test” runs the action. Check the effect of power, reboot, remote-command, or external-request operations before testing.

After editing, save and check the parameters. If saving fails, keep the draft and correct the reported issue. Imports may replace templates; check which rules use a template before deleting it. If a linked service is not confirmed stopped, verify it. Stop it if needed and confirm the result.

### Follow Action-Template Deletion Messages

If “Can't delete action template” appears, read the reason first. The template has not been deleted:

1. Rules still use the template: Select “View rules.” Remove the template from those rules, or delete unneeded rules that permit deletion, then delete the template. Disabling a rule or stopping the engine does not remove the template from the rule.
2. Service not stopped: Select “View commands.” Verify its state, stop it, and confirm the result before returning to delete the template.
3. Configuration updating or loading: Wait for it to finish. Recovery needed or usage check unavailable: Open “System Logs” on Terminal, find the cause, and restore configuration. Do not keep selecting delete.

You cannot edit an imported read-only rule directly. Ask the configuration provider to revise its package and remove the unneeded template.

If saving a rule reports that a template no longer exists, the save did not succeed. Select an existing template, review it, and save again.

### Create a Rule

1. Select “Add” under “Rules” and enter a unique ID, name, and icon.
2. Choose “Logic”: AND requires all conditions; OR requires any condition.
3. Set the cooldown for automatic triggers. Values are in ms; 1000 ms is 1 second.
4. Add conditions and choose a variable, comparison, and value. Comparisons include equal, not equal, greater than, greater or equal, less than, less or equal, value changed, and contains. Match the value type to the variable.
5. Add templates and set any action delays, repetition, and action-level conditions.
6. Set “Show on panel” and “Allow manual trigger.” The first controls card visibility on System; the second controls manual execution.
7. Review, save, and then enable the rule. Leave “Enable immediately” off while configuring it for the first time.

If saving, enabling, or disabling reports that the “backup copy is not synced,” the operation succeeded, but the backup copy did not sync. This is not a failed save or a requirement to restart. Do not remove or replace the SD card. Refresh the rule list and check its content and enable state; do not create the rule again. If the warning persists, open “System Logs” on Terminal to check for storage problems.

Match the value to the selected type. For a number, enter a specific value, not infinity or NaN (an invalid number). Enter text, a boolean (true or false), or null for the other types. Do not enter a whole JSON object or array. If the page reports an error, check the variable, comparison, and value before saving again.

### Configure Repetition and Action Conditions

| Mode | Meaning |
| --- | --- |
| “Once” | Runs once per trigger. |
| “Repeat while true” | Repeats while the action’s condition holds, up to 100 times per run. |
| “Fixed count” | Repeats for the configured count and interval, checking the action condition before each execution. |

Action conditions are separate from rule-trigger conditions. Without an action condition, “Repeat while true” continues to the per-run limit. The rule may trigger another run later.

Disabling a rule prevents new triggers; a run already started may continue. To stop scheduling later actions, select the engine's “Stop” control and wait for confirmation. Check actions already sent and remote processes separately. Completed operations are not undone.

### Create a Quick Action

“Manual Trigger Only,” “Show on panel,” and “Allow manual trigger” control whether a rule runs only manually, whether its card is visible, and whether users may execute it.

1. Enter the ID, name, and icon, then enable “Manual Trigger Only.” Such a rule needs no automatic trigger conditions.
2. Add templates and review delays, repetition, and action conditions.
3. Enable “Show on panel” and “Allow manual trigger,” then save and enable the rule.
4. Return to the System Device Panel. Check the card’s name and state, run it once, and review the result.

Automatic rules can also appear on the panel. Showing a card does not make its rule manual-only. A disabled rule may remain visible but cannot start. Give admin-facing actions clear names and appropriate log or stop controls.

### Import a Rule Configuration Package

Import rule packages on Automation, not through Security's “Verify Only” or file upload. This control checks whether the signer is trusted, whether the package belongs to this device, and whether required configuration is present. Its verification result does not apply to other package types.

Before importing, prepare:

- The SD card is mounted and writable. Packages are saved on the card. Keep it installed after import; do not remove or replace it while a restart is pending.
- The device has a valid certificate, its matching private key, and a CA chain; its time is verified. A CA chain checks certificate origins. See the Security Guide for installation steps.
- The deployment administrator has selected a trusted signer. Root login or installing HTTPS certificates does not complete this setting. Ask the deployment administrator to configure it if it is missing.
- The rule's templates, commands, and hosts are ready. Import does not install these for you. Add any missing configuration first. If the rule is enabled, also check the enable state of the configuration it uses.

A restart interrupts WebUI and device-management services. Check whether the rule is enabled and will run automatically. Confirm that it may run after restart before importing it. If it must remain inactive, ask the provider for a disabled version. Restarting TianshanOS does not stop background processes on remote hosts.

1. Select the import icon under “Rules” to open “Import Rule Config,” then choose the `.tscfg` file. Verification starts and the page displays a preview.
2. Wait for “Signing trust, target device and rule content verified.” Check the name, rule ID, and “Rule summary.” Expand “View rule content” to review conditions, actions, targets, and enable state; do not rely on the filename.
3. If the same ID exists, read “Overwrite impact.” Select “Overwrite existing config” only if you want to replace the saved version. If the file, credentials, or configuration change after preview, select the file again and reverify it.
4. Select “Confirm Import” and wait. “Saved; takes effect after restart. The running version has not changed.” confirms storage, not that the new rule is running. If the page says the configuration is already saved and active, that repeated import does not require another restart.
5. If a restart is required, save other work and review Automation and remote tasks, then restart TianshanOS from System. Keep the same SD card installed and wait for WebUI to return.
6. Return to Automation and confirm that the rule's pending-restart label has disappeared. Check its enable state, required variables, and logs. If the rule permits a safe manual check, run it once and check the device or remote-host result. For rules that cannot run manually, watch the logs and results after a normal trigger. Do not rely on the save message alone.

Imported rule packages are read-only. You cannot edit, enable, disable, or delete them directly. Ask the provider to issue a revised package for this device, then import it as described here. To disable a rule, obtain a disabled version and restart as instructed; the old version may still run until restart.

The engine's “Stop” control stops scheduling later actions. It does not change rules or undo completed operations. Stop remote background tasks separately and confirm the result.

After editing or importing, check the engine, rules, and task results. Reload or restart as instructed, then confirm that tasks work. The table below explains read-only and pending-restart restrictions.

### Distinguish Saved and Running Versions

| Page message or state | What to do |
| --- | --- |
| “Saved; restart required” | The new configuration is saved but not yet in use. Ordinary edits, enable switches, and deletion are unavailable. Arrange a device restart. |
| An older version is already running | Until restart, the old rule may still run. The manual button says “Run the current, older version”; check its effect before running it. Export returns the current running version, not the pending new package. |
| New rule not yet loaded | Manual execution is unavailable. Restart, then check its enable state and manual permissions. |
| “Deletion saved; removal requires restart” | The rule leaves the running list after restart. No new manual or automatic run can start. Check actions already sent and remote tasks separately. Confirm removal after restart. |
| Read-only rule | Ordinary edit, enable, disable, and delete controls remain unavailable after the pending-restart label disappears. Obtain and import a revised package as described above. |

Not every save needs a restart. Creating, editing, or enabling an editable rule updates the current rule when the operation succeeds. Disabling it does too. Check the operation result and rule state.

“Reload” is unavailable while rules await restart. Stopping and starting the engine does not switch those versions; restart the device.

### If Import Does Not Complete

#### Verification Failed

| Message or issue | Next step |
| --- | --- |
| Signing root not selected, signer untrusted, or signer unauthorized | Ask the deployment administrator or configuration provider to check the signing source and certificate permissions. Do not substitute Security's “Verify Only” or disable verification. |
| Package targets another device | Ask the provider to export it using this device's certificate; do not change the name inside the package. Arrange matching replacement packages before changing this device's certificate too. |
| Device time is unverified | Check and synchronize time under “Network & Time” on System, then verify the file again. |
| Configuration loading | Wait for it to finish, then verify the package again. |
| Configuration failed to load | Check System Logs, resolve the cause, and restore configuration before verifying again. |
| Required configuration missing | Add the template, command, or host named by the page, then verify again. |
| Required configuration disabled | Check whether it should be enabled. Once it is safe to run, enable it and verify again. |
| A bound service is running or its state is unconfirmed | Verify the service on Commands. Stop it if needed and confirm the result. Wait for any start, stop, or verification in progress to finish, then select the file again and reverify it. |
| Unsupported action | Ask the provider to revise the package. Rule-package import currently rejects Webhook actions; their presence in the template selector does not mean the package can be imported. |
| File, credentials, or configuration changed after preview | Select the file again, reverify it, and review overwrite impact before confirming. |

#### Save Incomplete

| Message or issue | Next step |
| --- | --- |
| SD card unavailable | Check that the card is inserted, mounted, and writable, then verify again. |
| Configuration source read-only | Restore a writable source. Do not delete files to bypass protection. |
| Save unreliable | Check storage, resolve the issue, and verify again. |
| Save outcome is unconfirmed | Refresh the rule list and check the rule and pending-restart state. If it remains uncertain, inspect System Logs. Keep the original file and do not repeat the import. |

A condition variable without a sample is not necessarily missing configuration; check when it will update. If old storage objects need cleanup, keep the SD card installed and check after restart.

### Maintain Rules and Configuration

- Manual execution requires an enabled rule that permits manual triggers, with no run of the same rule already in progress. It bypasses automatic trigger conditions and cooldown, but still applies action conditions, delays, and repetition.
- Disabling does not undo completed actions. Deletion cannot be undone from the page.
- Before editing sources, templates, or commands, check which rules use them. Verify or stop any linked service that is running, unknown, or still processing an operation. If a rule still uses the configuration, revise the rule too; stopping the service does not remove that use.
- Use this chapter's dedicated flow for rule packages. Follow the Security Guide for other packages; the rule-package verification result does not apply to them.
- If saving fails, read the message and retain the draft. If saving succeeded but refreshing failed, refresh and check the list before creating another item.
