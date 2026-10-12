# TianshanOS admin 日常使用指南

本指南依据 TianshanOS 0.6.2 编写。后续版本中未变化的功能和操作，仍可参考本指南。若界面、提示或操作结果不同，请查阅所用版本的说明。

本指南面向使用 admin 账户的用户，介绍系统查看、设备控制、网络、文件和固件升级。终端、远程指令与自动化配置由 root 运维指南说明；安全管理请参阅单独的安全指南。

按设备页面显示的功能操作。部分选项需要指定硬件或配置才会出现。电脑上将指针停在图标按钮上，可查看按钮名称。

## 1. 开始使用

### 进入 WebUI

1. 在浏览器中打开管理员提供的设备网页地址（WebUI）。
2. 点击页面右上角的“登录”。
3. 用户名保持为 `admin`，输入设备提供的 admin 密码。
4. 点击“登录”。登录成功后，右上角会显示当前用户名。

使用默认密码登录后，页面会显示“安全提醒”。输入当前密码，再输入两次新密码，点击“立即修改”。两次新密码必须一致。点击“稍后修改”可关闭提醒。

使用完毕后，点击右上角的“退出登录”。再次操作设备时需要重新登录。

### 切换语言

点击页面顶部的语言按钮，在菜单中选择中文或 English。页面内容和按钮名称会立即切换到所选语言。

### 页面导航

admin 日常使用的主要入口如下：

- “系统”：查看设备状态，控制模组、风扇和 LED，并进入 OTA 升级。
- “网络”：查看以太网和 DHCP 状态，设置 WiFi 和 NAT 网络转发。
- “文件”：管理 SD 卡和 SPIFFS 中的文件。
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
4. 状态未知或启动被阻止时，先使用页面提供的核验功能，或请 root 用户检查规则、远程指令和主机连接。

无法启动时，按提示处理，不要连续点击：

- 规则已停用，或不允许手动触发：请 root 用户检查规则设置，不要把看到卡片当作运行许可。
- 任务正在执行、启动、核验或停止：等待状态更新。
- 关联服务已在运行：无需再启动。需要重启服务时，先停止并确认结果。
- 服务是否停止尚未确认：先核验状态。无法确认时，请 root 用户检查主机连接。
- 规则尚未加载，或等待重启移除：请 root 用户核对规则版本和待重启提示。
- 自动化暂不接受启动请求：请 root 用户检查引擎和配置状态，不要自行重启设备。

重新启动服务前，先确认它已停止。页面接受启动或停止请求后，任务可能仍在处理中；等待最终状态。完成一次点击后，等待几秒再启动其他操作。

长按卡片，出现排序提示后拖动，可以调整显示顺序。

没有可用卡片时，先分清页面提示：

- “快捷操作正在加载”：等待配置加载完成；长时间没有变化时，刷新页面或联系 root 用户检查。
- “快捷操作暂不可用”：联系 root 用户处理。不要反复点击启动。
- 没有已配置的快捷操作：如需添加，请联系 root 用户检查规则的“显示在面板”设置。

导入规则包后，卡片可能仍运行旧任务，直到设备重启。新导入或待移除的规则也可能无法启动。任务刚被调整时，先请 root 用户确认当前使用的版本，再执行。

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

规则配置包请交给 root 用户，从“自动化”页面导入。不要用普通文件上传代替规则导入。其他配置包的来源和签名说明见安全指南。

### 批量操作

勾选文件或文件夹后，页面会显示批量工具栏。

- “批量下载”下载选中的文件。文件夹不会加入下载内容。
- “批量删除”删除选中的文件和文件夹。
- “取消选择”清除当前选择。

### 删除文件或文件夹

删除操作无法从 WebUI 撤销。删除文件夹时，其中的全部内容也会被删除。确认名称和路径后，再点击“删除”或“批量删除”并确认。

### 挂载和卸载 SD 卡

卸载后，SD 卡中的文件会暂时无法访问。先确认上传、下载等文件操作已结束，再点击“卸载 SD”。

设备用 SD 卡保存自动化配置时，拔卡或换卡可能导致重启后无法加载配置。先请 root 用户确认可以卸载。页面要求保留 SD 卡时，不要卸载或拔出。

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

0.6.2 改变了自动化配置的保存方式。回退旧固件前，请 root 用户或设备提供方确认旧固件能否读取这些配置，并准备备份和恢复方法。

回滚只切换固件，不会把配置恢复成旧格式。回退后，原有规则不一定能继续使用。

## 9. 安全管理入口

点击顶部导航中的“安全”进入安全管理页面。SSH 密钥、远程主机、主机指纹、HTTPS 证书、配置包和账户管理的操作请查看《TianshanOS 安全指南》。本指南不重复这些内容。

### 遇到失败或结果未确认

填写表单时，字段旁可能出现红色标记和错误说明。先按说明修正该字段，再保存。标记消失不代表已经保存成功；还要检查保存提示和列表。

先看哪项操作失败，再阅读原因和下一步。提示没有说明原因时，不要猜测。

如果提示提供“详情”，点击后可查看更多信息。点击“收起”可隐藏详情。页面提供 × 时，可点击它关闭提示。需要求助时，保留提示和详情，交给 root 用户检查。

出现“结果未确认”时，先刷新并检查设备、文件或任务状态。超时或断开连接不代表操作没有执行；不要立即重复断电、删除、启动任务或升级。仍无法确认时，请 root 用户检查。

