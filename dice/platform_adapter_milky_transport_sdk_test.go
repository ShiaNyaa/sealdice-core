//nolint:testpackage
package dice

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	milky "github.com/Szzrain/Milky-go-sdk"
	"github.com/gorilla/websocket"
)

func newMilkyStateSession(t *testing.T, pa *PlatformAdapterMilky) (*milky.Session, chan *websocket.Conn, chan struct{}) {
	t.Helper()
	peers := make(chan *websocket.Conn, 8)
	allowHandshake := make(chan struct{}, 8)
	allowHandshake <- struct{}{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-allowHandshake:
		case <-r.Context().Done():
			return
		}
		conn, err := (&websocket.Upgrader{}).Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		peers <- conn
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}))
	session, err := milky.New("ws"+strings.TrimPrefix(server.URL, "http"), server.URL, "", noopMilkyLogger{})
	if err != nil {
		t.Fatal(err)
	}
	pa.startMilkySession(session, 0)
	pa.prepareMilkyTransport(session)
	t.Cleanup(func() { close(allowHandshake); pa.stopMilkySession(); _ = session.Shutdown(); server.Close() })
	if err := session.Open(); err != nil {
		t.Fatal(err)
	}
	assertMilkyState(t, pa, StateConnecting)
	pa.finishMilkySession(session, &milky.LoginInfo{UIN: 10010, Nickname: "MilkyBot"})
	return session, peers, allowHandshake
}

func TestMilkyDisconnectedAndReconnectedState(t *testing.T) {
	for _, mode := range []string{"", "yogurt", "lagrangeV2"} {
		t.Run(mode, func(t *testing.T) {
			pa := &PlatformAdapterMilky{EndPoint: &EndPointInfo{}, BuiltInMode: mode}
			session, peers, allowHandshake := newMilkyStateSession(t, pa)
			assertMilkyState(t, pa, StateConnected)
			peer := <-peers
			_ = peer.Close()
			assertMilkyState(t, pa, StateDisconnected)
			pa.lifecycleMu.Lock()
			enabled := pa.EndPoint.Enable
			pa.lifecycleMu.Unlock()
			if !enabled {
				t.Fatal("transient disconnect disabled the endpoint")
			}
			allowHandshake <- struct{}{}
			assertMilkyState(t, pa, StateConnected)
			if !session.IsConnected() {
				t.Fatal("endpoint restored before WebSocket reconnected")
			}
		})
	}
}

func TestMilkyBotOfflineSurvivesTransportReconnect(t *testing.T) {
	pa := &PlatformAdapterMilky{EndPoint: &EndPointInfo{}}
	session, peers, allowHandshake := newMilkyStateSession(t, pa)
	pa.onMilkyBotOffline(session, "kicked offline")
	assertMilkyState(t, pa, StateDisconnected)
	_ = (<-peers).Close()
	allowHandshake <- struct{}{}
	select {
	case <-peers:
	case <-time.After(6 * time.Second):
		t.Fatal("WebSocket did not reconnect")
	}
	assertMilkyState(t, pa, StateDisconnected)
	deadline := time.Now().Add(6 * time.Second)
	for !session.IsConnected() {
		if time.Now().After(deadline) {
			t.Fatal("transport handshake timed out")
		}
		time.Sleep(10 * time.Millisecond)
	}
	pa.onMilkyMessage(session)
	assertMilkyState(t, pa, StateConnected)
}

func TestMilkyIgnoresOldAndStoppedSessionNotifications(t *testing.T) {
	pa := &PlatformAdapterMilky{EndPoint: &EndPointInfo{}}
	old, _, _ := newMilkyStateSession(t, pa)
	current, _, _ := newMilkyStateSession(t, pa)
	pa.onMilkyConnectionChange(old, false)
	pa.onMilkyBotOffline(old, "old session")
	assertMilkyState(t, pa, StateConnected)
	pa.stopMilkySession()
	pa.lifecycleMu.Lock()
	pa.EndPoint.State = StateDisconnected
	pa.EndPoint.Enable = false
	pa.lifecycleMu.Unlock()
	pa.onMilkyConnectionChange(current, true)
	pa.onMilkyMessage(current)
	assertMilkyState(t, pa, StateDisconnected)
}
