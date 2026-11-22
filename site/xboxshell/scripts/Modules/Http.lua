--[[
	// Http.lua  [web port]
	// The Xbox shell's web API module, answered locally. Same functions and
	// return shapes as the console's Http.lua (see the comments there); the data
	// is the site's own: places from places/, the free catalog, and the saved
	// favorites/recents/inventory. The page writes it as the WebData module.
]]
local HttpService = game:GetService('HttpService')
local Modules = game:GetService("CoreGui"):WaitForChild("RobloxGui"):WaitForChild("Modules")
local Data = HttpService:JSONDecode(require(Modules:WaitForChild("WebData")))

local Http = {}

local BaseUrl = Data.baseUrl or ""
Http.BaseUrl = BaseUrl
Http.AssetGameBaseUrl = BaseUrl

local function send(cmd)
	local ok, ps = pcall(function() return require(Modules:WaitForChild("PlatformService")) end)
	if ok and ps and ps._send then ps._send(cmd) end
end

local placeById = {}
for _, p in pairs(Data.places) do placeById[p.id] = p end
local favorites, recent = {}, {}
for _, id in pairs(Data.favorites or {}) do favorites[id] = true end

local function gameEntry(p)
	return {
		CreatorID = 1, CreatorName = p.creator or "ROBLOX", CreatorUrl = "",
		Plays = p.plays or 0, Price = 0, ProductID = 0, IsOwned = true,
		IsVotingEnabled = true, TotalUpVotes = 0, TotalDownVotes = 0, TotalBought = 0,
		UniverseID = p.id, HasErrorOcurred = false,
		Name = p.title, PlaceID = p.id, PlayerCount = 0, ImageId = p.id,
	}