批量操作后，分别检查成功、失败和未确认的项目。下载文件后，在浏览器下载列表中确认文件已保存。

# TianshanOS Admin User Guide

This guide is based on TianshanOS 0.6.2. It can still be used with later versions where features and steps remain unchanged. If controls, messages, or results differ, check the guidance for your installed version.

This guide covers system checks, device controls, networking, files, and firmware updates for the admin account. The Root Operations Guide covers terminal access, remote commands, and Automation configuration. See the separate Security Guide for security management.

Use the controls shown on your device. Some need specific hardware or configuration. On a computer, hover over an icon button to see its name.

## 1. Getting Started

### Open the WebUI

1. Open the device’s web interface (WebUI) using the address provided by your administrator.
2. Select “Login” in the upper-right corner.
3. Keep `admin` as the username and enter the admin password supplied with the device.
4. Select “Login.” After a successful login, the current username appears in the upper-right corner.

Logging in with the default password opens a “Security Reminder.” Enter the current password, then enter the new password twice and select “Change Now.” Both new-password entries must match. Select “Later” to close the reminder.

When you have finished, select “Logout” in the upper-right corner. You will need to sign in again to use the device.

### Switch Languages

Select the language button at the top of the page, then choose Chinese or English. Page content and control labels switch immediately.

### Page Navigation

The main admin pages are:

- “System”: View device status, control modules, fans, and LEDs, and open OTA Update.
- “Network”: Check Ethernet status and DHCP clients, configure WiFi, and manage NAT forwarding.
- “Files”: Manage files on the SD Card and SPIFFS.
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
4. If the state is unknown or starting is blocked, use the available verification control, or ask a root user to check the rule, remote command, and host connection.

If starting is blocked, follow the reason shown. Do not keep selecting start:

- Rule disabled or manual triggering not allowed: Ask a root user to check the rule settings. A visible card is not permission to run it.
- Task executing, starting, verifying, or stopping: Wait for the state to update.
- Linked service already running: Do not start it again. To restart it, stop it first and confirm the result.
- Service not confirmed stopped: Verify its state. If it remains unclear, ask a root user to check the host connection.
- Rule not loaded or awaiting removal after restart: Ask a root user to check the rule version and pending-restart message.
- Automation not accepting start requests: Ask a root user to check the engine and configuration state. Do not restart the device yourself.

Confirm that a service has stopped before restarting it. An accepted start or stop request may still be in progress; wait for the final state. After triggering one action, wait a few seconds before starting another.

Press and hold a card until the reorder indicator appears, then drag it to change the display order.

If no cards are available, check which message the page shows:

- “Loading quick actions”: Wait for configuration to finish loading. If the message persists, refresh the page or ask a root user to investigate.
- “Quick actions unavailable”: Ask a root user for help. Do not keep selecting start.
- No configured Quick Actions: If you need one, ask a root user to check the rules’ “Show on panel” setting.

After importing a rule package, a card may still run the old task until the device restarts. Newly imported rules or rules awaiting removal may not start. If a task was recently changed, ask a root user to confirm which version is in use before running it.

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

Give rule packages to a root user to import on Automation. Ordinary file upload is not a substitute for rule import. See the Security Guide for source and signature guidance for other packages.

### Batch Operations

After selecting files or folders, the batch toolbar appears.

- “Batch Download” downloads selected files. Folders are not included.
- “Batch Delete” deletes selected files and folders.
- “Clear Selection” clears the current selection.

### Delete a File or Folder

Deletion cannot be undone in the WebUI. Deleting a folder also deletes all of its contents. Confirm the name and path before selecting “Delete” or “Batch Delete” and approving the prompt.

### Mount and Unmount the SD Card

Unmounting makes SD files temporarily unavailable. Finish uploads, downloads, and other file operations, then select “Unmount SD.”

Removing or replacing a card that stores Automation configuration may prevent it from loading after restart. Ask a root user to confirm that unmounting is safe. Do not unmount or remove the card when the page tells you to keep it installed.

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

Version 0.6.2 changes how Automation configurations are saved. Before returning to older firmware, ask a root user or the device provider whether it can read these configurations, and prepare a backup and recovery method.

Rollback changes the firmware, not the configuration format. Existing rules may no longer work after a downgrade.

## 9. Security Management Entry

Select “Security” in the top navigation to open security management. Use the TianshanOS Security Guide for SSH keys, remote hosts, known-host fingerprints, HTTPS certificates, configuration packages, and account management. These procedures are not repeated here.

### Failed or Unconfirmed Operations

Forms may mark a field in red and show an error beside it. Correct that field as instructed, then save. A cleared error mark does not confirm a successful save; check the save message and list too.

Check which operation failed, then read the reason and next step. If the message gives no reason, do not guess.

If “Details” is available, select it to see more information. Select “Hide” to hide the details. If a × button is shown, select it to dismiss the message. When asking for help, keep a record of the message and details for a root user to check.

If the result is unconfirmed, refresh and check the device, file, or task state. A timeout or lost connection does not mean the operation failed to run. Do not immediately repeat power, delete, task-start, or upgrade operations. Ask a root user to investigate if the result remains unclear.

For batch actions, check successful, failed, and unconfirmed items separately. Confirm downloaded files in the browser’s download list.
