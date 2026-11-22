--	// FileName: ChatScript.lua
--	// Written by: Xsitsu
--	// Description: Hooks main chat module up to Topbar in corescripts.

local StarterGui = game:GetService("StarterGui")
local GuiService = game:GetService("GuiService")
local MAX_COREGUI_CONNECTION_ATTEMPTS = 150 -- [web 2017] was 10

local function DoEverything()
	local Chat = require(script:WaitForChild("ChatMain"))

	local containerTable = {}
	containerTable.ChatWindow = {}
	containerTable.SetCore = {}
	containerTable.GetCore = {}


	--// Connection functions
	local function ConnectEvent(name)
		local event = Instance.new("BindableEvent")
		event.Name = name
		containerTable.ChatWindow[name] = event

		event.Event:connect(function(...) Chat[name](Chat, ...) end)
	end

	local function ConnectFunction(name)
		local func = Instance.new("BindableFunction")
		func.Name = name
		containerTable.ChatWindow[name] = func

		func.OnInvoke = function(...) return Chat[name](Chat, ...) end
	end

	local function ReverseConnectEvent(name)
		local event = Instance.new("BindableEvent")
		event.Name = name
		containerTable.ChatWindow[name] = event

		Chat[name]:connect(function(...) event:Fire(...) end)
	end

	local function ConnectSignal(name)
		local event = Instance.new("BindableEvent")
		event.Name = name
		containerTable.ChatWindow[name] = event

		event.Event:connect(function(...) Chat[name]:fire(...) end)
	end

	local function ConnectSetCore(name)
		local event = Instance.new("BindableEvent")
		event.Name = name
		containerTable.SetCore[name] = event

		event.Event:connect(function(...) Chat[name.."Event"]:fire(...) end)
	end

	local function ConnectGetCore(name)
		local func = Instance.new("BindableFunction")
		func.Name = name
		containerTable.GetCore[name] = func

		func.OnInvoke = function(...) return Chat["f"..name](...) end
	end

	--// Do connections
	ConnectEvent("ToggleVisibility")
	ConnectEvent("SetVisible")
	ConnectEvent("FocusChatBar")
	ConnectFunction("GetVisibility")
	ConnectFunction("GetMessageCount")
	ConnectEvent("TopbarEnabledChanged")
	ConnectFunction("IsFocused")

	ReverseConnectEvent("ChatBarFocusChanged")
	ReverseConnectEvent("VisibilityStateChanged")
	ReverseConnectEvent("MessagesChanged")
	ReverseConnectEvent("MessagePosted")

	ConnectSignal("CoreGuiEnabled")

	ConnectSetCore("ChatMakeSystemMessage")
	ConnectSetCore("ChatWindowPosition")
	ConnectSetCore("ChatWindowSize")
	ConnectGetCore("ChatWindowPosition")
	ConnectGetCore("ChatWindowSize")
	ConnectSetCore("ChatBarDisabled")
	ConnectGetCore("ChatBarDisabled")

	ConnectEvent("SpecialKeyPressed")

	local tries = 0
	while tries < MAX_COREGUI_CONNECTION_ATTEMPTS do
		tries = tries + 1
		local success, ret = pcall(function() StarterGui:SetCore("CoreGuiChatConnections", containerTable) end)
		if success then
			break
		end
		if not success and tries == MAX_COREGUI_CONNECTION_ATTEMPTS then
			error("Error calling SetCore CoreGuiChatConnections: " .. ret)
		end
		wait()
	end
end

local okTenFoot, isTenFoot = pcall(function() return GuiService:IsTenFootInterface() end) -- [web 2017]
-- That check is CoreScript-only in 2016. ChatSelector (CoreGui) answers the
-- same question through GetCore("UseNewLuaChat"): false on consoles (Xbox
-- mode), where the client had no text chat.
local useNewChat = nil
for i = 1, 100 do
	local ok, v = pcall(function() return StarterGui:GetCore("UseNewLuaChat") end)
	if ok then useNewChat = v break end
	wait(0.05)
end
if useNewChat == false then isTenFoot = true okTenFoot = true end
if not (okTenFoot and isTenFoot) then
	DoEverything()
end
