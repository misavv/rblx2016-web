local scriptContext = game:GetService("ScriptContext")
local rbxGui = Game:GetService("CoreGui"):FindFirstChild("RobloxGui")

scriptContext:AddCoreScriptLocal("CoreScripts/AppHome", rbxGui)

-- TODO: Clean this up so it doesn't get created anymore, but for now we should remove it
spawn(function()
	local controlFrame = rbxGui:WaitForChild('ControlFrame')
	controlFrame:Destroy()
end)

-- [web] The app shell has no avatar in the world (the console's shell
-- DataModel never spawned one); the web engine creates a local player for
-- every place, so remove its character and stop respawns.
spawn(function()
	local Players = game:GetService("Players")
	pcall(function() Players.CharacterAutoLoads = false end)
	local lp = Players.LocalPlayer
	while not lp do Players.ChildAdded:wait() lp = Players.LocalPlayer end
	local function remove()
		local c = lp.Character
		if c then pcall(function() c:Destroy() end) pcall(function() lp.Character = nil end) end
	end
	lp.CharacterAdded:connect(function() wait() remove() end)
	lp.Changed:connect(function(prop) if prop == "Character" then wait() remove() end end)
	-- The engine may assign the character directly after load; keep checking.
	while true do remove() wait(0.5) end
end)
