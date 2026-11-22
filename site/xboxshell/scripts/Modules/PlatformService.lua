--[[
	// PlatformService.lua  [web port]
	// Stand-in for the Xbox One engine service of the same name, which does not
	// exist outside the console build. Every shell module that did
	// require(game:GetService("CoreGui"):WaitForChild("RobloxGui"):WaitForChild("Modules"):WaitForChild("PlatformService")) gets this table instead.
	// Signing in always succeeds as the local user; starting a game asks the
	// web page to launch it (through workspace.MP_OUT, read by js/app.js).
]]
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local PlatformService = {}

local function event(name)
	local be = Instance.new("BindableEvent")
	PlatformService["_" .. name] = be
	PlatformService[name] = be.Event
end
for _, n in pairs({ "ViewChanged", "UserAccountChanged", "LostUserGamepad", "GainedUserGamepad",
	"LostActiveUser", "GainedActiveUser", "GameJoined", "Suspended", "Resumed", "RobuxAmountChanged",
	"KeyboardClosed" }) do
	event(n)
end

-- 0 = app shell (this DataModel), 1 = game
PlatformService.DatamodelType = 0
PlatformService.Brightness = 1
PlatformService.Contrast = 0
PlatformService.GrayscaleLevel = 0
PlatformService.BlurIntensity = 0
PlatformService.TintColor = Color3.new(1, 1, 1)

local SUCCESS = 0

-- Messages to the page: one JSON command at a time in workspace.MP_OUT.
local function send(cmd)
	local out = workspace:FindFirstChild("MP_OUT")
	if not out then
		out = Instance.new("StringValue")
		out.Name = "MP_OUT"
		out.Parent = workspace
	end
	cmd.seq = (PlatformService._seq or 0) + 1
	PlatformService._seq = cmd.seq
	out.Value = HttpService:JSONEncode(cmd)
end
PlatformService._send = send

local function userName()
	local p = Players.LocalPlayer
	return p and p.Name or "Player"
end

function PlatformService:GetPlatformUserInfo()
	return { Gamertag = userName(), RobloxUserId = (Players.LocalPlayer and Players.LocalPlayer.userId) or 1 }
end
function PlatformService:GetTitleId() return 0 end
function PlatformService:GetVersionIdInfo() return "web 2016 (Xbox One app shell, Durango content)" end
function PlatformService:GetPlatformId(rbxUid) return "" end

function PlatformService:BeginAuthorization() return SUCCESS end
function PlatformService:BeginAuthUnlinkCheck() return SUCCESS end
function PlatformService:BeginHasLinkedAccount() return SUCCESS end
function PlatformService:BeginHasRobloxCredentials() return SUCCESS end
function PlatformService:BeginAccountLink() return SUCCESS end
function PlatformService:BeginSetRobloxCredentials() return SUCCESS end
function PlatformService:BeginUnlinkAccount() return SUCCESS end

-- Xbox Live friends (JSON string); there are none offline.
function PlatformService:BeginFetchFriends() return '{"friends":[]}' end
function PlatformService:GetPlatformPartyMembers() return {} end
function PlatformService:GetInGamePlayers() return {} end

-- The Xbox Store's ROBUX packs, as listed by the console store.
function PlatformService:BeginGetCatalogInfo()
	return {
		{ Name = "400 ROBUX", DisplayListPrice = "$4.99", DisplayPrice = "$4.99", ProductId = "robux400" },
		{ Name = "800 ROBUX", DisplayListPrice = "$9.99", DisplayPrice = "$9.99", ProductId = "robux800" },
		{ Name = "1,700 ROBUX", DisplayListPrice = "$19.99", DisplayPrice = "$19.99", ProductId = "robux1700" },
		{ Name = "4,500 ROBUX", DisplayListPrice = "$49.99", DisplayPrice = "$49.99", ProductId = "robux4500" },
		{ Name = "10,000 ROBUX", DisplayListPrice = "$99.99", DisplayPrice = "$99.99", ProductId = "robux10000" },
		{ Name = "22,500 ROBUX", DisplayListPrice = "$199.99", DisplayPrice = "$199.99", ProductId = "robux22500" },
	}
end
-- Nothing can be bought here: report "cancelled".
function PlatformService:BeginPlatformStorePurchase(productId) return 1 end

function PlatformService:BeginHeroStat() return SUCCESS end
function PlatformService:BeginAwardAchievement() return SUCCESS end

-- Game joins: hand the place to the page, which starts it in Xbox mode.
function PlatformService:BeginStartGame3(joinType, joinId)
	send({ cmd = "play", placeId = joinId, joinType = joinType })
	return SUCCESS
end
PlatformService.BeginStartGame = PlatformService.BeginStartGame3
PlatformService.BeginStartGame2 = PlatformService.BeginStartGame3

function PlatformService:ShowKeyboard(title, description, defaultText)
	-- No on-screen keyboard: hand back the default text.
	spawn(function() PlatformService._KeyboardClosed:Fire(defaultText or "") end)
end

for _, n in pairs({ "PopupProfileUI", "PopupPartyUI", "PopupHelpUI", "PopupAccountPickerUI",
	"PopupGameInviteUI", "LaunchPlatformUri", "RequestGameShutdown" }) do
	PlatformService[n] = function() end
end

return PlatformService
