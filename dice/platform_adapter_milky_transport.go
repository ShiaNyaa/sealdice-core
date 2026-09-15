package dice

import milky "github.com/Szzrain/Milky-go-sdk"

// 状态管理与连接监测分开，便于从核心健康检查过渡到 SDK 原生通知。
func (pa *PlatformAdapterMilky) prepareMilkyTransport(session *milky.Session) {
	session.OnConnectionChange = func(current *milky.Session, connected bool) {
		if current.IsConnected() == connected {
			pa.onMilkyConnectionChange(current, connected)
		}
	}
}

func (pa *PlatformAdapterMilky) openMilkyTransport(session *milky.Session) error {
	return session.Open()
}

func (pa *PlatformAdapterMilky) closeMilkyTransport(session *milky.Session) error {
	return session.Shutdown()
}

func (pa *PlatformAdapterMilky) isMilkyTransportConnected(session *milky.Session) bool {
	return session.IsConnected()
}

func (pa *PlatformAdapterMilky) startMilkyConnectionMonitor(_ *milky.Session) {
	// SDK 已提供实时连接通知，不需要额外轮询。
}
