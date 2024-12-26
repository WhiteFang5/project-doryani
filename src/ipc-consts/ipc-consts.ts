/* eslint-disable @typescript-eslint/no-namespace */
export namespace IpcChannels {
	// Custom Events
	export const AppVersion = "app-version";
	export const AppUpdateAvailable = "app-update-available";
	export const AppUpdateDownloaded = "app-update-downloaded";
	export const AppRelaunch = "app-relaunch";
	export const AppQuit = "app-quit";
	export const AppQuitAndInstall = "app-quit-and-install";
	export const AppDownloadInit = "app-download-init";
	export const AppDownloadAuto = "app-download-auto";
	export const AppAutoLaunchEnabled = "app-auto-launch-enabled";
	export const AppAutoLaunchEnabledResult = "app-auto-launch-enabled-result";
	export const AppAutoLaunchChange = "app-auto-launch-change";
	export const AppAutoLaunchChangeResult = "app-auto-launch-change-result";

	export const GameFocus = "game-focus";
	export const GameBoundsChange = "game-bounds-change";
	export const GameActiveChange = "game-active-change";
	export const GameSendActiveChange = "game-send-active-change";
	export const GameLogLine = "game-log-line";

	export const ResetZoom = "reset-zoom";

	export const MainWindowBounds = "main-window-bounds";

	export const BrowserRetrieve = "browser-retrieve";
	export const BrowserOpenAndWait = "browser-open-and-wait";
	export const BrowserOpen = "browser-open";
	export const BrowserClose = "browser-close";
	export const BrowserMinimized = "browser-minimized";
	export const BrowserRestored = "browser-restored";
	export const BrowserClosed = "browser-closed";

	export const ShowUserSettings = "show-user-settings";
	export const UserSettingsChanged = "user-settings-changed";

	export const RegisterShortcut = 'register-shortcut';
	export const UnregisterShortcut = 'unregister-shortcut';
	export const ShortcutPrefix = 'shortcut-';

	// Input related events
	export const GetClipboard = "get-clipboard";
	export const SetClipboard = "set-clipboard";
	export const KeyTap = "key-tap";
	export const KeyToggle = "key-toggle";

	// Electron App/Screen/Window Events
	export const SetIgnoreMouseEvents = "set-ignore-mouse-events";
	export const GetCursorScreenPoint = "get-cursor-screen-point";
	export const GetContentBounds = "get-content-bounds";
	export const GetBounds = "get-bounds";
	export const GetZoomFactor = "get-zoom-factor";
	export const SetZoomFactor = "set-zoom-factor";
	export const SetSize = "set-size";
	export const SetFocusable = "set-focusable";
	export const SetSkipTaskbar = "set-skip-taskbar";
	export const OpenRoute = "open-route";
	export const WindowCommand = "window-cmd";
	export const WindowFocus = "window-focus";
	export const WindowBlur = "window-blur";
	export const WindowCloseReq = "window-close-req";
	export const Log = "log";

	export enum WindowCommands {
		Show,
		Hide,
		Minimize,
		Restore,
		Focus,
		Blur,
		Close,
	}
}