end
local function slice(list, startRows, maxRows)
	local out = {}
	startRows = startRows or 0
	maxRows = maxRows or #list
	for i = startRows + 1, math.min(#list, startRows + maxRows) do
		out[#out + 1] = gameEntry(list[i])
	end
	return out
end
local function placesWhere(fn)
	local out = {}
	for _, p in ipairs(Data.places) do if fn(p) then out[#out + 1] = p end end
	return out
end

function Http.DecodeJSON(json)
	local ok, r = pcall(function() return HttpService:JSONDecode(json) end)
	return ok and r or nil
end

--[[ Games ]]--
function Http.GetGameSortsAsync()
	local sorts = {}
	for i, s in ipairs(Data.sorts) do
		sorts[i] = { Id = s.id, Name = s.name, TimeOptionsAvailable = false, DefaultTimeOption = 0, GenresOptionsAvailable = false }
	end
	return sorts
end
function Http.GetSortAsync(startRows, maxRows, sortId, timeFilter)
	return slice(placesWhere(function(p) return p.sort == sortId end), startRows, maxRows)
end
function Http.GetUserFavoritesAsync(startRows, maxRows)
	return slice(placesWhere(function(p) return favorites[p.id] end), startRows, maxRows)
end
function Http.GetUserRecentAsync(startRows, maxRows)
	local list = {}
	for _, id in ipairs(Data.recent or {}) do if placeById[id] then list[#list + 1] = placeById[id] end end
	return slice(list, startRows, maxRows)
end
function Http.GetUserPlacesAsync() return {} end
function Http.SearchGamesAsync(startRows, maxRows, keyword)
	keyword = string.lower(keyword or "")
	return slice(placesWhere(function(p) return string.find(string.lower(p.title), keyword, 1, true) end), startRows, maxRows)
end

--[[ Thumbnails ]]-- (no place thumbnails exist offline; catalog items have local ones)
function Http.GetAssetThumbnailFinalAsync(assetId)
	local place = placeById[assetId]
	if place then return { Url = place.thumb and (BaseUrl .. place.thumb) or "", Final = true } end
	if Data.thumbs and Data.thumbs[tostring(assetId)] then return { Url = BaseUrl .. Data.thumbs[tostring(assetId)], Final = true } end
	return { Url = "", Final = true }
end
-- The avatar picture is rendered by the engine (the page's ?render=avatar job,
-- like Roblox's thumbnail servers did for the console). After a wear the page
-- re-renders it and hands the new picture's URL back through workspace.MP_IN.
local avatarIn = workspace:FindFirstChild("MP_IN")
if not avatarIn then
	avatarIn = Instance.new("StringValue")
	avatarIn.Name = "MP_IN"
	avatarIn.Parent = workspace
end
local function readAvatarIn()
	local ok, msg = pcall(function() return HttpService:JSONDecode(avatarIn.Value) end)
	if ok and type(msg) == "table" and type(msg.avatar) == "string" and msg.avatar ~= "" then
		Data.avatarImage = msg.avatar
	end
end
avatarIn.Changed:connect(readAvatarIn)
local function awaitAvatarRender(before)
	local t0 = tick()
	while Data.avatarImage == before and tick() - t0 < 120 do wait(0.2) end
end

-- One render per size, like Thumbs/Avatar.ashx: Large 576x324 (the Avatar
-- screen fills that 16:9 shape), Medium 250x250 (the Home tile crops it in
-- 250-pixel image units) and 420x420 otherwise.
local function avatarUrl(width, height)
	local url = Data.avatarImage or ""
	if width and height and width > height then
		url = string.gsub(url, "__avatar%.png", "__avatar_l.png")
	elseif width and width <= 250 then
		url = string.gsub(url, "__avatar%.png", "__avatar_m.png")
	end
	return url
end
function Http.GetAssetAvatarFinalAsync(userId, width, height) return { Url = avatarUrl(width, height), Final = true } end
function Http.GetOutfitThumbnailFinalAsync(outfitId, width, height) return { Url = avatarUrl(width, height), Final = true } end
function Http.GetThumbnailUrlForAsset(assetId)
	local place = placeById[assetId]
	if place then return place.thumb and (BaseUrl .. place.thumb) or "" end
	if Data.thumbs and Data.thumbs[tostring(assetId)] then return BaseUrl .. Data.thumbs[tostring(assetId)] end
	return ""
end

--[[ Game details ]]--
function Http.GetGameDetailsAsync(placeId)
	local p = placeById[placeId]
	if not p then return nil end
	return {
		AssetId = p.id, Name = p.title, Description = p.description or "",
		Created = p.year and ("1/1/" .. p.year) or "", Updated = p.year and ("1/1/" .. p.year) or "",
		FavoritedCount = 0, Url = "", ReportAbuseUrl = "", IsFavoritedByUser = favorites[p.id] == true,
		IsCreatedByUser = false, VisitedCount = p.plays or 0, MaxPlayers = p.maxPlayers or 12,
		Builder = p.creator or "ROBLOX", BuilderId = 1, BuilderUrl = "", IsPlayable = true,
		ReasonProhibited = "None", ReasonProhibitedMessage = "", IsBuildersClubOnly = false,
		IsCopyLocked = false, IsPersonalServer = false, IsPersonalServerOverlay = false,
		BuildersClubOverlay = "", PlayButtonType = "PlayButton", AssetGenre = "All",
		AssetGenreViewModel = { DisplayName = "All", Id = 0 }, OnlineCount = 0,
		UniverseId = p.id, UniverseRootPlaceId = p.id, TotalUpVotes = 0, TotalDownVotes = 0,
		UserVote = nil, OverridesDefaultAvatar = false,
	}
end
function Http.GetGameIconIdAsync(placeId) return { Id = placeId, PlaceId = placeId, ImageId = placeId, IconUrl = "", IconFinal = true } end
function Http.GetGameVotesAsync()
	return { ShowVotes = true, VotingModel = { ShowVotes = true, UpVotes = 0, DownVotes = 0, CanVote = false,
		UserVote = nil, ReasonForNotVoteable = "PlayGame" } }
end
function Http.GetRecommendedGamesAsync(currentPlaceId)
	local p = placeById[currentPlaceId]
	local same = placesWhere(function(o) return p and o.sort == p.sort and o.id ~= p.id end)
	local out = {}
	for i = 1, math.min(6, #same) do
		local o = same[i]
		out[i] = { PlaceId = o.id, GameName = o.title, GameSeoUrl = "",
			Creator = { CreatorName = o.creator or "ROBLOX", CreatorTargetId = 1, CreatorType = 0 },
			GameThumbnail = { Url = "", IsFinal = true, AssetId = o.id, AssetType = 1 }, ImageId = o.id }
	end
	return out
end
function Http.GetGameThumbnailsAsync(placeId)
	local p = placeById[placeId]
	local list = {}
	if p and p.thumb then
		list[1] = { AssetId = p.id, AssetTypeId = 1, Url = BaseUrl .. p.thumb, IsFinal = true }
	end
	return { IsMobile = false, IsVideoAutoplayedOnReady = false, thumbnailCount = #list, thumbnails = list }
end
function Http.GetGameBadgeDataAsync(placeId) return { PlaceId = placeId, GameBadges = {} } end
function Http.GetGamePassesAsync(placeId) return { PlaceId = placeId, totalItems = 0, IsViewerPlaceOwner = false, data = {} } end
function Http.GetPlaceProductsAsync(placeId) return { PlaceId = placeId, totalItems = 0, IsViewerPlaceOwner = false, data = {} } end
function Http.GetGameInstancesAsync(placeId) return { PlaceId = placeId, TotalCollectionSize = 0, ShowShutdownAllButton = false, Collection = {} } end

function Http.PostFavoriteToggleAsync(assetID)
	favorites[assetID] = not favorites[assetID] or nil
	send({ cmd = "favorite", placeId = assetID, on = favorites[assetID] == true })
	return { success = true, message = "" }
end
function Http.PostGameVoteAsync() return { Success = false, ModalType = "PlayGame" } end

--[[ Social ]]-- (offline: nobody else is online)
function Http.GetUserPresenceAsync() return { IsOnline = true, LastLocation = "Online", LocationType = 0 } end
function Http.GetUsersOnlinePresenceAsync() return { UserPresences = {} } end
function Http.GetFriendsAsync(userId, currentPage, pageSize)
	return { UserId = userId, TotalFriends = 0, CurrentPage = currentPage or 1, PageSize = pageSize or 0, TotalPages = 0, Friends = {} }
end
Http.GetRequestedFriendsAsync = Http.GetFriendsAsync
function Http.GetOnlineFriendsAsync() return {} end

--[[ Currency ]]-- (everything is free here)
function Http.GetPlatformUserBalanceAsync() return { Robux = 0 } end
function Http.GetTotalUserBalanceAsync() return { robux = 0 } end
function Http.GetUserOwnsAssetAsync() return true end

--[[ Avatar ]]--
-- The console sold avatar packages; here the "packages" are your owned
-- catalog items, and choosing one wears/removes it.
function Http.GetUserOwnedPackagesAsync(userId, currentPage)
	currentPage = currentPage or 1
	local per = 24
	local items = {}
	local owned = Data.inventory or {}
	local first = (currentPage - 1) * per + 1
	for i = first, math.min(#owned, first + per - 1) do
		local it = owned[i]
		items[#items + 1] = {
			Item = { AssetId = it.id, Name = it.name, AssetType = 32 },
			Creator = { Id = 1, Name = it.creator or "ROBLOX", Type = 1 },
			Product = { PriceInRobux = 0, PriceInTickets = nil, IsForSale = true, IsPublicDomain = true,
				IsResellable = false, IsLimitedEdition = false, IsUnique = false, IsExpired = false },
			Thumbnail = { Final = true, Url = it.thumb and (BaseUrl .. it.thumb) or "" },
		}
	end
	return { IsValid = true, Data = { TotalItems = #owned, Start = first - 1, End = first - 1 + #items, Page = currentPage, Items = items } }
end
function Http.GetMyUserOutfitsAsync() return { UserOutfits = {} } end
function Http.GetCharactersAssetsAsync() return "" end
function Http.PostWearUserOutfitAsync() return { success = true } end
function Http.PostWearAssetAsync(assetId)
	-- Like the console: the wear request returns once the new avatar picture
	-- exists, so the Avatar screen's spinner covers the re-render.
	local before = Data.avatarImage
	send({ cmd = "wear", assetId = assetId })
	Data.wearing = assetId
	awaitAvatarRender(before)
	return { success = true }
end
function Http.PurchaseProductAsync(productId)
	send({ cmd = "own", assetId = productId })
	return { statusCode = 200, title = "Purchase Complete", errorMsg = "", TransactionVerb = "bought" }
end
function Http.GetXboxProductsAsync(startIndex, count)
	startIndex, count = startIndex or 0, count or 20
	local products = {}
	local all = Data.catalog or {}
	for i = startIndex + 1, math.min(#all, startIndex + count) do
		local it = all[i]
		products[#products + 1] = { AssetTypeId = 32, IconImageAssetId = 0, IsNew = false, ProductId = it.id,
			MinimumMembershipLevel = 0, Creator = { Name = it.creator or "ROBLOX", Id = 1 }, IsLimited = false,
			ContentRatingTypeId = 0, AssetId = it.id, IsPublicDomain = true, Name = it.name, IsForSale = true,
			Description = it.name, PriceInRobux = 0, Sales = 0 }
	end
	return { Products = products }
end
function Http.GetXboxCurrentlyWearingPackageAsync() return { AssetId = Data.wearing } end

--[[ Misc ]]--
function Http.ReportAbuseAsync() return { success = true } end
function Http.GetConsecutiveDaysLoggedInAsync() return { count = 1 } end
function Http.GetVoteCountAsync() return { VoteCount = 0 } end
function Http.IsValidUsername() return { IsValid = true, ErrorMessage = "" } end
function Http.IsValidPassword() return { IsValid = true, ErrorMessage = "" } end

return Http
